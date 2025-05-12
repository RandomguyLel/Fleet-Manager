import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ProfileDropdown from './ProfileDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../AuthContext';
import DebugUtils from './DebugUtils';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);
  
  // Get current user to check role
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle for mobile screens
      if (window.innerWidth >= 768) return;
      
      const sidebarElement = document.getElementById('mobile-sidebar');
      if (mobileOpen && sidebarElement && !sidebarElement.contains(event.target) && !event.target.id.includes('sidebar-toggle')) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  // Close mobile sidebar when changing routes
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [currentPath]);
  
  // Handle sidebar toggle with transition
  const toggleSidebar = () => {
    setIsTransitioning(true);
    setCollapsed(!collapsed);
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Match this with the CSS transition duration
  };
  
  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    // Toggle the mobile sidebar open/close state
    setMobileOpen(prevState => !prevState);
  };

  // Handle navigation without toggling collapsed state
  const handleNavigation = (e, path, isExternal = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isExternal) {
      // For external actions like alerts
      return;
    }
    
    // Navigate to the path while preserving sidebar state
    navigate(path);
  };
  
  // Helper function to determine if a link is active
  const isActive = (path) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };
  
  // Get link class based on active state
  const getLinkClass = (path) => {
    return isActive(path)
      ? `flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 ${collapsed ? "justify-center" : ""}`
      : `flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400 ${collapsed ? "justify-center" : ""}`;
  };
  
  // Get icon class based on active state
  const getIconClass = (path) => {
    return isActive(path)
      ? `${collapsed ? "text-xl" : "mr-3"} text-blue-500 dark:text-blue-400`
      : `${collapsed ? "text-xl" : "mr-3"} text-gray-500 dark:text-gray-400`;
  };

  // Toggle debug tools modal
  const toggleDebugTools = () => {
    setShowDebugTools(!showDebugTools);
  };

  return (
    <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 ${collapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
      {/* Desktop Language Switcher */}
      <div className={`hidden md:flex justify-center py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
        <LanguageSwitcher collapsed={collapsed} />
      </div>
      {/* Mobile header with the app name, hamburger menu, notification bell, and profile dropdown */}
      <div className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center">
          <button 
            id="mobile-sidebar-toggle"
            className="flex items-center justify-center p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 mr-2"
            onClick={toggleMobileSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="text-lg">☰</span>
          </button>
          <span className="text-2xl text-blue-400 mr-2">🚚</span>
          <span className="text-xl font-medium text-white">Fleet Manager</span>
        </div>
        <div className="flex items-center space-x-2">
          <LanguageSwitcher collapsed={collapsed} />
          <NotificationBell />
          <ProfileDropdown />
        </div>
      </div>
      
      {/* Desktop burger menu toggle button - positioned on nav edge */}
      <button 
        id="desktop-sidebar-toggle"
        className="hidden md:block md:absolute md:right-[-12px] md:top-4 z-10 p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? 
          <span className="text-xs">☰</span> : 
          <span className="text-xs">✖️</span>
        }
      </button>

      {/* Mobile sidebar - full screen overlay */}
      <div 
        className={`md:hidden fixed inset-0 bg-gray-900/50 z-40 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />
      
      {/* Mobile sidebar overlay (not in flex flow) */}
      <nav
        id="mobile-sidebar"
        className={`md:hidden fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 overflow-y-auto shadow-sm dark:bg-gray-800 dark:border-gray-700 transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} w-[85vw] max-w-[300px] pt-16 ${isTransitioning ? "overflow-hidden" : ""}`}
        style={{ willChange: 'transform' }}
      >
        <div className="py-6 px-4">
          {/* Mobile close button */}
          <div className="md:hidden flex justify-end mb-4">
            <button 
              className="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={toggleMobileSidebar}
              aria-label="Close sidebar"
            >
              <span className="text-lg">✖️</span>
            </button>
          </div>
          
          <div className={`px-3 py-2 text-xs uppercase text-gray-500 dark:text-gray-400 ${collapsed && window.innerWidth >= 768 ? "text-center" : ""}`}>
            {(!collapsed || window.innerWidth < 768) && t('common.main')}
          </div>
          <ul className="space-y-1 mt-2">
            <li>
              <Link 
                to="/" 
                className={getLinkClass('/')} 
                title={t('common.dashboard')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/') : null}
              >
                <span className={getIconClass('/')}>📊</span>
                {(!collapsed || window.innerWidth < 768) && t('common.dashboard')}
              </Link>
            </li>
            <li>
              <Link 
                to="/analytics" 
                className={getLinkClass('/analytics')} 
                title={t('common.analytics')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/analytics') : null}
              >
                <span className={getIconClass('/analytics')}>📈</span>
                {(!collapsed || window.innerWidth < 768) && t('common.analytics')}
              </Link>
            </li>
            <li>
              <Link 
                to="/vehicles" 
                className={getLinkClass('/vehicles')} 
                title={t('common.vehicles')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/vehicles') : null}
              >
                <span className={getIconClass('/vehicles')}>🚗</span>
                {(!collapsed || window.innerWidth < 768) && t('common.vehicles')}
              </Link>
            </li>
            <li>
              <Link 
                to="/service-history" 
                className={getLinkClass('/service-history')} 
                title={t('common.serviceHistory')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/service-history') : null}
              >
                <span className={getIconClass('/service-history')}>🔧</span>
                {(!collapsed || window.innerWidth < 768) && t('common.serviceHistory')}
              </Link>
            </li>
            <li>
              <Link 
                to="/calendar" 
                className={getLinkClass('/calendar')} 
                title={t('common.calendar')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/calendar') : null}
              >
                <span className={getIconClass('/calendar')}>📅</span>
                {(!collapsed || window.innerWidth < 768) && t('common.calendar')}
              </Link>
            </li>

            <li>
              <Link 
                to="/profile" 
                className={getLinkClass('/profile')} 
                title={t('common.profile')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/profile') : null}
              >
                <span className={getIconClass('/profile')}>👤</span>
                {(!collapsed || window.innerWidth < 768) && t('common.profile')}
              </Link>
            </li>
            <li>
              <Link 
                to="/system-settings" 
                className={getLinkClass('/system-settings')} 
                title={t('common.systemSettings')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/system-settings') : null}
              >
                <span className={getIconClass('/system-settings')}>⚙️</span>
                {(!collapsed || window.innerWidth < 768) && t('common.systemSettings')}
              </Link>
            </li>
          </ul>

          {isAdmin && (
            <>
              <div className={`px-3 py-2 mt-6 text-xs uppercase text-gray-500 dark:text-gray-400 ${collapsed && window.innerWidth >= 768 ? "text-center" : ""}`}>
                {(!collapsed || window.innerWidth < 768) && t('common.admin')}
              </div>
              <ul className="space-y-1 mt-2">
                <li>
                  <Link 
                    to="/user-management" 
                    className={getLinkClass('/user-management')} 
                    title={t('common.userManagement')}
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/user-management') : null}
                  >
                    <span className={getIconClass('/user-management')}>👥</span>
                    {(!collapsed || window.innerWidth < 768) && t('common.userManagement')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/audit-log" 
                    className={getLinkClass('/audit-log')} 
                    title={t('common.auditLog')}
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/audit-log') : null}
                  >
                    <span className={getIconClass('/audit-log')}>📋</span>
                    {(!collapsed || window.innerWidth < 768) && t('common.auditLog')}
                  </Link>
                </li>
                
                {/* Debug section for admins */}
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDebugTools();
                    }} 
                    className={`flex items-center px-3 py-2 mt-4 text-sm font-medium rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 ${collapsed && window.innerWidth >= 768 ? "justify-center" : ""}`}
                    title="Debug Tools"
                  >
                    <span className={`${collapsed && window.innerWidth >= 768 ? "text-xl" : "mr-3"} text-purple-500 dark:text-purple-400`}>🐞</span>
                    {(!collapsed || window.innerWidth < 768) && "Debug Tools"}
                  </a>
                </li>
              </ul>
            </>
          )}
        </div>
      </nav>

      {/* Desktop sidebar (in flex flow) */}
      <nav
        className={`hidden md:block fixed md:relative top-0 left-0 h-full z-40 md:z-auto bg-white border-r border-gray-200 overflow-y-auto shadow-sm dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-64"} pt-0`}
      >
        <div className="py-6 px-4">
          <div className={`px-3 py-2 text-xs uppercase text-gray-500 dark:text-gray-400 ${collapsed && window.innerWidth >= 768 ? "text-center" : ""}`}>
            {(!collapsed || window.innerWidth < 768) && t('common.main')}
          </div>
          <ul className="space-y-1 mt-2">
            <li>
              <Link 
                to="/" 
                className={getLinkClass('/')} 
                title={t('common.dashboard')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/') : null}
              >
                <span className={getIconClass('/')}>📊</span>
                {(!collapsed || window.innerWidth < 768) && t('common.dashboard')}
              </Link>
            </li>
            <li>
              <Link 
                to="/analytics" 
                className={getLinkClass('/analytics')} 
                title={t('common.analytics')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/analytics') : null}
              >
                <span className={getIconClass('/analytics')}>📈</span>
                {(!collapsed || window.innerWidth < 768) && t('common.analytics')}
              </Link>
            </li>
            <li>
              <Link 
                to="/vehicles" 
                className={getLinkClass('/vehicles')} 
                title={t('common.vehicles')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/vehicles') : null}
              >
                <span className={getIconClass('/vehicles')}>🚗</span>
                {(!collapsed || window.innerWidth < 768) && t('common.vehicles')}
              </Link>
            </li>
            <li>
              <Link 
                to="/service-history" 
                className={getLinkClass('/service-history')} 
                title={t('common.serviceHistory')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/service-history') : null}
              >
                <span className={getIconClass('/service-history')}>🔧</span>
                {(!collapsed || window.innerWidth < 768) && t('common.serviceHistory')}
              </Link>
            </li>
            <li>
              <Link 
                to="/calendar" 
                className={getLinkClass('/calendar')} 
                title={t('common.calendar')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/calendar') : null}
              >
                <span className={getIconClass('/calendar')}>📅</span>
                {(!collapsed || window.innerWidth < 768) && t('common.calendar')}
              </Link>
            </li>
            {/*<li>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  alert('Not yet implemented!');
                }} 
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400 ${collapsed && window.innerWidth >= 768 ? "justify-center" : ""}`}
                title="Documents"
              >
                <span className={`${collapsed && window.innerWidth >= 768 ? "text-xl" : "mr-3"} text-gray-500 dark:text-gray-400`}>📄</span>
                {(!collapsed || window.innerWidth < 768) && "Documents - NYI"}
              </a>
            </li>*/}
            <li>
              <Link 
                to="/profile" 
                className={getLinkClass('/profile')} 
                title={t('common.profile')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/profile') : null}
              >
                <span className={getIconClass('/profile')}>👤</span>
                {(!collapsed || window.innerWidth < 768) && t('common.profile')}
              </Link>
            </li>
            <li>
              <Link 
                to="/system-settings" 
                className={getLinkClass('/system-settings')} 
                title={t('common.systemSettings')}
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/system-settings') : null}
              >
                <span className={getIconClass('/system-settings')}>⚙️</span>
                {(!collapsed || window.innerWidth < 768) && t('common.systemSettings')}
              </Link>
            </li>
          </ul>

          {isAdmin && (
            <>
              <div className={`px-3 py-2 mt-6 text-xs uppercase text-gray-500 dark:text-gray-400 ${collapsed && window.innerWidth >= 768 ? "text-center" : ""}`}>
                {(!collapsed || window.innerWidth < 768) && t('common.admin')}
              </div>
              <ul className="space-y-1 mt-2">
                <li>
                  <Link 
                    to="/user-management" 
                    className={getLinkClass('/user-management')} 
                    title={t('common.userManagement')}
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/user-management') : null}
                  >
                    <span className={getIconClass('/user-management')}>👥</span>
                    {(!collapsed || window.innerWidth < 768) && t('common.userManagement')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/audit-log" 
                    className={getLinkClass('/audit-log')} 
                    title={t('common.auditLog')}
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/audit-log') : null}
                  >
                    <span className={getIconClass('/audit-log')}>📋</span>
                    {(!collapsed || window.innerWidth < 768) && t('common.auditLog')}
                  </Link>
                </li>
                
                {/* Debug section for admins */}
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDebugTools();
                    }} 
                    className={`flex items-center px-3 py-2 mt-4 text-sm font-medium rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 ${collapsed && window.innerWidth >= 768 ? "justify-center" : ""}`}
                    title="Debug Tools"
                  >
                    <span className={`${collapsed && window.innerWidth >= 768 ? "text-xl" : "mr-3"} text-purple-500 dark:text-purple-400`}>🐞</span>
                    {(!collapsed || window.innerWidth < 768) && "Debug Tools"}
                  </a>
                </li>
              </ul>
            </>
          )}
        </div>
      </nav>

      {/* Debug tools modal */}
      {showDebugTools && (
        <DebugUtils onClose={() => setShowDebugTools(false)} />
      )}
    </div>
  );
};

export default Sidebar;