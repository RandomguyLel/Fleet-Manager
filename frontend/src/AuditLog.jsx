import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';
import Sidebar from './components/Sidebar';
import { useAuth } from './AuthContext';

const AuditLog = () => {
  // Get auth context for API calls
  const { darkMode, getAuthHeader, currentUser } = useAuth();

  // State for audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // State for users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for filters
  const [filters, setFilters] = useState({
    action: 'all',
    username: 'all',
    page: 'all',
    startDate: '',
  });

  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  // Fetch users from API for the dropdown
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      
      const response = await fetch(`${apiUrl}/api/auth/users`, {
        headers: {
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Continue with empty users list
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load audit logs
  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const offset = (currentPage - 1) * itemsPerPage;

      // Build query parameters
      const queryParams = new URLSearchParams({
        limit: itemsPerPage,
        offset: offset
      });

      if (filters.action !== 'all') {
        queryParams.append('action', filters.action);
      }

      if (filters.username !== 'all') {
        queryParams.append('username', filters.username);
      }

      if (filters.page !== 'all') {
        queryParams.append('page', filters.page);
      }

      if (filters.startDate) {
        queryParams.append('startDate', new Date(filters.startDate).toISOString().split('T')[0]);
        // Add one day to get end of day for the selected date
        const endDate = new Date(filters.startDate);
        endDate.setDate(endDate.getDate() + 1);
        queryParams.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`${apiUrl}/api/audit-logs?${queryParams}`, {
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const data = await response.json();
      setAuditLogs(data.logs);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add tooltip positioning functionality
  useEffect(() => {
    const handleTooltipPosition = (e) => {
      const tooltip = e.currentTarget.querySelector('.tooltiptext');
      if (!tooltip) return;
      
      // Get the position of the tooltip trigger
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Calculate where to position the tooltip (above the element)
      const top = Math.max(rect.top - 450, 10); // Position above, with at least 10px from top of viewport
      let left = rect.left;
      
      // Ensure tooltip doesn't go off-screen on the right
      const tooltipWidth = 400; // Width of tooltip
      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 20; // 20px padding from right edge
      }
      
      // Set the position
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };
    
    // Add mouse enter event to all tooltip containers
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
      tooltip.addEventListener('mouseenter', handleTooltipPosition);
    });
    
    // Clean up event listeners
    return () => {
      tooltips.forEach(tooltip => {
        tooltip.removeEventListener('mouseenter', handleTooltipPosition);
      });
    };
  }, [auditLogs]); // Update when logs change

  // Load audit logs on component mount and when filters or pagination change
  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, itemsPerPage, filters]);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action class for styling
  const getActionClass = (action) => {
    switch(action) {
      case 'Create':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Login':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Logout':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'FailedLogin':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Generate avatar URL based on username or email
  const getAvatarUrl = (username, email) => {
    const seed = username || email || Date.now();
    return `https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${seed}`;
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handle page navigation
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Try parsing JSON values
  const tryParseJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (e) {
      return null;
    }
  };

  // Format JSON for tooltip display
  const formatJSONForTooltip = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString; // Return original if not valid JSON
    }
  };

  // Format JSON for regular display
  const formatJSONDisplay = (value) => {
    if (!value) return null;
    
    const parsedJSON = tryParseJSON(value);
    if (parsedJSON) {
      // For short display, just show a summary
      const keys = Object.keys(parsedJSON);
      if (keys.length > 0) {
        const summary = keys.map(key => {
          const val = parsedJSON[key];
          // Truncate and format string values
          return `${key}: ${typeof val === 'string' ? `"${val.substring(0, 15)}${val.length > 15 ? '...' : ''}"` : val}`;
        }).join(', ');
        return summary.length > 50 ? summary.substring(0, 50) + '...' : summary;
      }
      return JSON.stringify(parsedJSON);
    }
    
    return value;
  };

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
                <h1 className="text-2xl text-gray-900 dark:text-white">Audit Log</h1>
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
                      <select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="all">All Actions</option>
                        <option value="Create">Create</option>
                        <option value="Update">Update</option>
                        <option value="Delete">Delete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">User</label>
                      <select
                        name="username"
                        value={filters.username}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isLoadingUsers}
                      >
                        <option value="all">All Users</option>
                        {users.map(user => (
                          <option key={user.id} value={user.username}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">Page/Section</label>
                      <select
                        name="page"
                        value={filters.page}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="all">All Pages</option>
                        <option value="Vehicles">Vehicles</option>
                        <option value="Reminders">Reminders</option>
                        <option value="Service History">Service History</option>
                        <option value="Documents">Documents</option>
                        <option value="User Management">User Management</option>
                        <option value="System Settings">System Settings</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">Date Range</label>
                      <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="text-center text-gray-600 dark:text-gray-300">Loading...</div>
                    ) : error ? (
                      <div className="text-center text-red-600 dark:text-red-300">{error}</div>
                    ) : (
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
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatTimestamp(log.timestamp)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <img src={getAvatarUrl(log.username, log.email)} className="w-6 h-6 rounded-full mr-2" alt={log.username || 'User'} />
                                  <span className="text-sm text-gray-900 dark:text-white">{log.username}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${getActionClass(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.page}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.field}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[200px]">
                                {log.old_value && (
                                  <div className="tooltip">
                                    <span className="cursor-pointer underline decoration-dotted">
                                      {formatJSONDisplay(log.old_value)}
                                    </span>
                                    <span className="tooltiptext whitespace-pre-wrap">
                                      {formatJSONForTooltip(log.old_value)}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[200px]">
                                {log.new_value && (
                                  <div className="tooltip">
                                    <span className="cursor-pointer underline decoration-dotted">
                                      {formatJSONDisplay(log.new_value)}
                                    </span>
                                    <span className="tooltiptext whitespace-pre-wrap">
                                      {formatJSONForTooltip(log.new_value)}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentPage === page
                              ? 'bg-gray-900 text-white dark:bg-blue-700'
                              : 'border border-gray-300 dark:border-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300"
                      >
                        Next
                      </button>
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