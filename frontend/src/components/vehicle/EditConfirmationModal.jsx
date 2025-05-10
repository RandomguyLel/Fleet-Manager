import React from 'react';
import { useTranslation } from 'react-i18next';

const EditConfirmationModal = ({ 
  showEditConfirmationModal,
  setShowEditConfirmationModal,
  vehicleChanges,
  handleConfirmEdit
}) => {
  const { t } = useTranslation();

  if (!showEditConfirmationModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white">Confirm Changes</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={() => setShowEditConfirmationModal(false)}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to save the changes?</p>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
            {vehicleChanges?.changes?.map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-2 dark:bg-gray-700 dark:border-gray-600">
          <button 
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md dark:text-gray-300 dark:hover:bg-gray-600"
            onClick={() => setShowEditConfirmationModal(false)}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
            onClick={handleConfirmEdit}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditConfirmationModal;
