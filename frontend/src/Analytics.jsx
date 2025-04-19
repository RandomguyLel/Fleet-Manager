import React, { useState } from 'react';
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
  
  // Sample notifications data
  const notifications = [
    {
      id: 1,
      type: 'maintenance',
      message: 'Maintenance due for XYZ-123',
      icon: '⚠️'
    },
    {
      id: 2,
      type: 'insurance',
      message: 'Insurance expiring soon',
      icon: '⏰'
    }
  ];
  
  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-700 hover:bg-gray-100"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <span className="text-xl">🔔</span>
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-900">Notifications</h3>
              <div className="flex space-x-2">
                <button className="text-xs text-gray-600 hover:text-gray-900">Clear All</button>
                <button className="text-xs text-gray-600 hover:text-gray-900">Mute (1h)</button>
              </div>
            </div>
            <div className="space-y-3">
              {notifications.map(notification => (
                <div key={notification.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="text-gray-600">{notification.icon}</span>
                    <span className="ml-2 text-sm text-gray-800">{notification.message}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <span>✓</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;