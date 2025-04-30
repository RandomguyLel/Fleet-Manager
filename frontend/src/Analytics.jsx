import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedVehicles, setSelectedVehicles] = useState(['XYZ-123', 'ABC-789']);

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
              <div className="ml-4">
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
                <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <span className="mr-3 text-blue-500 dark:text-blue-400">📈</span>
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/vehicles" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">🚗</span>
                  Vehicles
                </Link>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">🕒</span>
                  Service History
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">📄</span>
                  Documents
                </a>
              </li>
            </ul>
            
            <div className="px-3 py-2 mt-6 text-xs uppercase text-gray-500 dark:text-gray-400">Admin</div>
            <ul className="space-y-1 mt-2">
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">⚙️</span>
                  System Settings
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">👥</span>
                  User Management
                </a>
              </li>
              <li>
                <Link to="/audit-log" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400">
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
                <h1 className="text-2xl text-gray-900 dark:text-white">Analytics - visual demo</h1>
                <div className="flex space-x-4">
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="3m">Last 3 months</option>
                    <option value="1y">Last year</option>
                  </select>
                  <button className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm dark:bg-gray-700">Export Data</button>
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                  <div className="flex items-center space-x-4 mb-6">
                    <h3 className="text-lg text-gray-900 dark:text-white">Vehicle Selection</h3>
                    <div className="flex space-x-2">
                      {selectedVehicles.map(vehicle => (
                        <button 
                          key={vehicle}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm dark:bg-gray-700 dark:text-gray-200"
                        >
                          {vehicle}
                        </button>
                      ))}
                      <button className="px-3 py-1 bg-gray-800 text-white rounded text-sm dark:bg-gray-700">+ Add Vehicle</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                      <h4 className="text-sm text-gray-700 mb-4 dark:text-gray-200">Total Mileage Trend</h4>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Graph Placeholder</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                      <h4 className="text-sm text-gray-700 mb-4 dark:text-gray-200">Average Daily Mileage</h4>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Graph Placeholder</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm text-gray-700 dark:text-gray-200">Fuel Cost Analysis</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Price:</span>
                          <input type="number" className="w-24 px-2 py-1 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" placeholder="$/L" />
                        </div>
                      </div>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Graph Placeholder</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                      <h4 className="text-sm text-gray-700 mb-4 dark:text-gray-200">Maintenance Cost Distribution</h4>
                      <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Graph Placeholder</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                  <h3 className="text-lg text-gray-900 mb-6 dark:text-white">Cost Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">Category</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">This Month</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">Last Month</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">YTD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Fuel</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$2,450</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$2,300</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$28,500</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Maintenance</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$850</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$1,200</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$12,400</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Documents</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$300</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$300</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">$3,600</td>
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

export default Analytics;