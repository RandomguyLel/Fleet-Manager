import React from 'react';
import { useTranslation } from 'react-i18next';

const VehicleSearchBar = ({ searchQuery, setSearchQuery, openBulkDeleteConfirmation, onExport }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
      <div className="flex items-center space-x-2">
        <button 
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={onExport}
        >
          <span className="mr-1">⬇️</span>{t('common.export')}
        </button>
        <button 
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={openBulkDeleteConfirmation}
        >
          <span className="mr-1">🗑️</span>{t('common.delete')}
        </button>
      </div>
      <div className="relative w-full max-w-xs md:max-w-sm ml-auto">
        <input 
          type="text" 
          placeholder={t('vehicles.searchVehicles')} 
          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">🔍</span>
        {searchQuery && (
          <button 
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => setSearchQuery('')}
          >
            ✖️
          </button>
        )}
      </div>
    </div>
  );
};

export default VehicleSearchBar;
