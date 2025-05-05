import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const DebugUtils = ({ onClose }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const generateSampleData = async (type) => {
    setLoading(true);
    setResult(null);
    try {
      // Generate different types of test data based on the parameter
      let endpoint = '';
      let action = '';

      switch (type) {
        case 'vehicles':
          endpoint = '/api/debug/generate-vehicles';
          action = 'Generated sample vehicles';
          break;
        case 'service-history':
          endpoint = '/api/debug/generate-service-history';
          action = 'Generated sample service history records';
          break;
        case 'expired-reminders':
          endpoint = '/api/debug/generate-expired-reminders';
          action = 'Generated vehicles with expired reminders';
          break;
        case 'upcoming-reminders':
          endpoint = '/api/debug/generate-upcoming-reminders';
          action = 'Generated vehicles with upcoming reminders';
          break;
        default:
          setResult({ success: false, message: 'Invalid data type selected' });
          setLoading(false);
          return;
      }

      // Send request to the backend
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: response.ok ? `${action} successfully` : `Error: ${data.error || 'Unknown error'}`,
        data: data
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[600px] flex flex-col max-h-[90vh] my-4 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center bg-white z-10 rounded-t-lg sticky top-0 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white">Debug Tools</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={onClose}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/30 dark:border-yellow-500">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    These tools will add sample data to your database. Use only in development environments.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Generate Sample Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    className="px-4 py-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800"
                    onClick={() => generateSampleData('vehicles')}
                    disabled={loading}
                  >
                    <span className="mr-2">🚗</span>
                    Add Sample Vehicles
                  </button>
                  <button
                    className="px-4 py-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800"
                    onClick={() => generateSampleData('service-history')}
                    disabled={loading}
                  >
                    <span className="mr-2">🔧</span>
                    Add Service Records
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Generate Test Cases</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    className="px-4 py-3 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center dark:bg-red-700 dark:hover:bg-red-800"
                    onClick={() => generateSampleData('expired-reminders')}
                    disabled={loading}
                  >
                    <span className="mr-2">⏰</span>
                    Add Expired Reminders
                  </button>
                  <button
                    className="px-4 py-3 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center justify-center dark:bg-amber-700 dark:hover:bg-amber-800"
                    onClick={() => generateSampleData('upcoming-reminders')}
                    disabled={loading}
                  >
                    <span className="mr-2">📅</span>
                    Add Upcoming Reminders
                  </button>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Update Notifications</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    className="px-4 py-3 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center dark:bg-green-700 dark:hover:bg-green-800"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const response = await fetch(`${apiUrl}/api/notifications/generate?force=true`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeader()
                          }
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setResult({
                            success: true,
                            message: `Generated ${data.notificationsCreated} notifications from current reminders`,
                            data: data
                          });
                        } else {
                          const error = await response.json();
                          setResult({
                            success: false,
                            message: `Error: ${error.error || 'Failed to generate notifications'}`,
                          });
                        }
                      } catch (error) {
                        setResult({
                          success: false,
                          message: `Error: ${error.message}`
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    <span className="mr-2">🔔</span>
                    Generate Notifications from Reminders
                  </button>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {result && (
              <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {result.message}
                    </p>
                    {result.data && result.success && (
                      <div className="mt-2">
                        <details>
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            View details
                          </summary>
                          <div className="mt-2 text-xs overflow-auto max-h-32 p-2 bg-gray-50 rounded dark:bg-gray-800">
                            {result.data.vehicles && (
                              <span>Created {result.data.vehicles.length} vehicles</span>
                            )}
                            {result.data.records && (
                              <span>Created {result.data.records.length} service records</span>
                            )}
                            {result.data.notificationsCreated && (
                              <span>Created {result.data.notificationsCreated} notifications</span>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 flex justify-end space-x-2 dark:bg-gray-700 dark:border-gray-600">
          <button 
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md dark:text-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugUtils;