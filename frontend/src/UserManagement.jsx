import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';
import Sidebar from './components/Sidebar';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

const UserManagement = () => {
  // Get auth context
  const { darkMode, getAuthHeader, currentUser } = useAuth();
  const { t } = useTranslation();
  
  // State for users list
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
    isActive: true
  });

  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // State to track admin count
  const [activeAdminCount, setActiveAdminCount] = useState(0);

  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  // Load users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/auth/users`, {
        headers: {
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
      
      // Calculate active admin count
      const activeAdmins = data.filter(user => user.role === 'admin' && user.isActive === true);
      setActiveAdminCount(activeAdmins.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Initialize filteredUsers with users after fetching
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  // Filter users based on role, status, and search query
  useEffect(() => {
    let filtered = [...users];

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.isActive === (statusFilter === 'active'));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.firstName && user.firstName.toLowerCase().includes(query)) ||
        (user.lastName && user.lastName.toLowerCase().includes(query)) ||
        (user.username && user.username.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query))
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open modal for creating a new user
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: generateTemporaryPassword(),
      role: 'user',
      isActive: true
    });
    setShowModal(true);
  };

  // Open modal for editing an existing user
  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      // Password field is empty when editing - would need to be reset separately
      password: ''
    });
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Generate a random temporary password
  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Regenerate temporary password
  const regeneratePassword = () => {
    setFormData({
      ...formData,
      password: generateTemporaryPassword()
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if we're demoting the last admin
      if (modalMode === 'edit' && 
          selectedUser.role === 'admin' && 
          formData.role !== 'admin' && 
          isLastActiveAdmin(selectedUser)) {
        alert('Cannot demote the last administrator. The system must have at least one active admin user.');
        return;
      }
      
      // Check if we're disabling the last admin
      if (modalMode === 'edit' && 
          selectedUser.role === 'admin' && 
          selectedUser.isActive === true && 
          formData.isActive === false && 
          isLastActiveAdmin(selectedUser)) {
        alert('Cannot disable the last administrator. The system must have at least one active admin user.');
        return;
      }
      
      if (modalMode === 'create') {
        // Create a new user
        const response = await fetch(`${apiUrl}/api/auth/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            username: formData.username,
            password: formData.password,
            role: formData.role
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }
        
        // Refresh user list
        fetchUsers();
        alert(`User ${formData.firstName} ${formData.lastName} created successfully with temporary password: ${formData.password}`);
      } else {
        // Update existing user
        const response = await fetch(`${apiUrl}/api/auth/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: formData.role
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user');
        }
        
        // Refresh user list
        fetchUsers();
        alert(`User ${formData.firstName} ${formData.lastName} updated successfully`);
      }
      
      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Toggle user status between active and disabled
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Reset user password
  const resetPassword = async (user) => {
    try {
      const newPassword = generateTemporaryPassword();
      
      const response = await fetch(`${apiUrl}/api/auth/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          password: newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      alert(`Password for ${user.firstName || ''} ${user.lastName || ''} has been reset to: ${newPassword}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Check if current user is an admin
  const isAdmin = currentUser && currentUser.role === 'admin';

  // Check if a user is the last active admin
  const isLastActiveAdmin = (user) => {
    // If not an admin or inactive, they can't be the last active admin
    if (user.role !== 'admin' || !user.isActive) {
      return false;
    }
    // If there's only one active admin, and this is that admin
    return activeAdminCount === 1;
  };

  // Format timestamp for display
  const formatDate = (timestamp) => {
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

  // Generate avatar URL based on user name or username
  const getAvatarUrl = (user) => {
    const seed = user.username || user.email || Date.now();
    return `https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${seed}`;
  };

  // Add User Modal Component
  const UserModal = ({ isOpen, onClose, onSubmit, mode, user }) => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'user',
      isActive: true
    });

    useEffect(() => {
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          username: user.username || '',
          role: user.role || 'user',
          isActive: user.isActive !== undefined ? user.isActive : true,
          password: ''
        });
      }
    }, [user]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {mode === 'create' ? t('userManagement.addUser') : t('userManagement.editUser')}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('userManagement.firstName')}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('userManagement.lastName')}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('userManagement.username')}
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              {mode === 'create' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.password')}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateTemporaryPassword() })}
                      className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                      {t('userManagement.regenerate')}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('userManagement.role')}
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="user">{t('userManagement.user')}</option>
                  <option value="admin">{t('userManagement.admin')}</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('userManagement.active')}
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
                <h1 className="text-2xl text-gray-900 dark:text-white">{t('userManagement.pageTitle')}</h1>
                <div className="flex space-x-3">
                  <button 
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    onClick={openCreateModal}
                  >
                    <span className="mr-2">➕</span>{t('userManagement.addUser')}
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">{t('userManagement.role')}</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">{t('userManagement.allRoles')}</option>
                        <option value="admin">{t('common.admin')}</option>
                        <option value="manager">{t('userManagement.manager')}</option>
                        <option value="user">{t('userManagement.user')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">{t('userManagement.status')}</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">{t('userManagement.allStatus')}</option>
                        <option value="active">{t('userManagement.active')}</option>
                        <option value="disabled">{t('userManagement.disabled')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 dark:text-gray-400">{t('common.search')}</label>
                      <input 
                        type="text" 
                        placeholder={t('userManagement.searchPlaceholder')} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center h-48 text-red-500">
                      {t('userManagement.errorLoadingUsers', { error })}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.user')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.email')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.username')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.role')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.status')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.lastLogin')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('userManagement.actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <img src={getAvatarUrl(user)} className="w-8 h-8 rounded-full mr-3" alt={`${user.firstName || ''} ${user.lastName || ''}`} />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.firstName || ''} {user.lastName || ''}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.username}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                    : user.role === 'manager'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                  {user.isActive ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(user.lastLogin)}</td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex space-x-3">
                                  <button 
                                    onClick={() => openEditModal(user)} 
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                    title={t('userManagement.editUser')}
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => resetPassword(user)}
                                    className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                    title={t('userManagement.resetPassword')}
                                  >
                                    🔑
                                  </button>
                                  <button 
                                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                                    className={`${
                                      user.isActive 
                                        ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                        : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                                    }`}
                                    title={user.isActive ? t('userManagement.disableUser') : t('userManagement.enableUser')}
                                  >
                                    {user.isActive ? '🚫' : '✅'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('userManagement.showingUsers', { 
                        filteredUsersLength: filteredUsers.length,
                        usersLength: users.length 
                      })}
                    </div>
                    {filteredUsers.length > 10 && (
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300">{t('userManagement.previous')}</button>
                        <button className="px-3 py-1 bg-gray-900 text-white rounded-md text-sm dark:bg-blue-700">1</button>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:text-gray-300">{t('userManagement.next')}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for creating or editing a user */}
      {showModal && (
        <UserModal
          isOpen={showModal}
          onClose={closeModal}
          onSubmit={handleSubmit}
          mode={modalMode}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UserManagement;