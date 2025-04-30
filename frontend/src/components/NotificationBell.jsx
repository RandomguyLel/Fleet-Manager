import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [generatingNotifications, setGeneratingNotifications] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeader } = useAuth();
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
    if (isRead) return 'bg-gray-50';
    
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
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-700 hover:bg-gray-100"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label={`Notifications - ${unreadCount} unread`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-900 font-medium">Notifications</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button 
                    className="text-xs text-gray-600 hover:text-gray-900"
                    onClick={markAllAsRead}
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {loading ? (
              <div className="py-4 text-center">
                <div className="inline-block animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`flex p-3 rounded-lg border border-gray-200 ${getNotificationBackground(notification.priority, notification.is_read)}`}
                  >
                    <span className="text-gray-600 mr-3 flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-grow min-w-0 pr-2">
                      <p className="text-sm text-gray-800 font-medium break-words">{notification.title}</p>
                      <p className="mt-1 text-xs text-gray-500 break-words">{notification.message}</p>
                      {notification.due_date && (
                        <p className="mt-1 text-xs text-gray-400">
                          Due: {formatDate(notification.due_date)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1 flex-shrink-0">
                      {!notification.is_read && (
                        <button 
                          className="text-gray-400 hover:text-gray-600 text-xs w-5 h-5 flex items-center justify-center"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <span>✓</span>
                        </button>
                      )}
                      <button 
                        className="text-gray-400 hover:text-red-500 text-xs w-5 h-5 flex items-center justify-center"
                        onClick={() => dismissNotification(notification.id)}
                        title="Dismiss"
                      >
                        <span>×</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs text-center rounded-b-lg text-gray-500">
            <button
              className={`text-blue-500 hover:text-blue-700 ${generatingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={async () => {
                const message = await generateNotifications();
                if (message) {
                  // We could show a toast or some other visual feedback here
                  console.log(message);
                }
              }}
              disabled={generatingNotifications}
            >
              {generatingNotifications ? (
                <>
                  <span className="inline-block mr-1 h-3 w-3 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin"></span>
                  Checking...
                </>
              ) : 'Check for new notifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;