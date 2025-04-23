import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './Analytics';

const Dashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    maintenanceDue: 0,
    expiringDocs: 0,
    expiredDocs: 0
  });

  // Fetch vehicles and notifications on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles
        const vehiclesResponse = await fetch('http://localhost:3000/api/vehicles');
        if (!vehiclesResponse.ok) {
          throw new Error(`HTTP Error! Status: ${vehiclesResponse.status}`);
        }
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData);
        
        // Fetch notifications
        const notificationsResponse = await fetch('http://localhost:3000/api/notifications');
        if (!notificationsResponse.ok) {
          throw new Error(`HTTP Error! Status: ${notificationsResponse.status}`);
        }
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
        
        // Calculate dashboard stats
        calculateStats(vehiclesData, notificationsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Generate notifications first if needed
    fetch('http://localhost:3000/api/notifications/generate', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        console.log('Notifications generated on dashboard load:', data);
        if (data.notificationsCreated > 0) {
          // If new notifications were created, refresh the data
          fetchData();
        }
      })
      .catch(err => console.error('Error generating notifications:', err));
  }, []);
  
  // Calculate dashboard stats based on vehicles and reminders
  const calculateStats = (vehicles, notifications) => {
    const today = new Date();
    
    // Initialize counters
    let maintenanceDueCount = 0;
    let expiringDocsCount = 0;
    let expiredDocsCount = 0;
    
    // Process each vehicle's reminders
    vehicles.forEach(vehicle => {
      if (vehicle.reminders && vehicle.reminders.length > 0) {
        vehicle.reminders.forEach(reminder => {
          if (!reminder.enabled) return;
          
          const dueDate = new Date(reminder.date);
          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Categorize based on reminder type and due date
          if (reminder.name.toLowerCase().includes('service') || 
              reminder.name.toLowerCase().includes('maintenance')) {
            if (diffDays <= 30) maintenanceDueCount++;
          } else {
            if (diffDays <= 0) {
              expiredDocsCount++;
            } else if (diffDays <= 30) {
              expiringDocsCount++;
            }
          }
        });
      }
    });
    
    setStats({
      maintenanceDue: maintenanceDueCount,
      expiringDocs: expiringDocsCount,
      expiredDocs: expiredDocsCount
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Tailwind CSS Test */}
      <div className="bg-red-500 text-white p-5 text-center text-2xl font-bold">
        Life is soup, I am fork...
      </div>

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
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            
            {/* Stats cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Maintenance Due */}
              <div className="bg-white overflow-hidden shadow border border-gray-200 rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">
                      <span className="text-xl text-blue-500">🔧</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Maintenance Due</dt>
                        <dd>
                          <div className="text-xl font-semibold text-gray-900">{stats.maintenanceDue}</div>
                          <div className="text-sm text-gray-500">vehicles</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <Link to="/vehicles" className="text-sm text-blue-600 hover:text-blue-700">View vehicles</Link>
                </div>
              </div>

              {/* Expiring Documents */}
              <div className="bg-white overflow-hidden shadow border border-gray-200 rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amber-50 rounded-md p-3">
                      <span className="text-xl text-amber-500">⚠️</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Expiring Documents</dt>
                        <dd>
                          <div className="text-xl font-semibold text-gray-900">{stats.expiringDocs}</div>
                          <div className="text-sm text-gray-500">vehicles</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <Link to="/vehicles" className="text-sm text-blue-600 hover:text-blue-700">Check documents</Link>
                </div>
              </div>

              {/* Expired Documents */}
              <div className="bg-white overflow-hidden shadow border border-gray-200 rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-50 rounded-md p-3">
                      <span className="text-xl text-red-500">❗</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Expired Documents</dt>
                        <dd>
                          <div className="text-xl font-semibold text-gray-900">{stats.expiredDocs}</div>
                          <div className="text-sm text-gray-500">vehicles</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <Link to="/vehicles" className="text-sm text-red-600 hover:text-red-700 font-medium">Urgent attention needed</Link>
                </div>
              </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="mt-8">
              <div className="bg-white shadow border border-gray-200 sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex justify-between items-center">
                    <span>Alerts & Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          // Mark all notifications as read
                          fetch('http://localhost:3000/api/notifications/read-all', {
                            method: 'PUT'
                          })
                          .then(() => {
                            // Update local state
                            setNotifications(notifications.map(notif => ({
                              ...notif,
                              is_read: true
                            })));
                          })
                          .catch(err => console.error('Error marking all as read:', err));
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </h3>
                  <div className="mt-5 space-y-4">
                    {loading ? (
                      <div className="py-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => {
                        // Determine notification style based on type and priority
                        let iconColor = 'text-blue-500';
                        let icon = '🔔';
                        let bgColor = notification.is_read ? 'bg-gray-50' : 'bg-blue-50';
                        
                        if (notification.type === 'insurance') {
                          icon = '🔐';
                          iconColor = 'text-purple-500';
                          if (!notification.is_read) bgColor = 'bg-purple-50';
                        } else if (notification.type === 'maintenance') {
                          icon = '🔧';
                          iconColor = 'text-blue-500';
                          if (!notification.is_read) bgColor = 'bg-blue-50';
                        } else if (notification.type === 'roadworthiness') {
                          icon = '📝';
                          iconColor = 'text-green-500';
                          if (!notification.is_read) bgColor = 'bg-green-50';
                        }
                        
                        if (notification.priority === 'high') {
                          if (!notification.is_read) bgColor = 'bg-red-50';
                          iconColor = 'text-red-500';
                        }
                        
                        // Format due date if it exists
                        let dueDateStr = '';
                        if (notification.due_date) {
                          const dueDate = new Date(notification.due_date);
                          dueDateStr = dueDate.toLocaleDateString('lv-LV', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                        }

                        return (
                          <div key={notification.id} className={`${bgColor} p-4 rounded-lg border border-gray-200 transition-all`}>
                            <div className="flex justify-between">
                              <div className="flex">
                                <div className={`flex-shrink-0 ${iconColor}`}>
                                  <span className="text-xl">{icon}</span>
                                </div>
                                <div className="ml-3">
                                  <h3 className={`text-sm font-medium ${notification.is_read ? 'text-gray-800' : 'text-gray-900'}`}>
                                    {notification.title}
                                  </h3>
                                  <div className="mt-1 text-sm text-gray-500">
                                    <p>{notification.message}</p>
                                    {dueDateStr && (
                                      <p className="mt-1 text-xs font-medium">
                                        Due date: {dueDateStr}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <button 
                                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                                  title="Mark as read"
                                  onClick={() => {
                                    fetch(`http://localhost:3000/api/notifications/${notification.id}/read`, {
                                      method: 'PUT'
                                    })
                                    .then(() => {
                                      // Update notification in state
                                      setNotifications(notifications.map(n => 
                                        n.id === notification.id ? {...n, is_read: true} : n
                                      ));
                                    })
                                    .catch(err => console.error('Error marking notification as read:', err));
                                  }}
                                >
                                  ✓
                                </button>
                                <button 
                                  className="text-gray-400 hover:text-red-500 text-xs p-1"
                                  title="Dismiss"
                                  onClick={() => {
                                    fetch(`http://localhost:3000/api/notifications/${notification.id}/dismiss`, {
                                      method: 'PUT'
                                    })
                                    .then(() => {
                                      // Remove notification from state
                                      setNotifications(notifications.filter(n => n.id !== notification.id));
                                    })
                                    .catch(err => console.error('Error dismissing notification:', err));
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center border rounded-lg border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-500">No active notifications</p>
                        <button
                          className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            fetch('http://localhost:3000/api/notifications/generate', { 
                              method: 'POST' 
                            })
                            .then(res => res.json())
                            .then(data => {
                              if (data.notificationsCreated > 0) {
                                // Fetch updated notifications
                                fetch('http://localhost:3000/api/notifications')
                                  .then(res => res.json())
                                  .then(updatedNotifications => {
                                    setNotifications(updatedNotifications);
                                  });
                              }
                            })
                            .catch(err => console.error('Error generating notifications:', err));
                          }}
                        >
                          Check for new notifications
                        </button>
                      </div>
                    )}
                    
                    {notifications.length > 5 && (
                      <div className="text-center pt-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View all {notifications.length} notifications
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Status Table */}
            <div className="mt-8">
              <div className="bg-white shadow border border-gray-200 overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Vehicle Status Overview</h3>
                  <div className="mt-5">
                    <div className="flex flex-col">
                      <div className="overflow-x-auto">
                        <div className="align-middle inline-block min-w-full">
                          <div className="shadow overflow-hidden border border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Next Service
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Documents
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                  <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                      <div className="flex justify-center items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                        <span>Loading vehicles...</span>
                                      </div>
                                    </td>
                                  </tr>
                                ) : vehicles.length > 0 ? (
                                  vehicles.map((vehicle) => {
                                    // Find next service date from reminders
                                    const serviceReminder = vehicle.reminders?.find(r => 
                                      (r.name.toLowerCase().includes('service') || 
                                       r.name.toLowerCase().includes('maintenance')) && 
                                      r.enabled
                                    );
                                    
                                    // Format next service date
                                    let nextServiceDate = 'Not scheduled';
                                    if (serviceReminder) {
                                      const date = new Date(serviceReminder.date);
                                      nextServiceDate = date.toLocaleDateString('lv-LV', { 
                                        day: 'numeric',
                                        month: 'short', 
                                        year: 'numeric' 
                                      });
                                    }
                                    
                                    // Determine document status based on reminders
                                    let documentsStatus = 'Valid';
                                    let statusClass = 'text-green-500';
                                    
                                    const today = new Date();
                                    const docReminders = vehicle.reminders?.filter(r => 
                                      !r.name.toLowerCase().includes('service') && 
                                      !r.name.toLowerCase().includes('maintenance') &&
                                      r.enabled
                                    );
                                    
                                    if (docReminders && docReminders.length > 0) {
                                      for (const reminder of docReminders) {
                                        const dueDate = new Date(reminder.date);
                                        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                        
                                        if (diffDays <= 0) {
                                          documentsStatus = 'Expired';
                                          statusClass = 'text-red-500';
                                          break;
                                        } else if (diffDays <= 30) {
                                          documentsStatus = 'Expiring Soon';
                                          statusClass = 'text-amber-500';
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <tr key={vehicle.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">{vehicle.id}</div>
                                          </div>
                                          <div className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            vehicle.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {vehicle.status}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nextServiceDate}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${statusClass}`}>
                                          {documentsStatus}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                      No vehicles found
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