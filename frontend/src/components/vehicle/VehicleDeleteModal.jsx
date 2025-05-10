import React from 'react';
import { useTranslation } from 'react-i18next';

const VehicleDeleteModal = ({ 
  showDeleteModal, 
  setShowDeleteModal, 
  vehicleToDelete, 
  selectedVehicles,
  handleDeleteConfirm 
}) => {
  const { t } = useTranslation();

  if (!showDeleteModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white">{t('common.warning')}</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={() => setShowDeleteModal(false)}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300">
            {vehicleToDelete 
              ? t('vehicles.confirmDelete')
              : t('vehicles.confirmDeleteMultiple', { count: selectedVehicles.length })}
          </p>
        </div>
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-2 dark:bg-gray-700 dark:border-gray-600">
          <button 
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md dark:text-gray-300 dark:hover:bg-gray-600"
            onClick={() => setShowDeleteModal(false)}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600"
            onClick={handleDeleteConfirm}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleDeleteModal;
