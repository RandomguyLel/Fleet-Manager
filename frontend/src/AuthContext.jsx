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
  const navigate = useNavigate();
  
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
      
      const response = await fetch('http://localhost:3000/api/auth/me', {
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
  }, []);
  
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
        await fetch('http://localhost:3000/api/auth/logout', {
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
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, render the children
  return isAuthenticated ? children : null;
};