import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './Analytics';


const Dashboard = () => {
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
                          <div className="text-xl font-semibold text-gray-900">8</div>
                          <div className="text-sm text-gray-500">vehicles</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
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
                          <div className="text-xl font-semibold text-gray-900">5</div>
                          <div className="text-sm text-gray-500">vehicles</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
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
                          <div className="text-xl font-semibold text-gray-900">3</div>
                          <div className="text-sm text-gray-500">vehicles</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="mt-8">
              <div className="bg-white shadow border border-gray-200 sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Alerts & Notifications</h3>
                  <div className="mt-5 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex">
                        <div className="flex-shrink-0 text-red-500">
                          <span className="text-xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-800">Vehicle XYZ-123 requires immediate maintenance</h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <p>Service due date: Jan 15, 2025</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex">
                        <div className="flex-shrink-0 text-amber-500">
                          <span className="text-xl">⏰</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-800">Insurance expiring for ABC-789</h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <p>Expires on: Feb 1, 2025</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex">
                        <div className="flex-shrink-0 text-red-500">
                          <span className="text-xl">📄</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-800">Roadworthiness certificate expired for DEF-456</h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <p>Expired on: Dec 31, 2024</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                                <tr>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">XYZ-123</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Active
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 15, 2025</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">Valid</td>
                                </tr>
                                <tr>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ABC-789</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Active
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 1, 2025</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-500 font-medium">Expiring Soon</td>
                                </tr>
                                <tr>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DEF-456</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      Inactive
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Feb 20, 2025</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-medium">Expired</td>
                                </tr>
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