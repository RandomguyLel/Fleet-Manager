import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeVehicles: 0,
    inactiveVehicles: 0,
    upcomingMaintenances: 0,
    expiringDocuments: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get auth context
  const { getAuthHeader, darkMode } = useAuth();
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
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

  // Fetch dashboard data
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
        
        for (const vehicle of vehiclesData) {
          if (vehicle.reminders && vehicle.reminders.length > 0) {
            for (const reminder of vehicle.reminders) {
              if (!reminder.enabled) continue;
              
              const dueDate = new Date(reminder.date);
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              
              if (daysUntilDue <= 30 && daysUntilDue > 0) {
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
              <div className="ml-4 relative">
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="py-6 px-4">
            <div className="px-3 py-2 text-xs uppercase text-gray-500 dark:text-gray-400">Main</div>
            <ul className="space-y-1 mt-2">
              <li>
                <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <span className="mr-3 text-blue-500 dark:text-blue-400">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">📈</span>
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/vehicles" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">🚗</span>
                  Vehicles
                </Link>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">🕒</span>
                  Service History
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">📄</span>
                  Documents
                </a>
              </li>
            </ul>

            <div className="px-3 py-2 mt-6 text-xs uppercase text-gray-500 dark:text-gray-400">Admin</div>
            <ul className="space-y-1 mt-2">
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">⚙️</span>
                  System Settings
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">👥</span>
                  User Management
                </a>
              </li>
              <li>
                <Link to="/audit-log" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">📋</span>
                  Audit Log
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900 dark:text-white">Dashboard</h1>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Vehicles</p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Vehicles</p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Maintenance</p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expiring Documents</p>
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
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
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
                          Mark All as Read
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
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                                  <div className="mt-2 flex space-x-2">
                                    {notification.vehicle_id && (
                                      <Link 
                                        to={`/vehicles/${notification.vehicle_id}`}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                      >
                                        View Vehicle
                                      </Link>
                                    )}
                                    <button 
                                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                      onClick={() => dismissNotification(notification.id)}
                                    >
                                      Dismiss
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
                                      Mark as read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
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
                              Generate Notifications
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
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Access</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Link to="/vehicles" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">🚗</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">Vehicles</span>
                      </Link>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">🔍</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">Search</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">📄</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">Documents</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">📅</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">Scheduler</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60">
                        <span className="block text-2xl">💬</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">Messages</span>
                      </button>
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
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">Check Notifications</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminders Section */}
              <div className="mt-6 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Reminders</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Reminder
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">XYZ-123</div>
                              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">Toyota Hino 300</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Insurance Renewal</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Dec 15, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              On Track
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Mark Complete</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">ABC-789</div>
                              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">Mercedes Sprinter</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Road Worthiness Certificate</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Jun 30, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              On Track
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Mark Complete</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">DEF-456</div>
                              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">Ford Transit</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Service Due</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">May 15, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Due Soon
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Mark Complete</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">DEF-456</div>
                              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">Ford Transit</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Road Worthiness Certificate</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">Apr 30, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Overdue
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Mark Complete</button>
                          </td>
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

export default Dashboard;