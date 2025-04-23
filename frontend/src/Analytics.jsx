import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedVehicles, setSelectedVehicles] = useState(['XYZ-123', 'ABC-789']);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="shrink-0 flex items-center">
                <span className="text-2xl text-blue-600">🚚</span>
              </div>
              <div className="ml-4 text-xl font-medium text-gray-800">Fleet Manager</div>
            </div>
            <div className="flex items-center">
              <NotificationBell />
              <div className="ml-4 flex items-center">
                <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
                  <span className="text-sm font-medium text-blue-700">A</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
          <div className="py-6 px-4">
            <div className="px-3 py-2 text-xs uppercase text-gray-500">Main</div>
            <ul className="space-y-1 mt-2">
              <li>
                <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">
                  <span className="mr-3 text-blue-500">📈</span>
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/vehicles" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">🚗</span>
                  Vehicles
                </Link>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">🕒</span>
                  Service History
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📄</span>
                  Documents
                </a>
              </li>
            </ul>
            
            <div className="px-3 py-2 mt-6 text-xs uppercase text-gray-500">Admin</div>
            <ul className="space-y-1 mt-2">
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">⚙️</span>
                  System Settings
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">👥</span>
                  User Management
                </a>
              </li>
              <li>
                <Link to="/audit-log" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📋</span>
                  Audit Log
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900">Analytics</h1>
                <div className="flex space-x-4">
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="3m">Last 3 months</option>
                    <option value="1y">Last year</option>
                  </select>
                  <button className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm">Export Data</button>
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center space-x-4 mb-6">
                    <h3 className="text-lg text-gray-900">Vehicle Selection</h3>
                    <div className="flex space-x-2">
                      {selectedVehicles.map(vehicle => (
                        <button 
                          key={vehicle}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          {vehicle}
                        </button>
                      ))}
                      <button className="px-3 py-1 bg-gray-800 text-white rounded text-sm">+ Add Vehicle</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm text-gray-700 mb-4">Total Mileage Trend</h4>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-600">Graph Placeholder</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm text-gray-700 mb-4">Average Daily Mileage</h4>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-600">Graph Placeholder</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm text-gray-700">Fuel Cost Analysis</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Fuel Price:</span>
                          <input type="number" className="w-24 px-2 py-1 border border-gray-300 rounded" placeholder="$/L" />
                        </div>
                      </div>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-600">Graph Placeholder</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm text-gray-700 mb-4">Maintenance Cost Distribution</h4>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-600">Graph Placeholder</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg text-gray-900 mb-6">Cost Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">This Month</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Last Month</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">YTD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Fuel</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$2,450</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$2,300</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$28,500</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Maintenance</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$850</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$1,200</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$12,400</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Documents</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$300</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$300</td>
                          <td className="px-6 py-4 text-sm text-gray-600">$3,600</td>
                        </tr>
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

// Notification Bell Component to be reused across pages
export const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch notifications from the API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/notifications');
      
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
      const response = await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
        method: 'PUT'
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
      const response = await fetch(`http://localhost:3000/api/notifications/${id}/dismiss`, {
        method: 'PUT'
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
      const response = await fetch('http://localhost:3000/api/notifications/read-all', {
        method: 'PUT'
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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
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
              <div className="max-h-80 overflow-y-auto space-y-3">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 ${getNotificationBackground(notification.priority, notification.is_read)}`}
                  >
                    <div className="flex items-center max-w-[85%]">
                      <span className="text-gray-600 mr-2 flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button 
                        className="text-gray-400 hover:text-gray-600 text-xs"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <span>✓</span>
                      </button>
                      <button 
                        className="text-gray-400 hover:text-red-500 text-xs"
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
                fetch('http://localhost:3000/api/notifications/generate', { 
                  method: 'POST' 
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

export default Analytics;