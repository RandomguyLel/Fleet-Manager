import React from 'react';
import { useTranslation } from 'react-i18next';
import VehicleTableRow from './VehicleTableRow';

const VehicleTable = ({
  filteredVehicles,
  expandedRow,
  toggleExpandRow,
  selectedVehicles,
  handleVehicleSelection,
  allSelected,
  handleSelectAll,
  openEditVehicleModal,
  openDeleteConfirmation,
  getStatusBadgeClass,
  getDocumentStatusClass,
  typeValueToKey,
  csddIntegration,
  syncVehicleRemindersWithCsdd,
  rowRefs
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider w-8 dark:text-gray-400">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 dark:border-gray-700" 
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('vehicles.licensePlate')}</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('vehicles.type')}</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('vehicles.lastService')}</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('vehicles.documents')}</th>
            <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredVehicles.map((vehicle) => (
            <VehicleTableRow
              key={vehicle.id}
              vehicle={vehicle}
              expandedRow={expandedRow}
              toggleExpandRow={toggleExpandRow}
              selectedVehicles={selectedVehicles}
              handleVehicleSelection={handleVehicleSelection}
              openEditVehicleModal={openEditVehicleModal}
              openDeleteConfirmation={openDeleteConfirmation}
              getStatusBadgeClass={getStatusBadgeClass}
              getDocumentStatusClass={getDocumentStatusClass}
              typeValueToKey={typeValueToKey}
              csddIntegration={csddIntegration}
              syncVehicleRemindersWithCsdd={syncVehicleRemindersWithCsdd}
              rowRef={el => {
                if (rowRefs && rowRefs.current) {
                  rowRefs.current[vehicle.id] = el;
                }
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleTable;
