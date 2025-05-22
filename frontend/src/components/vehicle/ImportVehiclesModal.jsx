import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCsdd } from '../../CsddContext';
import { useAuth } from '../../AuthContext';

const ImportVehiclesModal = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const { csddIntegration } = useCsdd();
  const { getAuthHeader, currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // If not connected to CSDD, show error and do not fetch
      if (csddIntegration.connectionStatus !== 'connected') {
        setError(t('alerts.csddNotConnectedImport'));
        setVehicles([]);
        return;
      }
      fetchVehicles();
    }
  }, [isOpen, csddIntegration.connectionStatus, t]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/csdd/vehicles`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vehicles from CSDD');
      }

      const data = await response.json();
      setVehicles(data.vehicles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      }
      return [...prev, vehicleId];
    });
  };

  const handleSelectAll = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map(v => v.id));
    }
  };

  // Helper to map CSDD type to supported type
  function mapVehicleType(type) {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower.includes('vieglais')) return 'Vieglais auto';
    if (lower.includes('smagais') || lower.includes('kravas')) return 'Kravas auto';
    if (lower.includes('laiva')) return 'Laiva';
    if (lower.includes('piekabe')) return 'Piekabe';
    return type;
  }

  // Helper to map CSDD status to app status
  function mapVehicleStatus(status) {
    if (!status) return 'active';
    const lower = status.toLowerCase();
    if (lower.includes('uzskaitē')) return 'active';
    if (lower.includes('izslēgts') || lower.includes('pārtraukta')) return 'inactive';
    // Add more mappings as needed
    return 'active';
  }

  // Helper to convert DD.MM.YYYY to YYYY-MM-DD
  function toISODate(dateStr) {
    if (!dateStr) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateStr;
  }

  const handleImport = async () => {
    if (selectedVehicles.length === 0) {
      alert(t('alerts.importSelect'));
      return;
    }

    try {
      setImporting(true);
      setImportProgress(0);

      const selectedVehiclesData = vehicles.filter(v => selectedVehicles.includes(v.id));
      const totalVehicles = selectedVehiclesData.length;

      for (let i = 0; i < selectedVehiclesData.length; i++) {
        const vehicle = selectedVehiclesData[i];
        // Always use correct userId for details fetch
        const detailsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/csdd/vehicle/${vehicle.id}?userId=${currentUser.id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        });

        if (!detailsResponse.ok) {
          console.error(`Failed to fetch details for vehicle ${vehicle.id}`);
          continue;
        }

        const details = await detailsResponse.json();
        // Prepare reminders array
        let reminders = details.reminders ? [...details.reminders] : [];
        // Add road worthiness reminder if available
        if (details.roadWorthinessDate) {
          reminders.push({
            name: 'Road Worthiness Certificate',
            date: toISODate(details.roadWorthinessDate),
            enabled: true
          });
        }
        // Fetch insurance info if regaplnr is available
        const regaplnr = details.regaplnr || vehicle.regaplnr;
        if (regaplnr) {
          try {
            console.log('Attempting insurance fetch for', vehicle.id, 'regaplnr:', regaplnr);
            const insuranceUrl = `${import.meta.env.VITE_API_URL}/api/integrations/insurance/${vehicle.id}/${regaplnr}?userId=${currentUser.id}`;
            console.log('Insurance fetch URL:', insuranceUrl);
            const insuranceRes = await fetch(
              insuranceUrl,
              {
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeader()
                }
              }
            );
            if (insuranceRes.ok) {
              const insuranceData = await insuranceRes.json();
              console.log('Insurance API response:', insuranceData);
              if (insuranceData.success && insuranceData.lastPolicyDate) {
                reminders.push({
                  name: 'Insurance Renewal',
                  date: toISODate(insuranceData.lastPolicyDate),
                  enabled: true
                });
              } else {
                console.log('No valid insurance date for', vehicle.id);
              }
            } else {
              console.log('Insurance fetch failed for', vehicle.id, 'status:', insuranceRes.status);
            }
          } catch (e) {
            console.error('Insurance fetch error for', vehicle.id, e);
          }
        } else {
          console.log('No regaplnr for', vehicle.id);
        }
        // Prepare vehicle data for import, mapping type and status
        const vehicleData = {
          id: vehicle.id,
          make: details.make || vehicle.make,
          model: details.model || vehicle.model,
          type: mapVehicleType(vehicle.type),
          regaplnr: regaplnr,
          year: details.year,
          mileage: details.mileage,
          reminders,
          status: mapVehicleStatus(vehicle.status),
        };

        // Import the vehicle
        await onImport(vehicleData);
        // Update progress
        setImportProgress(((i + 1) / totalVehicles) * 100);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('vehicles.importFromCsdd')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {selectedVehicles.length === vehicles.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVehicles.length} of {vehicles.length} selected
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('vehicles.licensePlate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('vehicles.model')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('vehicles.type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('vehicles.registrationCertificate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.includes(vehicle.id)}
                          onChange={() => handleSelectVehicle(vehicle.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {vehicle.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {vehicle.make}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {vehicle.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {vehicle.regaplnr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importing && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Importing vehicles... {Math.round(importProgress)}%
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                disabled={importing}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleImport}
                disabled={selectedVehicles.length === 0 || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? t('common.importing') : t('common.import')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportVehiclesModal; 