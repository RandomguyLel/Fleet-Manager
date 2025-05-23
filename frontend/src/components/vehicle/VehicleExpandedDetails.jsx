import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateDaysRemaining } from './vehicleUtils';
import VehicleDocuments from './VehicleDocuments';

const VehicleExpandedDetails = ({ 
  vehicle, 
  csddIntegration, 
  syncVehicleRemindersWithCsdd,
  openEditVehicleModal,
  onClose
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');

  // Helper function to get reminder display text
  const getReminderStatusText = (days) => {
    if (days === null) return t('vehicles.documentStatus.unknown');
    if (days < 0) return t('vehicles.reminders.overdue', { days: Math.abs(days) });
    if (days === 0) return t('vehicles.reminders.dueToday');
    return t('vehicles.reminders.daysLeft', { days });
  };
  
  // Helper function to get translated reminder name
  const getTranslatedReminderName = (reminderName) => {
    return t(`vehicles.reminders.${reminderName}`) !== `vehicles.reminders.${reminderName}`
      ? t(`vehicles.reminders.${reminderName}`)
      : reminderName;
  };
    
  // Helper function to get status badge class
  const getReminderStatusClass = (status) => {
    switch(status) {
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800';
      case 'expiring soon':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('vehicles.details')}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'documents'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('vehicles.documents')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('vehicles.vehicleDetails')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('vehicles.make')}:</span> {vehicle.make}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('vehicles.model')}:</span> {vehicle.model}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('vehicles.year')}:</span> {vehicle.year}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('vehicles.licensePlate')}:</span> {vehicle.id}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('vehicles.registrationCertificate')}:</span> {vehicle.regaplnr || '-'}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('vehicles.mileage')}:</span> {vehicle.mileage ? `${vehicle.mileage} km` : '-'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm text-gray-900 dark:text-white">{t('common.reminders')}</h4>
                {csddIntegration && (
                  <button 
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 flex items-center"
                    onClick={() => syncVehicleRemindersWithCsdd(vehicle.id)}
                  >
                    <span className="mr-1">🔄</span>{t('vehicles.csddIntegration.syncWithCsdd')}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {vehicle.reminders && vehicle.reminders.length > 0 ? (
                  vehicle.reminders.filter(r => r.enabled).map((reminder, idx) => {
                    const { days, status } = calculateDaysRemaining(reminder.date);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getTranslatedReminderName(reminder.name)}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {reminder.date && `${t('vehicles.reminders.dueDate')}: ${new Date(reminder.date).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 text-xs rounded-full ${getReminderStatusClass(status)} whitespace-nowrap`}>
                            {status === 'expired' && 
                              <span className="mr-1 text-red-600 dark:text-red-400">⚠️</span>}
                            {getReminderStatusText(days)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('vehicles.reminders.noReminders')}</p>
                    <button 
                      className="mt-2 px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                      onClick={() => openEditVehicleModal(vehicle)}
                    >
                      <span className="mr-1">➕</span>{t('vehicles.reminders.addReminder')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'documents' && (
          <VehicleDocuments vehicleId={vehicle.id} onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default VehicleExpandedDetails;
