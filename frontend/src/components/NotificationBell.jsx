import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';

const NotificationBell = () => {
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [generatingNotifications, setGeneratingNotifications] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeader, darkMode } = useAuth();
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Fetch notifications from the API with pagination
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/notifications?limit=50`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setNotifications(data);
      
      // Count unread notifications
      const unread = data.filter(notification => !notification.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getAuthHeader]);
  
  // Fetch notifications on mount and when the component is shown
  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh (every 2 minutes)
    const intervalId = setInterval(fetchNotifications, 2 * 60 * 1000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);
  
  // Fetch notifications when the dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications]);
  
  // Handle marking a notification as read
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
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Handle marking a notification as dismissed
  const dismissNotification = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications/${id}/dismiss`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      
      // Determine if the dismissed notification was unread
      const wasUnread = notifications.find(notif => notif.id === parseInt(id) && !notif.is_read);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== parseInt(id))
      );
      
      // Update unread count if the dismissed notification was unread
      if (wasUnread) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };
  
  // Handle marking all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Generate new notifications
  const generateNotifications = async () => {
    try {
      setGeneratingNotifications(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/notifications/generate?force=true`, { 
        method: 'POST',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh notifications list
        await fetchNotifications();
        return data.notificationsCreated > 0
          ? `Generated ${data.notificationsCreated} new notification${data.notificationsCreated !== 1 ? 's' : ''}.`
          : 'No new notifications to generate.';
      } else {
        throw new Error('Failed to generate notifications.');
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
      setError('Failed to generate notifications. Please try again.');
      return null;
    } finally {
      setGeneratingNotifications(false);
    }
  };
  
  // Generate an icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'insurance':
        return '🔐';
      case 'maintenance':
        return '🔧';
      case 'roadworthiness':
        return '📝';
      default:
        return '🔔';
    }
  };
  
  // Generate a background color based on notification priority and read status
  const getNotificationBackground = (priority, isRead) => {
    if (isRead) return darkMode ? 'bg-gray-700/40' : 'bg-gray-50';
    
    if (darkMode) {
      switch (priority) {
        case 'high':
          return 'bg-red-900/20';
        case 'normal':
          return 'bg-amber-900/20';
        case 'low':
          return 'bg-blue-900/20';
        default:
          return 'bg-gray-700/40';
      }
    } else {
      switch (priority) {
        case 'high':
          return 'bg-red-50';
        case 'normal':
          return 'bg-amber-50';
        case 'low':
          return 'bg-blue-50';
        default:
          return 'bg-gray-50';
      }
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label={`${t('notifications.title')} - ${unreadCount} unread`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-900 font-medium dark:text-white">{t('notifications.title')}</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button 
                    className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    onClick={markAllAsRead}
                  >
                    {t('notifications.markAllAsRead')}
                  </button>
                )}
                <button
                  className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={generateNotifications}
                  disabled={generatingNotifications}
                >
                  {generatingNotifications ? t('notifications.generating') : t('notifications.generateNotifications')}
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t('notifications.loading')}
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">
                {t('notifications.error')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t('notifications.noNotifications')}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${getNotificationBackground(notification.priority, notification.is_read)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {(() => {
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
                            })()}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {(() => {
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
                            })()}
                          </p>
                          {notification.due_date && (
                            <p className="text-xs text-gray-400">
                              Due: {formatDate(notification.due_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                            title={t('notifications.markAsRead')}
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                          title={t('notifications.dismiss')}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;