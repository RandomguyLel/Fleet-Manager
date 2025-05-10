import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Sidebar from './components/Sidebar';
import { useTranslation } from 'react-i18next';
import i18n from './i18n/i18n';
import TopBar from './components/TopBar';

// Service Modal Component
const ServiceModal = ({ isOpen, onClose, onSave, vehicles, editRecord, selectedVehicle, apiUrl, getAuthHeader }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    service_date: new Date().toISOString().split('T')[0],
    mileage: '',
    cost: '',
    technician: '',
    location: '',
    notes: '',
    documents: [],
    expense_category: ''
  });

  // Initialize form data when modal opens or editRecord changes
  useEffect(() => {
    if (editRecord) {
      console.log('Edit record:', editRecord); // Debug log
      setFormData(prev => {
        const newFormData = {
          vehicle_id: editRecord.vehicle_id,
          service_type: editRecord.service_type,
          service_date: editRecord.service_date.substring(0, 10),
          mileage: editRecord.mileage || '',
          cost: editRecord.cost || '',
          technician: editRecord.technician || '',
          location: editRecord.location || '',
          notes: editRecord.notes || '',
          documents: editRecord.documents || [],
          expense_category: editRecord.expense_category || editRecord.expenseCategory || ''
        };
        console.log('Form data set in useEffect:', newFormData); // Debug log
        return newFormData;
      });
    } else {
      // Set default values for new record
      setFormData({
        vehicle_id: selectedVehicle || '',
        service_type: '',
        service_date: new Date().toISOString().split('T')[0],
        mileage: '',
        cost: '',
        technician: '',
        location: '',
        notes: '',
        documents: [],
        expense_category: ''
      });
    }
  }, [editRecord, selectedVehicle, isOpen]);

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'mileage' || name === 'cost' ? parseFloat(value) || '' : value;
    
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [name]: processedValue
      };
      
      // Reset expense_category when service_type changes from "Other"
      if (name === 'service_type' && value !== 'Other') {
        newData.expense_category = '';
      }
      
      // Log the form data changes for debugging
      console.log('Form data updated:', newData);
      
      return newData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare data with placeholder values for empty fields
      const processedData = {
        ...formData,
        technician: formData.technician.trim() || 'N/A',
        location: formData.location.trim() || 'N/A',
        notes: formData.notes.trim() || 'N/A',
        mileage: formData.mileage || null,
        cost: formData.cost || null,
        // Only set expense_category if it's not empty and service type is Other
        expense_category: formData.service_type === 'Other' && formData.expense_category ? formData.expense_category : null
      };

      // Log the data being sent for debugging
      console.log('Submitting service record:', processedData);

      const url = editRecord 
        ? `${apiUrl}/api/service-history/${editRecord.id}` 
        : `${apiUrl}/api/service-history`;
      
      const method = editRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${method === 'POST' ? 'creating' : 'updating'} service record`);
      }
      
      // Notify parent that save was successful
      onSave();
      
      alert(`Service record ${editRecord ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving service record:', error);
      alert(`Error: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {editRecord ? t('service.editServiceRecord') : t('service.addServiceRecord')}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.vehicle')}
                </label>
                <select
                  id="vehicle_id"
                  name="vehicle_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.vehicle_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">{t('common.selectVehicle')}</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.id} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('service.serviceType')}
                </label>
                <select
                  id="service_type"
                  name="service_type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.service_type}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">{t('common.selectServiceType')}</option>
                  <option value="Oil Change">{t('service.types.oilChange')}</option>
                  <option value="Tire Rotation">{t('service.types.tireRotation')}</option>
                  <option value="Brake Service">{t('service.types.brakeService')}</option>
                  <option value="Engine Service">{t('service.types.engineService')}</option>
                  <option value="Transmission Service">{t('service.types.transmissionService')}</option>
                  <option value="Battery Replacement">{t('service.types.batteryReplacement')}</option>
                  <option value="Air Filter Replacement">{t('service.types.airFilterReplacement')}</option>
                  <option value="Fluid Service">{t('service.types.fluidService')}</option>
                  <option value="Inspection">{t('service.types.inspection')}</option>
                  <option value="Insurance Renewal">{t('service.types.insuranceRenewal')}</option>
                  <option value="Road Worthiness Certificate">{t('service.types.roadWorthinessCertificate')}</option>
                  <option value="Fuel">{t('service.types.fuel')}</option>
                  <option value="Refueling">{t('service.types.refueling')}</option>
                  <option value="Other">{t('common.other')}</option>
                </select>
              </div>
            </div>
            
            {/* Expense Category selection for "Other" type */}
            {formData.service_type === 'Other' && (
              <div>
                <label htmlFor="expense_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('service.expenseCategory')}
                </label>
                <select
                  id="expense_category"
                  name="expense_category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.expense_category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">{t('common.selectCategory')}</option>
                  <option value="Maintenance">{t('service.categories.maintenance')}</option>
                  <option value="Documents">{t('service.categories.documents')}</option>
                  <option value="Fuel">{t('service.categories.fuel')}</option>
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="service_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('service.serviceDate')}
                </label>
                <input
                  type="date"
                  id="service_date"
                  name="service_date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.service_date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('vehicles.mileage')} (km)
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.mileage}
                  onChange={handleFormChange}
                  placeholder={t('service.placeholders.mileage')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('service.cost')} (€)
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.cost}
                  onChange={handleFormChange}
                  placeholder={t('service.placeholders.cost')}
                />
              </div>
              
              <div>
                <label htmlFor="technician" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('service.technician')}
                </label>
                <input
                  type="text"
                  id="technician"
                  name="technician"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.technician}
                  onChange={handleFormChange}
                  placeholder={t('service.placeholders.technician')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('service.location')}
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.location}
                onChange={handleFormChange}
                placeholder={t('service.placeholders.location')}
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder={t('service.placeholders.notes')}
              />
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ServiceHistory = () => {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const [serviceRecords, setServiceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { getAuthHeader } = useAuth();
  
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Helper to map service type string to translation key
  const serviceTypeToKey = {
    'Oil Change': 'oilChange',
    'Tire Rotation': 'tireRotation',
    'Brake Service': 'brakeService',
    'Engine Service': 'engineService',
    'Transmission Service': 'transmissionService',
    'Battery Replacement': 'batteryReplacement',
    'Air Filter Replacement': 'airFilterReplacement',
    'Fluid Service': 'fluidService',
    'Inspection': 'inspection',
    'Insurance Renewal': 'insuranceRenewal',
    'Road Worthiness Certificate': 'roadWorthinessCertificate',
    'Other': 'other',
    'Spark Plugs Replacement': 'sparkPlugReplacement',
    'Wheel Alignment': 'wheelAlignment',
    'Brake Inspection': 'brakeInspection',
    'Coolant Flush': 'coolantFlush',
    'Engine Tune-up': 'engineTuneUp'
  };
  
  // Format date to a readable format using current language
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };
  
  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/vehicles`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }
      
      const data = await response.json();
      setVehicles(data);
      return data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError(error.message);
      return [];
    }
  }, [apiUrl, getAuthHeader]);
  
  // Fetch service history records
  const fetchServiceHistory = useCallback(async (vid = null) => {
    setLoading(true);
    try {
      const vehicleIdToUse = vid || selectedVehicle;
      
      let url = `${apiUrl}/api/service-history`;
      if (vehicleIdToUse) {
        url = `${apiUrl}/api/vehicles/${vehicleIdToUse}/service-history`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service history: ${response.status}`);
      }
      
      const data = await response.json();
      setServiceRecords(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching service history:', error);
      setError(error.message);
      setServiceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getAuthHeader, selectedVehicle]);
  
  // Handle vehicle selection change
  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    setSelectedVehicle(vehicleId);
    fetchServiceHistory(vehicleId);
  };
  
  // Delete service record
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service record?')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/service-history/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete service record: ${response.status}`);
      }
      
      // Refresh the service history records
      await fetchServiceHistory();
      alert('Service record deleted successfully!');
    } catch (error) {
      console.error('Error deleting service record:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle successful save in modal
  const handleSaveSuccess = async () => {
    // Refresh the service history records
    await fetchServiceHistory();
    
    // Close modal
    setIsModalOpen(false);
    setEditRecord(null);
  };
  
  // Open modal for adding a new record
  const openAddModal = () => {
    setEditRecord(null);
    setIsModalOpen(true);
  };
  
  // Open modal for editing a record
  const openEditModal = (record) => {
    setEditRecord(record);
    setIsModalOpen(true);
  };
  
  // Handle click on a service record row
  const handleRecordClick = (record) => {
    setSelectedRecord(selectedRecord && selectedRecord.id === record.id ? null : record);
  };
  
  // Sidebar collapsed state (lifted up)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      return savedState === 'true';
    }
    return window.innerWidth < 768;
  });
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fetchedVehicles = await fetchVehicles();
      
      // If vehicleId is provided in URL, set it as selected
      if (vehicleId && fetchedVehicles.some(v => v.id === vehicleId)) {
        setSelectedVehicle(vehicleId);
        await fetchServiceHistory(vehicleId);
      } else {
        await fetchServiceHistory();
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [fetchVehicles, fetchServiceHistory, vehicleId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">Loading service history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <div className="py-6 mt-16">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900 dark:text-white">{t('service.serviceHistory')}</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    <span className="mr-2">➕</span>{t('service.addServiceRecord')}
                  </button>
                </div>
              </div>

              {/* Filter by vehicle */}
              <div className="mt-6 bg-white rounded-lg shadow p-4 dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <label htmlFor="vehicleFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('service.filterByVehicle')}:
                  </label>
                  <select
                    id="vehicleFilter"
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedVehicle}
                    onChange={handleVehicleChange}
                  >
                    <option value="">{t('common.allVehicles')}</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.id} - {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Records */}
              <div className="mt-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('service.serviceRecords')} {selectedVehicle ? `${t('common.for')} ${selectedVehicle}` : ''}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {serviceRecords.length} {t('common.recordsFound')}
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('common.vehicle')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('service.serviceType')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('common.date')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('vehicles.mileage')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('service.cost')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t('common.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {serviceRecords.length > 0 ? (
                          serviceRecords.map((record) => (
                            <React.Fragment key={record.id}>
                              <tr 
                                className={`hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${selectedRecord && selectedRecord.id === record.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                onClick={() => handleRecordClick(record)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  <div className="flex flex-col">
                                    <span>{record.vehicle_id}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {record.make} {record.model}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {t(
                                    serviceTypeToKey[record.service_type]
                                      ? `service.types.${serviceTypeToKey[record.service_type]}`
                                      : record.service_type || t('common.other')
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(record.service_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {record.mileage ? `${record.mileage.toLocaleString()} km` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {record.cost ? formatCurrency(record.cost) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(record);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(record.id);
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    {t('common.delete')}
                                  </button>
                                </td>
                              </tr>
                              {/* Detail view row - only visible when record is selected */}
                              {selectedRecord && selectedRecord.id === record.id && (
                                <tr>
                                  <td colSpan="6" className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-b border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.details')}</h4>
                                        <dl className="mt-2 text-sm">
                                          <div className="flex justify-between py-1">
                                            <dt className="text-gray-500 dark:text-gray-400">{t('vehicles.mileage')}:</dt>
                                            <dd className="text-gray-900 dark:text-white">{record.mileage ? `${record.mileage.toLocaleString()} km` : t('common.notRecorded')}</dd>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <dt className="text-gray-500 dark:text-gray-400">{t('service.technician')}:</dt>
                                            <dd className="text-gray-900 dark:text-white">{record.technician || t('common.notRecorded')}</dd>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <dt className="text-gray-500 dark:text-gray-400">{t('service.location')}:</dt>
                                            <dd className="text-gray-900 dark:text-white">{record.location || t('common.notRecorded')}</dd>
                                          </div>
                                        </dl>
                                      </div>
                                      
                                      {record.notes && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.notes')}</h4>
                                          <div className="mt-2 p-3 bg-gray-100 rounded dark:bg-gray-600/50">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap dark:text-gray-300">{record.notes}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-4 flex justify-end space-x-2">
                                      <Link 
                                        to={`/vehicles/${record.vehicle_id}`} 
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {t('common.viewVehicle')}
                                      </Link>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(record);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        {t('common.editDetails')}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              {t('service.noServiceRecords')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal for adding/editing service records */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        vehicles={vehicles}
        editRecord={editRecord}
        selectedVehicle={selectedVehicle}
        apiUrl={apiUrl}
        getAuthHeader={getAuthHeader}
      />
    </div>
  );
};

export default ServiceHistory;