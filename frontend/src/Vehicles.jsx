import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './Analytics';

const Vehicles = () => {
  // State for expanded row
  const [expandedRow, setExpandedRow] = useState(null);
  // State for showing/hiding add vehicle modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  // State for vehicles data
  const [vehicles, setVehicles] = useState([]);
  // State for loading
  const [loading, setLoading] = useState(true);
  // State for error
  const [error, setError] = useState(null);
  // State for selected vehicles (for delete)
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // State for vehicle to delete
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/vehicles');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setVehicles(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Toggle expanded row
  const toggleExpandRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  // Get document status class
  const getDocumentStatusClass = (status) => {
    switch (status) {
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Expiring Soon':
        return 'bg-amber-100 text-amber-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    return status === 'Active' 
      ? 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
      : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
  };

  // Add a new vehicle
  const addVehicle = async (vehicleData) => {
    try {
      const response = await fetch('http://localhost:3000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newVehicle = await response.json();
      setVehicles([...vehicles, newVehicle]);
      setShowAddVehicleModal(false);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      // You could set an error state here to display to the user
    }
  };

  // Handle vehicle selection for delete
  const handleVehicleSelection = (vehicleId, isSelected) => {
    if (isSelected) {
      setSelectedVehicles([...selectedVehicles, vehicleId]);
    } else {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
    }
  };

  // Handle select all vehicles
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedVehicles(vehicles.map(vehicle => vehicle.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  // Open delete confirmation for single vehicle
  const openDeleteConfirmation = (vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
  };

  // Open delete confirmation for multiple vehicles
  const openBulkDeleteConfirmation = () => {
    if (selectedVehicles.length === 0) {
      alert('Please select at least one vehicle to delete');
      return;
    }
    setVehicleToDelete(null); // null indicates bulk delete
    setShowDeleteModal(true);
  };

  // Delete a vehicle
  const deleteVehicle = async (vehicleId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the vehicle from the list
      setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId));
      // Remove from selected vehicles too
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return false;
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    let success = true;

    if (vehicleToDelete) {
      // Single vehicle delete
      success = await deleteVehicle(vehicleToDelete.id);
    } else {
      // Bulk delete - delete each selected vehicle
      for (const vehicleId of selectedVehicles) {
        const result = await deleteVehicle(vehicleId);
        if (!result) success = false;
      }
    }

    // Close the modal
    setShowDeleteModal(false);
    setVehicleToDelete(null);
    
    // Show appropriate message
    if (success) {
      alert(vehicleToDelete 
        ? `Vehicle ${vehicleToDelete.id} deleted successfully` 
        : `${selectedVehicles.length} vehicles deleted successfully`);
    } else {
      alert('There was an error deleting one or more vehicles');
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error Loading Vehicles</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-gray-500 text-sm mb-4">
            This could be because the backend server is not running or there was a database error.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="shrink-0 flex items-center">
                <span className="text-2xl text-blue-600">🚚</span>
              </div>
              <div className="ml-4 text-xl font-medium text-gray-800">Fleet Manager</div>
            </div>
            <div className="flex items-center">
              <NotificationBell />
              <div className="ml-4 flex items-center">
                <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
                  <span className="text-sm font-medium text-blue-700">A</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
          <div className="py-6 px-4">
            <div className="px-3 py-2 text-xs uppercase text-gray-500">Main</div>
            <ul className="space-y-1 mt-2">
              <li>
                <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📈</span>
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/vehicles" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">
                  <span className="mr-3 text-blue-500">🚗</span>
                  Vehicles
                </Link>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">🕒</span>
                  Service History
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📄</span>
                  Documents
                </a>
              </li>
            </ul>

            <div className="px-3 py-2 mt-6 text-xs uppercase text-gray-500">Admin</div>
            <ul className="space-y-1 mt-2">
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">⚙️</span>
                  System Settings
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">👥</span>
                  User Management
                </a>
              </li>
              <li>
                <Link to="/audit-log" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <span className="mr-3 text-gray-500">📋</span>
                  Audit Log
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900">Vehicles</h1>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    <span className="mr-2">⬆️</span>Import
                  </button>
                  <button 
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md shadow-sm hover:bg-gray-800"
                    onClick={() => setShowAddVehicleModal(true)}
                  >
                    <span className="mr-2">➕</span>Add Vehicle
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        onChange={(e) => handleSelectAll(e.target.checked)} 
                      />
                      <button 
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        onClick={() => alert('Export functionality not implemented')}
                      >
                        <span className="mr-1">⬇️</span>Export
                      </button>
                      <button 
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        onClick={openBulkDeleteConfirmation}
                      >
                        <span className="mr-1">🗑️</span>Delete
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search vehicles..." 
                        className="pl-8 pr-4 py-2 border border-gray-300 rounded-md"
                      />
                      <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider w-8">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Vehicle ID</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Last Service</th>
                          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Documents</th>
                          <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vehicles.map((vehicle) => (
                          <React.Fragment key={vehicle.id}>
                            <tr className="group hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300" 
                                  onChange={(e) => handleVehicleSelection(vehicle.id, e.target.checked)} 
                                />
                              </td>
                              <td className="px-6 py-4">
                                <button 
                                  className="flex items-center text-sm text-gray-900"
                                  onClick={() => toggleExpandRow(vehicle.id)}
                                >
                                  <span className="mr-2 text-gray-400 transition-transform duration-200" style={{ 
                                    transform: expandedRow === vehicle.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                    display: 'inline-block'
                                  }}>
                                    ▶️
                                  </span>
                                  {vehicle.id}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <span className={getStatusBadgeClass(vehicle.status)}>
                                  {vehicle.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{vehicle.type}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{vehicle.lastService}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${getDocumentStatusClass(vehicle.documents)}`}>
                                  {vehicle.documents}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="invisible group-hover:visible flex justify-end space-x-2">
                                  <button className="p-1 hover:bg-gray-100 rounded">
                                    <span className="text-gray-600">✏️</span>
                                  </button>
                                  <button 
                                    className="p-1 hover:bg-gray-100 rounded"
                                    onClick={() => openDeleteConfirmation(vehicle)}
                                  >
                                    <span className="text-gray-600">🗑️</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedRow === vehicle.id && (
                              <tr>
                                <td colSpan="7" className="px-6 py-4 bg-gray-50">
                                  <div className="space-y-4">
                                    <div className="flex space-x-4">
                                      <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="text-sm text-gray-900 mb-3">Vehicle Details</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <p className="text-gray-500">Make: {vehicle.make}</p>
                                            <p className="text-gray-500">Model: {vehicle.model}</p>
                                            <p className="text-gray-500">Year: {vehicle.year}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">License: {vehicle.license}</p>
                                            <p className="text-gray-500">VIN: {vehicle.vin}</p>
                                            <p className="text-gray-500">Mileage: {vehicle.mileage}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="text-sm text-gray-900 mb-3">Last Known Location</h4>
                                        <div className="bg-gray-200 h-40 rounded flex items-center justify-center">
                                          <span className="text-gray-600">Map View</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <h4 className="text-sm text-gray-900 mb-3">Documents</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <div className="flex items-center">
                                            <span className="text-gray-400 mr-2">📄</span>
                                            <span className="text-sm text-gray-900">Insurance Policy</span>
                                          </div>
                                          <div className="flex space-x-2">
                                            <button className="p-1 hover:bg-gray-200 rounded">
                                              <span className="text-gray-600">⬇️</span>
                                            </button>
                                            <button className="p-1 hover:bg-gray-200 rounded">
                                              <span className="text-gray-600">👁️</span>
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <div className="flex items-center">
                                            <span className="text-gray-400 mr-2">📄</span>
                                            <span className="text-sm text-gray-900">Registration Certificate</span>
                                          </div>
                                          <div className="flex space-x-2">
                                            <button className="p-1 hover:bg-gray-200 rounded">
                                              <span className="text-gray-600">⬇️</span>
                                            </button>
                                            <button className="p-1 hover:bg-gray-200 rounded">
                                              <span className="text-gray-600">👁️</span>
                                            </button>
                                          </div>
                                        </div>
                                        <button className="w-full mt-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                                          <span className="mr-2">➕</span>Add Document
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <AddVehicleModal onClose={() => setShowAddVehicleModal(false)} onSave={addVehicle} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px]">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg text-gray-900">Confirm Deletion</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="text-xl">✖️</span>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">
                {vehicleToDelete 
                  ? `Are you sure you want to delete vehicle ${vehicleToDelete.id}?`
                  : `Are you sure you want to delete ${selectedVehicles.length} vehicles?`}
              </p>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-2">
              <button 
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Vehicle Modal Component
const AddVehicleModal = ({ onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [vehicleData, setVehicleData] = useState({
    id: '',
    status: 'Active',
    type: 'Truck',
    lastService: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    documents: 'Valid',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license: '',
    vin: '',
    mileage: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value
    });
  };
  
  const handleSave = () => {
    // Validate form
    if (!vehicleData.id || !vehicleData.make || !vehicleData.model) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Call the onSave function from parent component
    onSave(vehicleData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg text-gray-900">Add New Vehicle</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">Registration Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="id"
                  value={vehicleData.id}
                  onChange={handleChange}
                  placeholder="XYZ-123" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                />
                <button className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="mr-1">🔍</span>Auto-fill
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">VIN</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="vin"
                  value={vehicleData.vin}
                  onChange={handleChange}
                  placeholder="1HGCM82633A123456" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                />
                <button className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="mr-1">🔍</span>Auto-fill
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <div className="flex space-x-2 mb-4">
              <button 
                className={`px-4 py-2 text-sm rounded-md ${activeTab === 'details' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('details')}
              >
                Vehicle Details
              </button>
              <button 
                className={`px-4 py-2 text-sm rounded-md ${activeTab === 'tracking' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('tracking')}
              >
                Tracking
              </button>
              <button 
                className={`px-4 py-2 text-sm rounded-md ${activeTab === 'documents' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
              <button 
                className={`px-4 py-2 text-sm rounded-md ${activeTab === 'notifications' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
            </div>

            {activeTab === 'details' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Make</label>
                    <input 
                      type="text" 
                      name="make"
                      value={vehicleData.make}
                      onChange={handleChange}
                      placeholder="Toyota" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Model</label>
                    <input 
                      type="text" 
                      name="model"
                      value={vehicleData.model}
                      onChange={handleChange}
                      placeholder="Hino 300" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Year</label>
                    <input 
                      type="text" 
                      name="year"
                      value={vehicleData.year}
                      onChange={handleChange}
                      placeholder="2023" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Type</label>
                    <select 
                      name="type"
                      value={vehicleData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    >
                      <option>Truck</option>
                      <option>Van</option>
                      <option>Car</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Status</label>
                    <select 
                      name="status"
                      value={vehicleData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Current Mileage</label>
                    <input 
                      type="text" 
                      name="mileage"
                      value={vehicleData.mileage}
                      onChange={handleChange}
                      placeholder="45,000" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Enable GPS Tracking</span>
                  </label>
                  <input type="text" placeholder="API Endpoint URL" className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>

                <div className="mt-4">
                  <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    <span className="mr-2">☁️</span>Import Third-party Data
                  </button>
                </div>
              </>
            )}

            {activeTab === 'tracking' && (
              <div className="py-4">
                <p className="text-gray-700">Configure vehicle tracking options here.</p>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="py-4">
                <p className="text-gray-700">Upload and manage vehicle documents here.</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="py-4">
                <p className="text-gray-700">Configure notification settings here.</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h4 className="text-sm text-gray-900 mb-2">Reminder Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  <span className="ml-2 text-sm text-gray-900">Insurance Renewal</span>
                </div>
                <input type="date" className="px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="2025-01-15" />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  <span className="ml-2 text-sm text-gray-900">Service Due</span>
                </div>
                <input type="date" className="px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="2025-03-20" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-2">
          <button 
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800"
            onClick={handleSave}
          >
            Save Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;