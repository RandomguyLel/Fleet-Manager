import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './components/NotificationBell';

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
  const { currentUser, logout, getAuthHeader } = useAuth();
  // State for user profile dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles data to calculate statistics
        const vehiclesResponse = await fetch('http://localhost:3000/api/vehicles', {
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
        const notificationsResponse = await fetch('http://localhost:3000/api/notifications?unreadOnly=true', {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        });
        
        if (!notificationsResponse.ok) {
          throw new Error(`Failed to fetch notifications: ${notificationsResponse.status} ${notificationsResponse.statusText}`);
        }
        
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`Error fetching dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getAuthHeader]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-gray-500 text-sm mb-4">
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
              <div className="ml-4 relative">
                <button 
                  className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="text-sm font-medium text-blue-700">{currentUser?.username?.charAt(0) || 'U'}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                    <div className="py-2">
                      <p className="px-4 py-2 text-sm text-gray-700">
                        <span className="font-medium">{currentUser?.username || 'User'}</span>
                        <br />
                        <span className="text-xs text-gray-500">{currentUser?.email || ''}</span>
                      </p>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Profile
                      </Link>
                      <button 
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={logout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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
                <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">
                  <span className="mr-3 text-blue-500">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📈</span>
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
                <h1 className="text-2xl text-gray-900">Dashboard</h1>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    <span className="mr-2">📅</span>April 27, 2025
                  </button>
                  <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md shadow-sm hover:bg-gray-800">
                    <span className="mr-2">🔄</span>Generate Report
                  </button>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 bg-opacity-50">
                      <span className="h-6 w-6 text-green-600 text-2xl">🚚</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Active Vehicles</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.activeVehicles}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gray-100 bg-opacity-50">
                      <span className="h-6 w-6 text-gray-600 text-2xl">🚫</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Inactive Vehicles</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.inactiveVehicles}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 bg-opacity-50">
                      <span className="h-6 w-6 text-blue-600 text-2xl">🔧</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Upcoming Maintenance</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.upcomingMaintenances}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-amber-100 bg-opacity-50">
                      <span className="h-6 w-6 text-amber-600 text-2xl">📄</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Expiring Documents</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.expiringDocuments}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Content */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                    <div className="mt-4 overflow-y-auto max-h-64">
                      <div className="space-y-4">
                        {notifications.length > 0 ? (
                          notifications.map((notification, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                              <div className="flex items-start">
                                <div className="shrink-0">
                                  <span className={`inline-flex rounded-md p-2 ${
                                    notification.priority === 'high' 
                                      ? 'bg-red-100 text-red-600' 
                                      : notification.priority === 'normal'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-600'
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
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                  <div className="mt-2 flex space-x-2">
                                    <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">
                                      View Details
                                    </button>
                                    <button className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                                <div className="ml-3 shrink-0">
                                  <p className="text-xs text-gray-500">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Access */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Quick Access</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Link to="/vehicles" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                        <span className="block text-2xl">🚗</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Vehicles</span>
                      </Link>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                        <span className="block text-2xl">🔍</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Search</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                        <span className="block text-2xl">📄</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Documents</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                        <span className="block text-2xl">📅</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Scheduler</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                        <span className="block text-2xl">💬</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Messages</span>
                      </button>
                      <button className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                        <span className="block text-2xl">⚙️</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminders Section */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Upcoming Reminders</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reminder
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">XYZ-123</div>
                              <div className="ml-2 text-xs text-gray-500">Toyota Hino 300</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Insurance Renewal</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Dec 15, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              On Track
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Mark Complete</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">ABC-789</div>
                              <div className="ml-2 text-xs text-gray-500">Mercedes Sprinter</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Road Worthiness Certificate</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Jun 30, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              On Track
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Mark Complete</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">DEF-456</div>
                              <div className="ml-2 text-xs text-gray-500">Ford Transit</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Service Due</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">May 15, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                              Due Soon
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Mark Complete</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">DEF-456</div>
                              <div className="ml-2 text-xs text-gray-500">Ford Transit</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Road Worthiness Certificate</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Apr 30, 2025</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Overdue
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Mark Complete</button>
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