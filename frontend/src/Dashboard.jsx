import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import { useTranslation } from 'react-i18next';
import i18n from './i18n/i18n';

const Dashboard = () => {
  // Get translations
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    activeVehicles: 0,
    inactiveVehicles: 0,
    upcomingMaintenances: 0,
    expiringDocuments: 0
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const { getAuthHeader, darkMode } = useAuth();

  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

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

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications?unreadOnly=true`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setNotifications(data);
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }, [apiUrl, getAuthHeader]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);

    }
  };

  // Dismiss notification
  const dismissNotification = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications/${id}/dismiss`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
   }
      
      // Update local state by removing the dismissed notification
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== id)
      );
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const markReminderAsCompleted = async (vehicleId, reminderId, reminderName) => {
    try {
      // Determine reminder type for better messaging
      let reminderType = 'general';
      if (reminderName.toLowerCase().includes('service')) {
        reminderType = 'service';
      } else if (reminderName.toLowerCase().includes('insurance')) {
        reminderType = 'insurance';
      } else if (reminderName.toLowerCase().includes('worthiness') || reminderName.toLowerCase().includes('certificate')) {
        reminderType = 'document';
      }
      
      // For service reminders, offer to reschedule
      if (reminderType === 'service') {
        const reschedule = confirm('Would you like to create a new service reminder after marking this one as completed?');
        
        if (reschedule) {
          // Ask for new date - default to 6 months from now for service
          const today = new Date();
          const nextServiceDate = new Date(today.setMonth(today.getMonth() + 6));
          const dateStr = nextServiceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          const newDate = prompt('Enter the date for the next service reminder:', dateStr);
          if (newDate) {
            try {
              // FIXED: Use the complete endpoint to create service history record
              const completeResponse = await fetch(`${apiUrl}/api/reminders/${reminderId}/complete`, {
                method: 'POST',
                headers: {
                  ...getAuthHeader(),
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  service_type: reminderName,
                  service_date: new Date().toISOString().split('T')[0]
                })
              });
              
              if (!completeResponse.ok) {
                throw new Error(`Failed to complete reminder: ${completeResponse.status}`);
              }
              
              // Create a new reminder
              const createResponse = await fetch(`${apiUrl}/api/vehicles/${vehicleId}/reminders`, {
                method: 'POST',
                headers: {
                  ...getAuthHeader(),
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: reminderName,
                  date: newDate,
                  enabled: true
                })
              });
              
              if (!createResponse.ok) {
                throw new Error(`Failed to create new reminder: ${createResponse.status}`);
              }
              
              // Update UI by filtering out the completed reminder
              setUpcomingReminders(prevReminders => 
                prevReminders.filter(reminder => reminder.id !== reminderId)
              );
              
              // Refresh data to include the new reminder
              const vehiclesResponse = await fetch(`${apiUrl}/api/vehicles`, {
                headers: {
                  ...getAuthHeader()
                }
              });
              
              if (vehiclesResponse.ok) {
                const vehiclesData = await vehiclesResponse.json();
                const today = new Date();
                const allReminders = [];
                
                for (const vehicle of vehiclesData) {
                  if (vehicle.reminders && vehicle.reminders.length > 0) {
                    for (const reminder of vehicle.reminders) {
                      if (!reminder.enabled) continue;
                      
                      const dueDate = new Date(reminder.date);
                      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                      
                      allReminders.push({
                        ...reminder,
                        vehicle: {
                          id: vehicle.id,
                          make: vehicle.make,
                          model: vehicle.model
                        },
                        daysUntilDue
                      });
                    }
                  }
                }
                
                allReminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
                setUpcomingReminders(allReminders.slice(0, 10));
              }
              
              alert(`Reminder marked as completed and new reminder scheduled for ${new Date(newDate).toLocaleDateString()}`);
            } catch (error) {
              console.error('Error handling reminder completion:', error);
              alert(`Error: ${error.message}`);
            }
            return;
          }
        }
      }
      
      // For non-service reminders or if user declined to reschedule
      try {
        // FIXED: Use the complete endpoint to create service history record for all reminder types
        const completeResponse = await fetch(`${apiUrl}/api/reminders/${reminderId}/complete`, {
          method: 'POST',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_type: reminderName,
            service_date: new Date().toISOString().split('T')[0]
          })
        });
        
        if (!completeResponse.ok) {
          throw new Error(`Failed to complete reminder: ${completeResponse.status}`);
        }
        
        // Update UI by filtering out the completed reminder
        setUpcomingReminders(prevReminders => 
          prevReminders.filter(reminder => reminder.id !== reminderId)
        );
        
        // Use better terminology based on reminder type
        let completionMessage = 'Reminder marked as completed!';
        if (reminderType === 'service') {
          completionMessage = 'Service marked as completed!';
        } else if (reminderType === 'insurance') {
          completionMessage = 'Insurance renewal marked as completed!';
        } else if (reminderType === 'document') {
          completionMessage = 'Document renewal marked as completed!';
        }
        
        alert(completionMessage);
      } catch (error) {
        console.error('Error marking reminder as completed:', error);
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in markReminderAsCompleted:', error);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles data to calculate statistics
        const vehiclesResponse = await fetch(`${apiUrl}/api/vehicles`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        });

        if (!vehiclesResponse.ok) {
          throw new Error(`Failed to fetch vehicles: ${vehiclesResponse.status} ${vehiclesResponse.statusText}`);
        }

        const vehiclesData = await vehiclesResponse.json();
        
        // Calculate dashboard statistics
        const activeVehicles = vehiclesData.filter(v => v.status === 'Active').length;
        const inactiveVehicles = vehiclesData.filter(v => v.status !== 'Active').length;
        
        // Count upcoming maintenances (reminders with "Service" in the name due within 30 days)
        const today = new Date();
        let upcomingMaintenances = 0;
        let expiringDocuments = 0;

        const allReminders = [];
        
        for (const vehicle of vehiclesData) {
          if (vehicle.reminders && vehicle.reminders.length > 0) {
            for (const reminder of vehicle.reminders) {
              if (!reminder.enabled) continue;
              
              const dueDate = new Date(reminder.date);
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              
              allReminders.push({
                ...reminder,
                vehicle: {
                  id: vehicle.id,
                  make: vehicle.make,
                  model: vehicle.model
                },
                daysUntilDue
              });
              
              if (daysUntilDue <= 30 && daysUntilDue > -30) {
                if (reminder.name.toLowerCase().includes('service')) {
                  upcomingMaintenances++;
                } else if (reminder.name.toLowerCase().includes('insurance') || 
                           reminder.name.toLowerCase().includes('certificate') ||
                           reminder.name.toLowerCase().includes('worthiness')) {
                  expiringDocuments++;
                }
              }
            }
          }
        }

        allReminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
        
        setUpcomingReminders(allReminders.slice(0, 10));
        
        setStats({
          activeVehicles,
          inactiveVehicles,
          upcomingMaintenances,
          expiringDocuments
        });
        
        // Fetch notifications
        await fetchNotifications();
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`Error fetching dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up a periodic refresh interval (every 2 minutes)
    const intervalId = setInterval(() => {
      fetchNotifications().catch(err => {
        console.error('Error in notification refresh interval:', err);
      });
    }, 2 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications, getAuthHeader, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Please check your connection to the backend server.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl text-gray-900 font-bold dark:text-white">{t('common.dashboard')}</h1>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                    <span className="mr-2">📅</span>{formatDate(new Date())}
                  </button>
                  <button 
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md shadow-sm hover:bg-gray-800 dark:bg-blue-700 dark:hover:bg-blue-800"
                    onClick={async () => {
                      try {
                        // Generate new notifications before creating report
                        await fetch(`${apiUrl}/api/notifications/generate`, { 
                          method: 'POST',
                          headers: getAuthHeader()
                        });
                        await fetchNotifications();
                        
                        // Here you would generate your report
                        alert('Not yet implemented!');
                      } catch (error) {
                        console.error('Error generating report:', error);
                        alert('Failed to generate report. Please try again.');
                      }
                    }}
                  >
                    <span className="mr-2">🔄</span>Generate Report
                  </button>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 bg-opacity-50 dark:bg-green-900/20">
                      <span className="h-6 w-6 text-green-600 dark:text-green-400 text-2xl">🚚</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.activeVehicles')}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeVehicles}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gray-100 bg-opacity-50 dark:bg-gray-700/40">
                      <span className="h-6 w-6 text-gray-600 dark:text-gray-400 text-2xl">🚫</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.inactiveVehicles')}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inactiveVehicles}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 bg-opacity-50 dark:bg-blue-900/20">
                      <span className="h-6 w-6 text-blue-600 dark:text-blue-400 text-2xl">🔧</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.upcomingMaintenance')}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.upcomingMaintenances}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-amber-100 bg-opacity-50 dark:bg-amber-900/20">
                      <span className="h-6 w-6 text-amber-600 dark:text-amber-400 text-2xl">📄</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.expiringDocuments')}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.expiringDocuments}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Content */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('dashboard.recentActivity')}</h2>
                      {notifications.length > 0 && (
                        <button 
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={async () => {
                            try {
                              await fetch(`${apiUrl}/api/notifications/read-all`, {
                                method: 'PUT',
                                headers: getAuthHeader()
                              });
                              await fetchNotifications();
                            } catch (error) {
                              console.error('Error marking all as read:', error);
                            }
                          }}
                        >
                          {t('dashboard.markAllAsRead')}
                        </button>
                      )}
                    </div>
                    <div className="mt-4 overflow-y-auto max-h-64">
                      <div className="space-y-4">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div key={notification.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                              <div className="flex items-start">
                                <div className="shrink-0">
                                  <span className={`inline-flex rounded-md p-2 ${
                                    notification.priority === 'high' 
                                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                                      : notification.priority === 'normal'
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}>
                                    {notification.type === 'maintenance' 
                                      ? '🔧' 
                                      : notification.type === 'insurance'
                                        ? '🔐'
                                        : notification.type === 'roadworthiness'
                                          ? '📝'
                                          : '🔔'}
                                  </span>
                                </div>
                                <div className="ml-3 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{
                                    (() => {
                                      // If the title is a translation key, translate it
                                      if (notification.title.startsWith('notifications.types.')) {
                                        const [type, status] = notification.title.split('.').slice(-2);
                                        return t(notification.title, {
                                          days: notification.daysUntilDue,
                                          vehicle: `${notification.make} ${notification.model}`
                                        });
                                      }
                                      // For custom reminders, use the title as is
                                      return notification.title;
                                    })()
                                  }</p>
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{
                                    (() => {
                                      const reminderNameTranslationMap = {
                                        'Service Due': 'dashboard.serviceDue',
                                        'Insurance Renewal': 'dashboard.insuranceRenewal',
                                        'Road Worthiness Certificate': 'vehicles.reminders.roadWorthinessCertificate',
                                      };
                                      const getTranslatedReminderName = (reminderName) => {
                                        const key = reminderNameTranslationMap[reminderName];
                                        return key ? t(key) : reminderName;
                                      };
                                      return notification.message_vars
                                        ? t('notifications.message.default', {
                                            ...notification.message_vars,
                                            reminderName: getTranslatedReminderName(notification.message_vars.reminderName)
                                          })
                                        : null;
                                    })()
                                  }</p>
                                  <div className="mt-2 flex space-x-2">
                                    {notification.vehicle_id && (
                                      <Link 
                                        to={`/vehicles?expand=${notification.vehicle_id}`}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                      >
                                        {t('dashboard.viewVehicle')}
                                      </Link>
                                    )}
                                    <button 
                                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                      onClick={() => dismissNotification(notification.id)}
                                    >
                                      {t('dashboard.dismiss')}
                                    </button>
                                  </div>
                                </div>
                                <div className="ml-3 shrink-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {notification.created_at ? formatDate(notification.created_at) : 'N/A'}
                                  </p>
                                  {!notification.is_read && (
                                    <button
                                      className="mt-1 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                      onClick={() => markAsRead(notification.id)}
                                    >
                                      {t('dashboard.markAsRead')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noRecentActivity')}</p>
                            <button 
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${apiUrl}/api/notifications/generate?force=true`, {
                                    method: 'POST',
                                    headers: getAuthHeader()
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    fetchNotifications();
                                  }
                                } catch (error) {
                                  console.error('Error generating notifications:', error);
                                }
                              }}
                            >
                              {t('dashboard.generateNotifications')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Access */}
                <div className="bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('dashboard.quickAccess')}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Link to="/vehicles" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">🚗</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">{t('common.vehicles')}</span>
                      </Link>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">📄</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.documents')}</span>
                      </button>
                      <Link to="/calendar" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">📅</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.scheduler')}</span>
                      </Link>
                      
                      <button 
                        className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60"
                        onClick={async () => {
                          try {
                            await fetch(`${apiUrl}/api/notifications/generate?force=true`, {
                              method: 'POST',
                              headers: getAuthHeader()
                            });
                            await fetchNotifications();
                            alert('Notifications refreshed successfully!');
                          } catch (error) {
                            console.error('Error generating notifications:', error);
                          }
                        }}
                      >
                        <span className="block text-2xl">🔔</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.checkNotifications')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminders Section */}
              <div className="mt-6 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('dashboard.upcomingReminders')}</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('dashboard.vehicle')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('dashboard.reminder')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('dashboard.dueDate')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('dashboard.status')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('dashboard.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {upcomingReminders.length > 0 ? (
                          upcomingReminders.map((reminder) => {
                            let statusClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
                            let statusText = t('dashboard.onTrack');
                            
                            if (reminder.daysUntilDue < 0) {
                              statusClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
                              statusText = t('dashboard.overdue');
                            } else if (reminder.daysUntilDue <= 7) {
                              statusClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
                              statusText = t('dashboard.dueThisWeek');
                            } else if (reminder.daysUntilDue <= 14) {
                              statusClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
                              statusText = t('dashboard.dueSoon');
                            }
                            
                            return (
                              <tr key={reminder.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{reminder.vehicle.id}</div>
                              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">{reminder.vehicle.make} {reminder.vehicle.model}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{
                              (() => {
                                const reminderTranslationMap = {
                                  'Service Due': 'dashboard.serviceDue',
                                  'Insurance Renewal': 'dashboard.insuranceRenewal',
                                  'Road Worthiness Certificate': 'vehicles.reminders.roadWorthinessCertificate',
                                };
                                const key = reminderTranslationMap[reminder.name];
                                return key ? t(key) : reminder.name;
                              })()
                            }</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{formatDate(reminder.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                    {statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                                    onClick={() => markReminderAsCompleted(reminder.vehicle.id, reminder.id, reminder.name)}
className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
{reminder.name.toLowerCase().includes('service') ? t('dashboard.markServiced') :
                               reminder.name.toLowerCase().includes('insurance') ? t('dashboard.markRenewed') :
                               reminder.name.toLowerCase().includes('worthiness') || reminder.name.toLowerCase().includes('certificate') ? t('dashboard.markRenewed') :
                               t('dashboard.markComplete')}
</button>
                          </td>
                        </tr>
                        );
                          })
                        ) : (
                          <tr>
                              <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              {t('dashboard.noUpcomingReminders')}
                          </td>
                        </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;