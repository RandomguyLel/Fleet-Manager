import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create CSDD context
const CsddContext = createContext();

export const useCsdd = () => {
  return useContext(CsddContext);
};

export const CsddProvider = ({ children }) => {
  const { getAuthHeader } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // State for CSDD integration
  const [csddIntegration, setCsddIntegration] = useState({
    connectionStatus: 'checking',
    userInfo: null,
    credentials: { email: '', password: '' }
  });
    // Check session on component mount
  useEffect(() => {
    checkCsddSession();
  }, []);
  
  const checkCsddSession = async () => {
    try {
      console.log('[Frontend] Checking for active CSDD session...');
      
      const response = await fetch(`${apiUrl}/api/integrations/csdd/session/default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // If we have an active session, update the integration status
      if (data.success && data.connected) {
        console.log('[Frontend] Found active CSDD session');
        setCsddIntegration({
          connectionStatus: 'connected',
          userInfo: data.userInfo,
          credentials: { email: data.userInfo?.email || '' }
        });
      } else {
        console.log('[Frontend] No active CSDD session found');
        setCsddIntegration({
          connectionStatus: 'disconnected',
          userInfo: null,
          credentials: { email: '', password: '' }
        });
      }
    } catch (error) {
      console.error('Error checking CSDD session:', error);
      setCsddIntegration({
        connectionStatus: 'error',
        userInfo: null,
        credentials: { email: '', password: '' }
      });
    }
  };
    // Connect to e.CSDD.lv
  const connectToCsdd = async (credentials) => {
    try {
      setCsddIntegration({
        ...csddIntegration,
        connectionStatus: 'connecting'
      });
      
      console.log('[Frontend] Attempting to connect to CSDD with credentials...');

      const response = await fetch(`${apiUrl}/api/integrations/csdd/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          userId: 'default' // Using a default user ID for this example
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('[Frontend] CSDD login error:', data.message);
        setCsddIntegration({
          connectionStatus: 'error',
          userInfo: null,
          credentials: { email: credentials.email, password: '' },
          error: data.message || 'Failed to log in. Please check your credentials.'
        });
        return false;
      }
      
      console.log('[Frontend] Successfully connected to CSDD!');
      
      // Update the integration state
      setCsddIntegration({
        connectionStatus: 'connected',
        userInfo: data.userInfo,
        credentials: { email: credentials.email, password: '' }
      });
      
      return true;
    } catch (error) {
      console.error('Error connecting to CSDD:', error);
      setCsddIntegration({
        connectionStatus: 'error',
        userInfo: null,
        credentials: { email: credentials.email, password: '' },
        error: 'An error occurred while connecting. Please try again.'
      });
      return false;
    }
  };
  
  // Disconnect from e.CSDD.lv
  const disconnectFromCsdd = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/integrations/csdd/disconnect/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset the integration state
      setCsddIntegration({
        connectionStatus: 'disconnected',
        userInfo: null,
        credentials: { email: csddIntegration.credentials.email, password: '' }
      });
      
      console.log('[Frontend] Disconnected from CSDD');
      return true;
    } catch (error) {
      console.error('Error disconnecting from CSDD:', error);
      setCsddIntegration({
        ...csddIntegration,
        connectionStatus: 'error',
        error: 'An error occurred while disconnecting. Please try again.'
      });
      return false;
    }
  };
  
  // Fetch vehicle details from CSDD
  const fetchVehicleDetails = async (plateNumber) => {
    try {
      if (!plateNumber) {
        return { 
          success: false, 
          message: 'Please enter a license plate number first'
        };
      }

      console.log('[Frontend] Fetching vehicle details for:', plateNumber);
      
      const response = await fetch(`${apiUrl}/api/integrations/csdd/vehicle/${plateNumber}?userId=default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          message: data.message || 'Failed to retrieve vehicle information'
        };
      }
      
      console.log('[Frontend] Successfully retrieved vehicle details:', data);
      return data;
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  };
  
  const value = {
    csddIntegration,
    checkCsddSession,
    connectToCsdd,
    disconnectFromCsdd,
    fetchVehicleDetails
  };
  
  return (
    <CsddContext.Provider value={value}>
      {children}
    </CsddContext.Provider>
  );
};
