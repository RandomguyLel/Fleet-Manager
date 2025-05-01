import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';
import Sidebar from './components/Sidebar';
import { useAuth } from './AuthContext';

const AuditLog = () => {
  // Get darkMode from AuthContext
  const { darkMode } = useAuth();
  
  // Sample audit log data
  const auditLogs = [
    {
      id: 1,
      timestamp: '2025-04-19 10:30',
      user: {
        name: 'John Doe',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=123'
      },
      action: 'Update',
      page: 'Vehicles',
      field: 'Status',
      oldValue: 'Active',
      newValue: 'Maintenance'
    },
    {
      id: 2,
      timestamp: '2025-04-19 09:45',
      user: {
        name: 'Jane Smith',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=456'
      },
      action: 'Create',
      page: 'Documents',
      field: 'Insurance',
      oldValue: '-',
      newValue: 'Added'
    },
    {
      id: 3,
      timestamp: '2025-04-18 14:22',
      user: {
        name: 'Admin User',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=789'
      },
      action: 'Delete',
      page: 'Service History',
      field: 'Record',
      oldValue: 'Oil Change',
      newValue: '-'
    },
    {
      id: 4,
      timestamp: '2025-04-18 11:05',
      user: {
        name: 'John Doe',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=123'
      },
      action: 'Update',
      page: 'Vehicles',
      field: 'Mileage',
      oldValue: '42,550 km',
      newValue: '43,200 km'
    },
    {
      id: 5,
      timestamp: '2025-04-17 16:48',
      user: {
        name: 'Jane Smith',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=456'
      },
      action: 'Update',
      page: 'User Management',
      field: 'Role',
      oldValue: 'User',
      newValue: 'Admin'
    }
  ];

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
            <div className="flex items-center relative">
              <NotificationBell />
              <div className="ml-4 flex items-center">
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900 dark:text-white">Audit Log - visual demo</h1>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md shadow-sm hover:bg-gray-800 dark:bg-blue-700 dark:hover:bg-blue-800">
                    <span className="mr-2">⬇️</span>Export Log
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">Action Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All Actions</option>
                        <option>Create</option>
                        <option>Update</option>
                        <option>Delete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">User</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All Users</option>
                        <option>John Doe</option>
                        <option>Jane Smith</option>
                        <option>Admin User</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">Page/Section</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All Pages</option>
                        <option>Vehicles</option>
                        <option>Service History</option>
                        <option>Documents</option>
                        <option>User Management</option>
                        <option>System Settings</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">Date Range</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" defaultValue="2025-04-19" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">User</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Action</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Page</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Field</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Old Value</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.timestamp}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <img src={log.user.avatar} className="w-6 h-6 rounded-full mr-2" />
                                <span className="text-sm text-gray-900 dark:text-white">{log.user.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                log.action === 'Create' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : log.action === 'Update' 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.page}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.field}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.oldValue}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.newValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing 1 to 5 of 50 entries
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300">Previous</button>
                      <button className="px-3 py-1 bg-gray-900 text-white rounded-md text-sm dark:bg-blue-700">1</button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300">2</button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300">3</button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300">Next</button>
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

export default AuditLog;