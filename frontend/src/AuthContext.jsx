// filepath: c:\Users\ritva\Desktop\TMS\Fleet Manager\frontend\src\AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component to wrap around the app
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Get saved preference from localStorage
    const savedMode = localStorage.getItem('darkMode');
    // Default to user's system preference if no saved preference
    if (savedMode === null) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return savedMode === 'true';
  });
  const navigate = useNavigate();
  
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Apply dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
  
  // Check for token in localStorage or sessionStorage
  const getToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  };
  
  // Get user from storage
  const getUser = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from storage:', e);
        return null;
      }
    }
    return null;
  };
  
  // Check token expiry
  const isTokenExpired = () => {
    const expiryStr = localStorage.getItem('tokenExpiry') || sessionStorage.getItem('tokenExpiry');
    if (!expiryStr) return true;
    
    const expiryDate = new Date(expiryStr);
    return expiryDate <= new Date();
  };
  
  // Create auth header with the token
  const getAuthHeader = useCallback(() => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  
  // Refresh user data from server
  const refreshUserData = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return false;
      
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Update user data in storage
        const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(userData));
        // Update current user state
        setCurrentUser(userData);
        return true;
      } else {
        // Token is invalid
        return false;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return false;
    }
  }, [apiUrl]);
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        setAuthError(null);
        
        const token = getToken();
        
        if (token && !isTokenExpired()) {
          // Try to refresh user data from server
          const success = await refreshUserData();
          
          if (!success) {
            // If refresh failed, try to use stored user data
            const storedUser = getUser();
            if (storedUser) {
              setCurrentUser(storedUser);
            } else {
              // No valid user data, log out
              await logout(true);
            }
          }
        } else if (token && isTokenExpired()) {
          // Token has expired, log out silently
          await logout(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, [refreshUserData]);
  
  // Login function
  const login = (userData, token, expiryDate, rememberMe = false) => {
    // Store token and user data
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('authToken', token);
    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('tokenExpiry', expiryDate);
    
    // Set current user
    setCurrentUser(userData);
  };
  
  // Logout function
  const logout = async (silent = false) => {
    try {
      const token = getToken();
      if (token && !silent) {
        // Call the logout API only for explicit logouts
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear stored data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('tokenExpiry');
      
      // Reset current user
      setCurrentUser(null);
      
      // Redirect to login (only for explicit logouts)
      if (!silent) {
        navigate('/login');
      }
    }
  };
  
  // Value to be provided by context
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    authError,
    darkMode,
    setDarkMode,
    login,
    logout,
    getAuthHeader,
    refreshUserData
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route component
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login with the current location for later redirect back
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, isLoading, navigate, location]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, render the children
  return isAuthenticated ? children : null;
};

// Admin Protected Route component
export const AdminProtectedRoute = ({ children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        navigate('/login', { state: { from: location } });
      } else if (!isAdmin) {
        // Redirect to dashboard if authenticated but not an admin
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate, location]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only render if authenticated and an admin
  return (isAuthenticated && isAdmin) ? children : null;
};