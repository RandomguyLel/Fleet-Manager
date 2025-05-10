import React from 'react';
import NotificationBell from './NotificationBell';
import ProfileDropdown from './ProfileDropdown';
import { useTranslation } from 'react-i18next';

const TopBar = () => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <div className="shrink-0 flex items-center">
            <span className="text-2xl text-blue-600 dark:text-blue-400">🚚</span>
          </div>
          <div className="ml-4 text-xl font-medium text-gray-800 dark:text-white">{t('common.fleetManager')}</div>
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
  );
};

export default TopBar; 