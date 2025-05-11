import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCsdd } from '../../CsddContext';

const AddVehicleModal = ({ onClose, onSave, vehicleToEdit }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');
  const [initialData, setInitialData] = useState(vehicleToEdit || {});
  const [vehicleData, setVehicleData] = useState(vehicleToEdit || {
    id: '',
    status: 'Active',
    type: 'Vieglais auto',
    lastService: new Date().toLocaleDateString('lv-LV', { month: 'short', day: 'numeric', year: 'numeric' }),
    documents: 'Valid',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license: '',
    regaplnr: '',
    mileage: '',
    reminders: [
      { name: 'Insurance Renewal', date: '2025-01-15', enabled: true },
      { name: 'Service Due', date: '2025-03-20', enabled: true }
    ]
  });  
  // Use csddIntegration from global context
  const { csddIntegration, fetchVehicleDetails: fetchVehicleFromCsdd } = useCsdd();
  const [csddError, setCsddError] = useState(null);
  // Add insuranceLoading state
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  // Add fetchingData state for overall data loading
  const [fetchingData, setFetchingData] = useState(false);  
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  // Update component when vehicleToEdit changes
  useEffect(() => {
    // Store the initial data for comparison when editing
    if (vehicleToEdit) {
      setInitialData(JSON.parse(JSON.stringify(vehicleToEdit)));
      
      // Process reminders to ensure dates are in the correct format (YYYY-MM-DD)
      const processedVehicleData = {...vehicleToEdit};
      if (processedVehicleData.reminders && Array.isArray(processedVehicleData.reminders)) {
        processedVehicleData.reminders = processedVehicleData.reminders.map(reminder => {
          // Ensure date is in proper format for the date input
          if (reminder.date) {
            // If date is already in YYYY-MM-DD format, leave it as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(reminder.date)) {
              return reminder;
            }
            
            // Try to parse the date and format it as YYYY-MM-DD
            try {
              const dateObj = new Date(reminder.date);
              if (!isNaN(dateObj.getTime())) {
                return {
                  ...reminder,
                  date: dateObj.toISOString().split('T')[0]
                };
              }
            } catch (e) {
              console.error('Failed to parse date:', reminder.date, e);
            }
          }
          return reminder;
        });
      }
      
      // Make sure all fields are explicitly set
      setVehicleData({
        ...vehicleData,
        ...processedVehicleData
      });
    }
  }, []);
    // Note: CSDD session is now managed globally through SystemSettings

  // Handle tab change
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate license plate is not empty
    if (!vehicleData.id || vehicleData.id.trim() === '') {
      alert(t('vehicles.errors.licensePlateRequired'));
      return;
    }
    
    // Build a list of changes if we're editing
    let changes = [];
    if (vehicleToEdit) {
      // Compare the fields that were changed
      for (const [key, value] of Object.entries(vehicleData)) {
        // Skip comparing complex objects
        if (typeof value === 'object' && value !== null) continue;
        
        // If the value is different from the initial data, add it to the changes
        if (initialData[key] !== value) {
          changes.push(`${key}: "${initialData[key] || 'none'}" → "${value}"`);
        }
      }
      
      // Special handling for reminders
      if (JSON.stringify(initialData.reminders) !== JSON.stringify(vehicleData.reminders)) {
        changes.push('Reminders were modified');
      }
    }
    
    // Call the onSave function with the updated data and changes
    onSave(vehicleData, vehicleToEdit ? { 
      updatedData: vehicleData, 
      changes 
    } : null);
  };
  
  // Redirect to System Settings page for CSDD connection
  const connectToCsdd = () => {
    alert('Please connect to e.CSDD.lv in System Settings. You will be redirected there now.');
    // Close the current modal
    onClose();
    // Redirect to system settings page
    window.location.href = '/system-settings';
  };
  
  // Fetch vehicle details from CSDD using global context
  const fetchVehicleDetails = async (plateNumber) => {
    if (!plateNumber) {
      alert('Please enter a license plate number first');
      return;
    }

    try {
      setFetchingData(true);
      
      // Use the global context's fetchVehicleDetails function
      const result = await fetchVehicleFromCsdd(plateNumber);
      
      if (!result.success) {
        alert(`Failed to retrieve vehicle information: ${result.message}`);
        return;
      }
      
      const data = result;
      
      // Format the road worthiness date from DD.MM.YYYY to YYYY-MM-DD if it exists
      let formattedRoadWorthinessDate = null;
      if (data.roadWorthinessDate) {
        const parts = data.roadWorthinessDate.split('.');
        if (parts.length === 3) {
          formattedRoadWorthinessDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      // Create updated reminders with roadWorthiness if available
      const updatedReminders = [...(vehicleData.reminders || [])];
      
      // If we have a road worthiness date, update or add this reminder
      if (formattedRoadWorthinessDate) {
        const existingIndex = updatedReminders.findIndex(r => 
          r.name === 'Road Worthiness Certificate' || r.name === 'Road Worthiness');
        
        if (existingIndex >= 0) {
          updatedReminders[existingIndex] = {
            ...updatedReminders[existingIndex],
            name: 'Road Worthiness Certificate',
            date: formattedRoadWorthinessDate,
            enabled: true,
            status: 'Valid'
          };
        } else {
          updatedReminders.push({
            name: 'Road Worthiness Certificate',
            date: formattedRoadWorthinessDate,
            enabled: true,
            status: 'Valid'
          });
        }
      }
      
      // Update vehicle data with CSDD information
      setVehicleData({
        ...vehicleData,
        make: data.make || vehicleData.make,
        model: data.model || vehicleData.model,
        year: data.year || vehicleData.year,
        mileage: data.mileage || vehicleData.mileage,
        regaplnr: data.regaplnr || vehicleData.regaplnr,
        reminders: updatedReminders
      });
      
      // If we have the regaplnr, try to fetch the insurance info
      if (data.regaplnr) {
        getInsuranceInfo(data.regaplnr);
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      alert(`Failed to fetch vehicle details: ${error.message}`);
    } finally {
      setFetchingData(false);
    }
  };
  
  // Get insurance information from CSDD
  const getInsuranceInfo = async (regaplnr) => {
    if (!regaplnr || !vehicleData.id) {
      alert('Registration certificate number and license plate are required');
      return;
    }    
    
    try {
      setInsuranceLoading(true);
      console.log('[Frontend] Fetching insurance info for vehicle:', vehicleData.id, 'with certificate:', regaplnr);
      
      const response = await fetch(`${apiUrl}/api/integrations/insurance/${vehicleData.id}/${regaplnr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.log('[Frontend] No insurance info found:', data.message);
        alert('No insurance info found. Please check the registration certificate number.');
        return;
      }
      
      console.log('[Frontend] Successfully retrieved insurance info:', data);      // Use lastPolicyDate for the reminder date
      if (data.lastPolicyDate) {
        // The lastPolicyDate is already in YYYY-MM-DD format from the backend
        const formattedDate = data.lastPolicyDate;
        
        // Update or add insurance reminder
        const updatedReminders = [...(vehicleData.reminders || [])];
        const existingIndex = updatedReminders.findIndex(r => 
          r.name === 'Insurance' || r.name === 'Insurance Renewal' || r.name === 'OCTA');
        
        if (existingIndex >= 0) {
          updatedReminders[existingIndex] = {
            ...updatedReminders[existingIndex],
            name: 'Insurance Renewal',
            date: formattedDate,
            enabled: true,
            status: 'Valid',
            details: `Insurance due: ${formattedDate}`
          };        } else {
          updatedReminders.push({
            name: 'Insurance Renewal',
            date: formattedDate,
            enabled: true,
            status: 'Valid',
            details: `Insurance due: ${formattedDate}`
          });
        }
        
        // Update vehicle data with insurance information
        setVehicleData({
          ...vehicleData,
          reminders: updatedReminders,
          insurance: {
            lastPolicyDate: data.lastPolicyDate || 'N/A',
            renewalDate: data.renewalDate || 'N/A'
          }
        });
        
        alert('Insurance information successfully added as a reminder');      } else {
        alert('No insurance policy date found in the data.');
      }
    } catch (error) {
      console.error('Error fetching insurance info:', error);
      alert(`Error fetching insurance info: ${error.message}`);
    } finally {
      setInsuranceLoading(false);
    }
  };

  // Disconnect from CSDD
  const disconnectFromCsdd = () => {
    alert('Please disconnect from e.CSDD.lv in System Settings. You will be redirected there now.');
    // Close the current modal
    onClose();
    // Redirect to system settings page
    window.location.href = '/system-settings';
  };

  // Function to add a new reminder
  const addReminder = () => {
    setVehicleData({
      ...vehicleData,
      reminders: [...(vehicleData.reminders || []), {
        name: '',
        date: '',
        enabled: true,
        status: 'Valid'
      }]
    });
  };
  // Function to update a reminder
  const updateReminder = (index, field, value) => {
    const updatedReminders = [...(vehicleData.reminders || [])];
    
    // Special handling for date fields to ensure YYYY-MM-DD format
    if (field === 'date' && value) {
      // If value is already in YYYY-MM-DD format, use it as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        updatedReminders[index] = {
          ...updatedReminders[index],
          [field]: value
        };
      } else {
        // Try to parse and format the date
        try {
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            updatedReminders[index] = {
              ...updatedReminders[index],
              [field]: dateObj.toISOString().split('T')[0]
            };
          } else {
            updatedReminders[index] = {
              ...updatedReminders[index],
              [field]: value // Use original value if parsing fails
            };
          }
        } catch (e) {
          console.error('Failed to parse date:', value, e);
          updatedReminders[index] = {
            ...updatedReminders[index],
            [field]: value // Use original value if an exception occurs
          };
        }
      }
    } else {
      // For non-date fields, update normally
      updatedReminders[index] = {
        ...updatedReminders[index],
        [field]: value
      };
    }
    
    setVehicleData({
      ...vehicleData,
      reminders: updatedReminders
    });
  };

  // Function to remove a reminder
  const removeReminder = (index) => {
    const updatedReminders = [...(vehicleData.reminders || [])];
    updatedReminders.splice(index, 1);
    
    setVehicleData({
      ...vehicleData,
      reminders: updatedReminders
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white">
            {vehicleToEdit ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}
          </h2>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={onClose}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleTabChange('details')}
          >
            {t('vehicles.tabs.details')}
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'reminders' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleTabChange('reminders')}
          >
            {t('vehicles.tabs.reminders')}
          </button>
          <button 
            className={`flex items-center px-4 py-2 text-sm font-medium ${activeTab === 'integrations' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleTabChange('integrations')}
          >
            {t('vehicles.tabs.integrations')}
            {csddIntegration.connectionStatus === 'connected' ? (
              <span className="ml-1 text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
            ) : (
              <span className="ml-1 text-red-600 dark:text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </span>
            )}
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit}>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">
                      {t('vehicles.licensePlate')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="id"
                        value={vehicleData.id || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                        placeholder={t('vehicles.licensePlatePlaceholder')}
                      />
                      {vehicleData.id && csddIntegration.connectionStatus === 'connected' && (
                        <button 
                          type="button"
                          onClick={() => fetchVehicleDetails(vehicleData.id)}
                          disabled={fetchingData}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 flex items-center"
                        >
                          {fetchingData ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{t('common.loading')}</span>
                            </span>
                          ) : (
                            <span className="flex items-center">
                              🔄 {t('vehicles.csddIntegration.autoFill')}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    {csddIntegration.connectionStatus === 'connected' ? (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        {t('vehicles.csddIntegration.connectedMessage')}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('vehicles.csddIntegration.disconnectedMessage')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.status')}</label>
                    <select
                      name="status"
                      value={vehicleData.status || 'Active'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Active">{t('vehicles.statusOptions.active')}</option>
                      <option value="Maintenance">{t('vehicles.statusOptions.maintenance')}</option>
                      <option value="Out of Service">{t('vehicles.statusOptions.outOfService')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.make')}</label>
                    <input
                      type="text"
                      name="make"
                      value={vehicleData.make || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.model')}</label>
                    <input
                      type="text"
                      name="model"
                      value={vehicleData.model || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.year')}</label>
                    <input
                      type="number"
                      name="year"
                      value={vehicleData.year || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.mileage')}</label>
                    <input
                      type="number"
                      name="mileage"
                      value={vehicleData.mileage || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.type')}</label>
                    <select
                      name="type"
                      value={vehicleData.type || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Vieglais auto">{t('vehicles.vehicleTypes.car')}</option>
                      <option value="Kravas auto">{t('vehicles.vehicleTypes.truck')}</option>
                      <option value="Puspiekabe">{t('vehicles.vehicleTypes.trailer')}</option>
                      <option value="Other">{t('vehicles.vehicleTypes.other')}</option>
                    </select>
                  </div>
                </div>                <div>
                  <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.registrationCertificate')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="regaplnr"
                      value={vehicleData.regaplnr || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {vehicleData.id && vehicleData.regaplnr && csddIntegration.connectionStatus === 'connected' && (
                      <button 
                        type="button"
                        onClick={() => getInsuranceInfo(vehicleData.regaplnr)}
                        disabled={insuranceLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 flex items-center"
                      >
                        {insuranceLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('common.loading')}</span>
                          </span>
                        ) : (
                          <span className="flex items-center">
                            🔍 {t('vehicles.csddIntegration.checkInsurance')}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{vehicleData.id && vehicleData.regaplnr && csddIntegration.connectionStatus === 'connected' ? t('vehicles.csddIntegration.checkInsuranceHint') : t('vehicles.csddIntegration.certificateInfo')}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.lastService')}</label>
                  <input
                    type="date"
                    name="lastService"
                    value={vehicleData.lastService || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-4">
                {(vehicleData.reminders || []).map((reminder, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Reminder #{index + 1}</h4>
                      <button 
                        type="button"
                        onClick={() => removeReminder(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ❌ {t('common.remove')}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.reminders.name')}</label>
                        <input
                          type="text"
                          value={reminder.name || ''}
                          onChange={(e) => updateReminder(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>                      <div>
                        <label className="block text-sm text-gray-700 mb-1 dark:text-gray-300">{t('vehicles.reminders.date')}</label>
                        <input
                          type="date"
                          value={reminder.date || ''}
                          onChange={(e) => updateReminder(index, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="YYYY-MM-DD"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={reminder.enabled}
                        onChange={(e) => updateReminder(index, 'enabled', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-700"
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('vehicles.reminders.enabled')}</label>
                    </div>
                    {reminder.details && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {reminder.details}
                      </div>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addReminder}
                  className="w-full py-2 flex justify-center items-center text-sm border border-dashed border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <span className="mr-1">➕</span> {t('vehicles.reminders.addReminder')}
                </button>
              </div>
            )}            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div>
                <div className="mb-6">
                  <h3 className="flex items-center text-lg font-medium text-gray-900 mb-2 dark:text-white">
                    e.CSDD.lv Integration
                    {csddIntegration.connectionStatus === 'connected' ? (
                      <span className="ml-2 text-green-600 dark:text-green-400 p-1 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </span>
                    ) : (
                      <span className="ml-2 text-red-600 dark:text-red-400 p-1 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Connect to e.CSDD.lv to automatically fetch vehicle details and insurance information.
                  </p>
                  
                  {csddIntegration.connectionStatus === 'connected' ? (
                    <div>
                      <div className="p-4 bg-green-50 rounded-md mb-4 dark:bg-green-900/30">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <span className="text-green-400 dark:text-green-300">✓</span>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Connected to e.CSDD.lv</h3>
                            <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                              <p>User: {csddIntegration.userInfo?.firstName || ''} {csddIntegration.userInfo?.lastName || ''}</p>
                              <p>Email: {csddIntegration.credentials?.email || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            You can now use the "Auto Fill" button next to the license plate field to fetch vehicle details.
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                            Note: CSDD connection is now managed in System Settings.
                          </p>
                          <button 
                            type="button" 
                            onClick={() => window.location.href = '/system-settings'}
                            className="px-4 py-2 text-sm border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 w-full dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-900/30"
                          >
                            Go to System Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-md dark:bg-red-900/30">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <span className="text-red-500 dark:text-red-400">✖</span>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Not Connected</h3>
                            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                              <p>CSDD integration is now centrally managed in System Settings. Please go to System Settings to connect to your e.CSDD.lv account.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <button 
                          type="button" 
                          onClick={connectToCsdd}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 w-full dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                          Configure in System Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4 mt-6 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {vehicleToEdit ? t('common.update') : t('common.save')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
