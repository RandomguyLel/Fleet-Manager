import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Get current user to check role
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  // Check if sidebar state is saved in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setCollapsed(savedState === 'true');
    }
    
    // Always collapse on mobile by default
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setCollapsed(true);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

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

  return (
    <div className={`relative ${collapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out`}>
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
      
      {/* Combined sidebar for mobile and desktop */}
      <nav 
        id="mobile-sidebar"
        className={`
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0
          fixed md:relative top-0 left-0 h-full z-40 md:z-auto
          bg-white border-r border-gray-200 overflow-y-auto shadow-sm 
          dark:bg-gray-800 dark:border-gray-700 
          ${isTransitioning ? "overflow-hidden" : ""}
          transition-transform duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "w-[85vw] max-w-[300px]" : ""}
          pt-16 md:pt-0
        `}
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
            {(!collapsed || window.innerWidth < 768) && "Main"}
          </div>
          <ul className="space-y-1 mt-2">
            <li>
              <Link 
                to="/" 
                className={getLinkClass('/')} 
                title="Dashboard"
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/') : null}
              >
                <span className={getIconClass('/')}>📊</span>
                {(!collapsed || window.innerWidth < 768) && "Dashboard"}
              </Link>
            </li>
            <li>
              <Link 
                to="/analytics" 
                className={getLinkClass('/analytics')} 
                title="Analytics"
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/analytics') : null}
              >
                <span className={getIconClass('/analytics')}>📈</span>
                {(!collapsed || window.innerWidth < 768) && "Analytics"}
              </Link>
            </li>
            <li>
              <Link 
                to="/vehicles" 
                className={getLinkClass('/vehicles')} 
                title="Vehicles"
                onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/vehicles') : null}
              >
                <span className={getIconClass('/vehicles')}>🚗</span>
                {(!collapsed || window.innerWidth < 768) && "Vehicles"}
              </Link>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  alert('Not yet implemented!');
                }} 
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400 ${collapsed && window.innerWidth >= 768 ? "justify-center" : ""}`}
                title="Service History"
              >
                <span className={`${collapsed && window.innerWidth >= 768 ? "text-xl" : "mr-3"} text-gray-500 dark:text-gray-400`}>🕒</span>
                {(!collapsed || window.innerWidth < 768) && "Service History - NYI"}
              </a>
            </li>
            <li>
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
            </li>
            <li>
                  <Link 
                    to="/profile" 
                    className={getLinkClass('/profile')} 
                    title="Profile"
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/profile') : null}
                  >
                    <span className={getIconClass('/profile')}>👤</span>
                    {(!collapsed || window.innerWidth < 768) && "Profile"}
                  </Link>
                </li>
          </ul>

          {isAdmin && (
            <>
              <div className={`px-3 py-2 mt-6 text-xs uppercase text-gray-500 dark:text-gray-400 ${collapsed && window.innerWidth >= 768 ? "text-center" : ""}`}>
                {(!collapsed || window.innerWidth < 768) && "Admin"}
              </div>
              <ul className="space-y-1 mt-2">
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Not yet implemented!');
                    }} 
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400 ${collapsed && window.innerWidth >= 768 ? "justify-center" : ""}`}
                    title="System Settings"
                  >
                    <span className={`${collapsed && window.innerWidth >= 768 ? "text-xl" : "mr-3"} text-gray-500 dark:text-gray-400`}>⚙️</span>
                    {(!collapsed || window.innerWidth < 768) && "System Settings - NYI"}
                  </a>
                </li>
                <li>
                  <Link 
                    to="/user-management" 
                    className={getLinkClass('/user-management')} 
                    title="User Management"
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/user-management') : null}
                  >
                    <span className={getIconClass('/user-management')}>👥</span>
                    {(!collapsed || window.innerWidth < 768) && "User Management"}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/audit-log" 
                    className={getLinkClass('/audit-log')} 
                    title="Audit Log"
                    onClick={(e) => window.innerWidth >= 768 && collapsed ? handleNavigation(e, '/audit-log') : null}
                  >
                    <span className={getIconClass('/audit-log')}>📋</span>
                    {(!collapsed || window.innerWidth < 768) && "Audit Log"}
                  </Link>
                </li>
                
              </ul>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;