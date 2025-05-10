import React from 'react';
import { useTranslation } from 'react-i18next';
import VehicleExpandedDetails from './VehicleExpandedDetails';

const VehicleTableRow = ({ 
  vehicle,
  expandedRow,
  toggleExpandRow,
  selectedVehicles,
  handleVehicleSelection,
  openEditVehicleModal,
  openDeleteConfirmation,
  getStatusBadgeClass,
  getDocumentStatusClass,
  typeValueToKey,
  csddIntegration,
  syncVehicleRemindersWithCsdd
}) => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <tr className="group hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4">
          <input 
            type="checkbox" 
            className="rounded border-gray-300 dark:border-gray-700" 
            checked={selectedVehicles.includes(vehicle.id)}
            onChange={(e) => handleVehicleSelection(vehicle.id, e.target.checked)} 
          />
        </td>        <td className="px-6 py-4">
          <button 
            className="flex items-center text-sm text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
            onClick={() => toggleExpandRow(vehicle.id)}
          >
            <span 
              className={`mr-2 flex items-center justify-center w-5 h-5 transition-transform duration-200 ${
                expandedRow === vehicle.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}
              style={{ 
                transform: expandedRow === vehicle.id ? 'rotate(90deg)' : 'rotate(0deg)'
              }}
            >
              ▶
            </span>
            <span className="font-medium">{vehicle.id}</span>
          </button>
        </td><td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeClass(vehicle.status)}`}>
            {t('vehicles.statusOptions.' + (vehicle.status ? vehicle.status.toLowerCase() : 'unknown'))}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {t('vehicles.vehicleTypes.' + (typeValueToKey[vehicle.type] || 'other'))}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{vehicle.lastService}</td>        <td className="px-6 py-4">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            getDocumentStatusClass(
              typeof vehicle.documents === 'string'
                ? vehicle.documents
                : (vehicle.documents && typeof vehicle.documents.status === 'string'
                    ? vehicle.documents.status
                    : 'unknown')
            )
          }`}>
            {
              typeof vehicle.documents === 'string'
                ? t('vehicles.documentStatus.' + vehicle.documents.toLowerCase())
                : (vehicle.documents && typeof vehicle.documents.status === 'string'
                    ? t('vehicles.documentStatus.' + vehicle.documents.status.toLowerCase())
                    : t('vehicles.documentStatus.unknown'))
            }
          </span>
        </td><td className="px-6 py-4 text-right">
          <div className="invisible group-hover:visible flex justify-end space-x-2">
            <button 
              className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-700"
              onClick={() => openEditVehicleModal(vehicle)}
              title={t('common.edit')}
            >
              <span className="text-blue-600 dark:text-blue-400">✏️</span>
            </button>
            <button 
              className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-700"
              onClick={() => openDeleteConfirmation(vehicle)}
              title={t('common.delete')}
            >
              <span className="text-red-600 dark:text-red-400">🗑️</span>
            </button>
          </div>
        </td>
      </tr>
      {expandedRow === vehicle.id && (
        <tr>
          <td colSpan="7" className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
            <VehicleExpandedDetails 
              vehicle={vehicle} 
              csddIntegration={csddIntegration}
              syncVehicleRemindersWithCsdd={syncVehicleRemindersWithCsdd}
              openEditVehicleModal={openEditVehicleModal}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default VehicleTableRow;
