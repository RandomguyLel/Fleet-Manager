import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCsdd } from './CsddContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import { useTranslation } from 'react-i18next';

const SystemSettings = () => {  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('integrations');
  
  // Get CSDD integration state from context
  const { 
    csddIntegration, 
    connectToCsdd: connectToCsddContext, 
    disconnectFromCsdd: disconnectFromCsddContext, 
    checkCsddSession,
    saveCredentials,
    deleteSavedCredentials
  } = useCsdd();
  
  // Local state for form handling
  const [csddCredentials, setCsddCredentials] = useState({
    email: csddIntegration.credentials?.email || '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
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
    setRememberMe(csddIntegration.hasSavedCredentials);
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
        // Save credentials if remember me is checked
        if (rememberMe) {
          await saveCredentials(csddCredentials);
        } else if (csddIntegration.hasSavedCredentials) {
          // Delete saved credentials if remember me is unchecked
          await deleteSavedCredentials();
        }
        
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
      
      // Delete saved credentials when disconnecting
      if (csddIntegration.hasSavedCredentials) {
        await deleteSavedCredentials();
        setRememberMe(false);
      }
    } catch (error) {
      console.error('Error disconnecting from CSDD:', error);
      setCsddError('An error occurred while disconnecting. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  // Sidebar collapsed state (lifted up)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      return savedState === 'true';
    }
    return window.innerWidth < 768;
  });
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <div className="py-6 mt-16">
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
                    {/* <button
                      onClick={() => setActiveTab('general')}
                      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === 'general'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t('settings.general')}
                    </button> */}
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">{t('settings.csddIntegration.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {t('settings.csddIntegration.description')}
                        </p>
                        
                        {csddIntegration.connectionStatus === 'connected' ? (
                          <div>
                            <div className="p-4 bg-green-50 rounded-md mb-4 dark:bg-green-900/30">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <span className="text-green-400 dark:text-green-300">✓</span>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300">{t('settings.csddIntegration.connected')}</h3>
                                  <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                                    <p>{t('settings.csddIntegration.user')}: {csddIntegration.userInfo?.firstName || ''} {csddIntegration.userInfo?.lastName || ''}</p>
                                    <p>{t('settings.csddIntegration.email')}: {csddIntegration.credentials?.email || 'Unknown'}</p>
                                    {csddIntegration.hasSavedCredentials && (
                                      <p className="mt-1 text-xs text-green-600">{t('settings.csddIntegration.credentialsSaved')}</p>
                                    )}
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
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('settings.csddIntegration.error')}</h3>
                                    <div className="mt-2 text-sm text-red-700 dark:text-green-400">
                                      <p>{csddError}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('settings.csddIntegration.email')}</label>
                              <input
                                type="email"
                                value={csddCredentials.email}
                                onChange={(e) => setCsddCredentials({...csddCredentials, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('auth.password')}</label>
                              <input
                                type="password"
                                value={csddCredentials.password}
                                onChange={(e) => setCsddCredentials({...csddCredentials, password: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                              />
                              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                {t('settings.csddIntegration.rememberCredentials')}
                              </label>
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

                      {/* Other integrations can be added here
                      <div className="p-4 border border-dashed border-gray-300 rounded-md dark:border-gray-700">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <p className="text-sm">{t('settings.moreIntegrationsComingSoon')}</p>
                        </div>
                      </div> */}
                    </div>
                  )}

                  {/* General Settings Tab */}
                  {/* {activeTab === 'general' && (
                    <div className="space-y-6">
                      <p className="text-gray-500 dark:text-gray-400">{t('settings.generalSettingsComingSoon')}</p>
                      
                      <div className="p-4 border border-dashed border-gray-300 rounded-md dark:border-gray-700">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <p className="text-sm">{t('common.comingSoon')}</p>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* About Tab */}
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="text-3xl text-blue-600 mb-2">🚚</div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">{t('common.fleetManager')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Version 0.8</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-md dark:bg-gray-700/30">
                        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('settings.about')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          {t('common.fleetManager')} {t('common.aboutText')}
                        </p>
                        
                      </div>
                      
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400">

                        <p>&copy; {new Date().getFullYear()} {t('common.fleetManager')}. By Ritvars Šakins</p>
                        <p className="mt-1">Last updated: May 22, 2025</p>

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
