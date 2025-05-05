import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';

// Service Modal Component
const ServiceModal = ({ isOpen, onClose, onSave, vehicles, editRecord, selectedVehicle, apiUrl, getAuthHeader }) => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    service_date: new Date().toISOString().split('T')[0],
    mileage: '',
    cost: '',
    technician: '',
    location: '',
    notes: '',
    documents: []
  });

  // Initialize form data when modal opens or editRecord changes
  useEffect(() => {
    if (editRecord) {
      setFormData({
        vehicle_id: editRecord.vehicle_id,
        service_type: editRecord.service_type,
        service_date: editRecord.service_date.substring(0, 10),
        mileage: editRecord.mileage || '',
        cost: editRecord.cost || '',
        technician: editRecord.technician || '',
        location: editRecord.location || '',
        notes: editRecord.notes || '',
        documents: editRecord.documents || []
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
        documents: []
      });
    }
  }, [editRecord, selectedVehicle, isOpen]);

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'mileage' || name === 'cost' ? parseFloat(value) || '' : value;
    setFormData(prevData => ({
      ...prevData,
      [name]: processedValue
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
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
        body: JSON.stringify(formData)
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
            {editRecord ? 'Edit Service Record' : 'Add Service Record'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle
                </label>
                <select
                  id="vehicle_id"
                  name="vehicle_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.vehicle_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.id} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Type
                </label>
                <select
                  id="service_type"
                  name="service_type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.service_type}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select service type</option>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Tire Rotation">Tire Rotation</option>
                  <option value="Brake Service">Brake Service</option>
                  <option value="Engine Service">Engine Service</option>
                  <option value="Transmission Service">Transmission Service</option>
                  <option value="Battery Replacement">Battery Replacement</option>
                  <option value="Air Filter Replacement">Air Filter Replacement</option>
                  <option value="Fluid Service">Fluid Service</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Insurance Renewal">Insurance Renewal</option>
                  <option value="Road Worthiness Certificate">Road Worthiness Certificate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="service_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Date
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
                  Mileage (km)
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.mileage}
                  onChange={handleFormChange}
                  placeholder="e.g. 45000"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost (€)
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.cost}
                  onChange={handleFormChange}
                  placeholder="e.g. 150.75"
                />
              </div>
              
              <div>
                <label htmlFor="technician" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Technician
                </label>
                <input
                  type="text"
                  id="technician"
                  name="technician"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.technician}
                  onChange={handleFormChange}
                  placeholder="e.g. John Smith"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.location}
                onChange={handleFormChange}
                placeholder="e.g. City Service Center"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Enter any additional notes or details here..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {editRecord ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ServiceHistory = () => {
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
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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
      <header className="bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="shrink-0 flex items-center">
                <span className="text-2xl text-blue-600 dark:text-blue-400">🚚</span>
              </div>
              <div className="ml-4 text-xl font-medium text-gray-800 dark:text-white">Fleet Manager</div>
            </div>
            <div className="flex items-center">
              <NotificationBell />
              <div className="ml-4 relative">
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900 dark:text-white">Service History</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    <span className="mr-2">➕</span>Add Service Record
                  </button>
                </div>
              </div>

              {/* Filter by vehicle */}
              <div className="mt-6 bg-white rounded-lg shadow p-4 dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <label htmlFor="vehicleFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filter by Vehicle:
                  </label>
                  <select
                    id="vehicleFilter"
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedVehicle}
                    onChange={handleVehicleChange}
                  >
                    <option value="">All Vehicles</option>
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
                    Service Records {selectedVehicle ? `for ${selectedVehicle}` : ''}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {serviceRecords.length} records found
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Service Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Mileage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Cost
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Actions
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
                                  {record.service_type}
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
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(record.id);
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                              {/* Detail view row - only visible when record is selected */}
                              {selectedRecord && selectedRecord.id === record.id && (
                                <tr>
                                  <td colSpan="6" className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-b border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Details</h4>
                                        <dl className="mt-2 text-sm">
                                          <div className="flex justify-between py-1">
                                            <dt className="text-gray-500 dark:text-gray-400">Mileage:</dt>
                                            <dd className="text-gray-900 dark:text-white">{record.mileage ? `${record.mileage.toLocaleString()} km` : 'Not recorded'}</dd>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <dt className="text-gray-500 dark:text-gray-400">Technician:</dt>
                                            <dd className="text-gray-900 dark:text-white">{record.technician || 'Not recorded'}</dd>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <dt className="text-gray-500 dark:text-gray-400">Location:</dt>
                                            <dd className="text-gray-900 dark:text-white">{record.location || 'Not recorded'}</dd>
                                          </div>
                                        </dl>
                                      </div>
                                      
                                      {record.notes && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h4>
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
                                        View Vehicle
                                      </Link>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(record);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        Edit Details
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
                              No service records found
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