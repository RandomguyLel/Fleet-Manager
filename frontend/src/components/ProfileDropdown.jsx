import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';

const ProfileDropdown = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser, logout, darkMode, setDarkMode } = useAuth();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden hover:bg-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:hover:bg-blue-900/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
          {currentUser?.username?.charAt(0) || 'U'}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="py-2">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium">{currentUser?.username || 'User'}</span>
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email || ''}</span>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('profile.darkMode')}</span>
              <button 
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={() => setDarkMode(!darkMode)}
                role="switch"
                aria-checked={darkMode}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <Link 
              to="/profile" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              {t('common.profile')}
            </Link>
            <button 
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;