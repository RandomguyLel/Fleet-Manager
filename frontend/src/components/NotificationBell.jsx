import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { getAuthHeader } = useAuth();
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Fetch notifications from the API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/notifications`, {
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
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch notifications on mount and when the component is shown
  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Fetch notifications when the dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);
  
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
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
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
      
      // Update local state
      const updatedNotifications = notifications.filter(notif => notif.id !== id);
      setNotifications(updatedNotifications);
      
      // Update unread count if the dismissed notification was unread
      const wasUnread = notifications.find(notif => notif.id === id && !notif.is_read);
      if (wasUnread) {
        setUnreadCount(Math.max(0, unreadCount - 1));
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
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
  
  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-700 hover:bg-gray-100"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-900">Notifications</h3>
              <div className="flex space-x-2">
                <button 
                  className="text-xs text-gray-600 hover:text-gray-900"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </button>
              </div>
            </div>
            
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
                      <p className="text-xs text-gray-500 break-words">{notification.message}</p>
                    </div>
                    <div className="flex flex-col space-y-1 flex-shrink-0">
                      <button 
                        className="text-gray-400 hover:text-gray-600 text-xs w-5 h-5 flex items-center justify-center"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <span>✓</span>
                      </button>
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
              className="text-blue-500 hover:text-blue-700"
              onClick={() => {
                fetch(`${apiUrl}/api/notifications/generate`, { 
                  method: 'POST',
                  headers: getAuthHeader()
                })
                .then(res => res.json())
                .then(data => {
                  console.log('Notifications generated:', data);
                  fetchNotifications();
                })
                .catch(err => console.error('Error generating notifications:', err));
              }}
            >
              Check for new notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;