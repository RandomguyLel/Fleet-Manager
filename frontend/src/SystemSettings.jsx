import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCsdd } from './CsddContext';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';
import Sidebar from './components/Sidebar';
import { useTranslation } from 'react-i18next';

const SystemSettings = () => {  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('integrations');
  
  // Get CSDD integration state from context
  const { 
    csddIntegration, 
    connectToCsdd: connectToCsddContext, 
    disconnectFromCsdd: disconnectFromCsddContext, 
    checkCsddSession 
  } = useCsdd();
  
  // Local state for form handling
  const [csddCredentials, setCsddCredentials] = useState({
    email: csddIntegration.credentials?.email || '',
    password: ''
  });
  const [csddError, setCsddError] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  
  // Check session on component mount
  useEffect(() => {
    checkCsddSession();
  }, []);
  
  // Update local form state when csddIntegration changes
  useEffect(() => {
    if (csddIntegration.credentials?.email) {
      setCsddCredentials(prevState => ({
        ...prevState,
        email: csddIntegration.credentials.email
      }));
    }
  }, [csddIntegration]);
  
  // Connect to e.CSDD.lv using the context
  const connectToCsdd = async () => {
    try {
      setCsddError(null);
      setFetchingData(true);
      
      const result = await connectToCsddContext(csddCredentials);
      
      if (!result) {
        setCsddError('Failed to log in. Please check your credentials.');
      } else {
        // Clear password form field after successful connection
        setCsddCredentials({
          ...csddCredentials,
          password: ''
        });
      }
    } catch (error) {
      console.error('Error connecting to CSDD:', error);
      setCsddError('An error occurred while connecting. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };
  
  // Disconnect from e.CSDD.lv using the context
  const disconnectFromCsdd = async () => {
    try {
      setFetchingData(true);
      await disconnectFromCsddContext();
    } catch (error) {
      console.error('Error disconnecting from CSDD:', error);
      setCsddError('An error occurred while disconnecting. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="shrink-0 flex items-center">
                <span className="text-2xl text-blue-600 dark:text-blue-400">🚚</span>
              </div>
              <div className="ml-4 text-xl font-medium text-gray-800 dark:text-white">Fleet Manager</div>
            </div>
            <div className="flex items-center">
              <NotificationBell />
              <div className="ml-4">
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900 dark:text-white">{t('common.systemSettings')}</h1>
              </div>

              <div className="mt-6 bg-white shadow rounded-lg dark:bg-gray-800">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('integrations')}
                      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === 'integrations'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t('settings.integrations')}
                    </button>
                    <button
                      onClick={() => setActiveTab('general')}
                      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === 'general'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t('settings.general')}
                    </button>
                    <button
                      onClick={() => setActiveTab('about')}
                      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === 'about'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t('settings.about')}
                    </button>
                  </nav>
                </div>

                <div className="px-4 py-5 sm:p-6">
                  {/* Integrations Tab */}
                  {activeTab === 'integrations' && (
                    <div className="space-y-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">e.CSDD.lv Integration</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Connect to e.CSDD.lv to automatically fetch vehicle details and insurance information.
                        </p>
                        
                        {csddIntegration.connectionStatus === 'connected' ? (
                          <div>
                            <div className="p-4 bg-green-50 rounded-md mb-4 dark:bg-green-900/30">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <span className="text-green-400 dark:text-green-300">✓</span>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Connected to e.CSDD.lv</h3>
                                  <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                                    <p>User: {csddIntegration.userInfo?.firstName || ''} {csddIntegration.userInfo?.lastName || ''}</p>
                                    <p>Email: {csddIntegration.credentials?.email || 'Unknown'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <button 
                                  type="button" 
                                  onClick={disconnectFromCsdd}
                                  disabled={fetchingData}
                                  className="px-4 py-2 text-sm border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/30"
                                >
                                  {fetchingData ? t('common.loading') : t('settings.disconnectFromCsdd')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {csddError && (
                              <div className="p-4 bg-red-50 rounded-md dark:bg-red-900/30">
                                <div className="flex">
                                  <div className="flex-shrink-0">
                                    <span className="text-red-400 dark:text-red-300">❌</span>
                                  </div>
                                  <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                                    <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                      <p>{csddError}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">Email</label>
                              <input
                                type="email"
                                value={csddCredentials.email}
                                onChange={(e) => setCsddCredentials({...csddCredentials, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">Password</label>
                              <input
                                type="password"
                                value={csddCredentials.password}
                                onChange={(e) => setCsddCredentials({...csddCredentials, password: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <button 
                                type="button" 
                                onClick={connectToCsdd}
                                disabled={fetchingData || !csddCredentials.email || !csddCredentials.password}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                              >
                                {fetchingData ? t('common.loading') : t('settings.connectToCsdd')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Other integrations can be added here */}
                      <div className="p-4 border border-dashed border-gray-300 rounded-md dark:border-gray-700">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <p className="text-sm">{t('settings.moreIntegrationsComingSoon')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Settings Tab */}
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <p className="text-gray-500 dark:text-gray-400">{t('settings.generalSettingsComingSoon')}</p>
                      
                      <div className="p-4 border border-dashed border-gray-300 rounded-md dark:border-gray-700">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <p className="text-sm">{t('common.comingSoon')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* About Tab */}
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="text-3xl text-blue-600 mb-2">🚚</div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">Fleet Manager</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Version 0.5.0 Alpha</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-md dark:bg-gray-700/30">
                        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('settings.about')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          Fleet Manager is a comprehensive solution for managing vehicle fleets, 
                          service history, and document management.
                        </p>
                        
                        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('settings.acknowledgements')}</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                          <li>React Icons - https://react-icons.github.io/react-icons/</li>
                          <li>Tailwind CSS - https://tailwindcss.com/</li>
                        </ul>
                      </div>
                      
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Fleet Manager. Developed by RandomguyLel</p>
                        <p className="mt-1">Last updated: May 10, 2025</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemSettings;
