import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './components/NotificationBell';

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
  // State for CSDD integration
  const [csddIntegration, setCsddIntegration] = useState({
    connectionStatus: 'disconnected',
    userInfo: null,
    credentials: { email: '', password: '' }
  });
  // State for vehicle being edited
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  // State for edit confirmation modal
  const [showEditConfirmationModal, setShowEditConfirmationModal] = useState(false);
  // State for tracked changes
  const [vehicleChanges, setVehicleChanges] = useState(null);
  // Get auth context
  const { currentUser, logout, getAuthHeader } = useAuth();
  // State for user profile dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  // State for insurance loading
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  // Add fetchingData state for overall data loading
  const [fetchingData, setFetchingData] = useState(false);

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/vehicles`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setVehicles(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError(`Error fetching vehicles: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [getAuthHeader, apiUrl]);

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

  // Open edit vehicle modal
  const openEditVehicleModal = (vehicle) => {
    setVehicleToEdit(vehicle);
    setShowAddVehicleModal(true);
  };

  // Add a new vehicle
  const addVehicle = async (vehicleData) => {
    try {
      const response = await fetch(`${apiUrl}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate vehicle error
        if (response.status === 409 && errorData.code === 'DUPLICATE_VEHICLE') {
          alert(`Error: ${errorData.error}`);
          return false;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newVehicle = await response.json();
      setVehicles([...vehicles, newVehicle]);
      setShowAddVehicleModal(false);
      return true;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Failed to add vehicle. Please try again.');
      return false;
    }
  };

  // Update an existing vehicle
  const updateVehicle = async (updatedVehicleData, changes) => {
    try {
      const response = await fetch(`${apiUrl}/api/vehicles/${updatedVehicleData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updatedVehicleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedVehicle = await response.json();
      
      // Update the vehicles array with the updated vehicle
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
      ));

      // Close the modals
      setShowEditConfirmationModal(false);
      setShowAddVehicleModal(false);
      
      // Reset the edit state
      setVehicleToEdit(null);
      setVehicleChanges(null);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle. Please try again.');
    }
  };

  // Handle save from the modal
  const handleSaveVehicle = (vehicleData, changes = null) => {
    if (vehicleToEdit) {
      // If we're editing, show confirmation with changes
      setVehicleChanges(changes);
      setShowEditConfirmationModal(true);
    } else {
      // If we're adding a new vehicle, just save it
      addVehicle(vehicleData);
    }
  };

  // Handle confirmation of edit
  const handleConfirmEdit = () => {
    if (vehicleChanges && vehicleChanges.updatedData) {
      updateVehicle(vehicleChanges.updatedData, vehicleChanges.changes);
    } else {
      setShowEditConfirmationModal(false);
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
      const response = await fetch(`${apiUrl}/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
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

  // Sync vehicle reminders with latest data from CSDD
  const syncVehicleRemindersWithCsdd = async (vehicleId) => {
    if (!vehicleId) {
      alert('No vehicle ID provided');
      return null;
    }

    try {
      console.log('[Frontend] Syncing reminders for vehicle:', vehicleId);
      
      // First check if we have an active CSDD connection
      const sessionResponse = await fetch(`${apiUrl}/api/integrations/csdd/session/default`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.success || !sessionData.connected) {
        alert('You need to connect to e.csdd.lv first. Please go to Edit Vehicle > Integrations tab to connect.');
        return null;
      }
      
      // Fetch the latest data from CSDD
      const response = await fetch(`${apiUrl}/api/integrations/csdd/vehicle/${vehicleId}?userId=default`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle details: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to retrieve vehicle information');
      }
      
      console.log('[Frontend] Successfully retrieved vehicle details from CSDD:', data);
      
      // Find the vehicle in our list
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found in the list');
      }
      
      // Format the road worthiness date from DD.MM.YYYY to YYYY-MM-DD
      let formattedRoadWorthinessDate = null;
      if (data.roadWorthinessDate) {
        const parts = data.roadWorthinessDate.split('.');
        if (parts.length === 3) {
          formattedRoadWorthinessDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      // Create a copy of the vehicle with updated reminders
      const updatedVehicle = { ...vehicle };
      const updatedReminders = updatedVehicle.reminders ? [...updatedVehicle.reminders] : [];
      
      // If we have a road worthiness date, update or add this reminder
      if (formattedRoadWorthinessDate) {
        const roadWorthinessIndex = updatedReminders.findIndex(
          reminder => reminder.name === 'Road Worthiness Certificate'
        );
        
        if (roadWorthinessIndex >= 0) {
          // Update existing reminder
          updatedReminders[roadWorthinessIndex] = {
            ...updatedReminders[roadWorthinessIndex],
            date: formattedRoadWorthinessDate,
            enabled: true
          };
        } else {
          // Add new reminder
          updatedReminders.push({
            name: 'Road Worthiness Certificate',
            date: formattedRoadWorthinessDate,
            enabled: true
          });
        }
      }
      
      // Update other vehicle details
      updatedVehicle.reminders = updatedReminders;
      updatedVehicle.make = data.make || updatedVehicle.make;
      updatedVehicle.model = data.model || updatedVehicle.model;
      updatedVehicle.year = data.year || updatedVehicle.year;
      updatedVehicle.mileage = data.mileage || updatedVehicle.mileage;
      
      // Update the vehicle in the database
      const updateResponse = await fetch(`${apiUrl}/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updatedVehicle),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to update vehicle: ${updateResponse.statusText}`);
      }
      
      const updatedVehicleData = await updateResponse.json();
      
      // Update the vehicles array with the updated vehicle
      setVehicles(vehicles.map(v => 
        v.id === updatedVehicleData.id ? updatedVehicleData : v
      ));
      
      // Check if we also have the regaplnr and fetch insurance info if available
      if (data.regaplnr || updatedVehicle.regaplnr) {
        console.log('[Frontend] Registration Certificate Number available, also fetching insurance info');
        try {
          // Use the fetchInsuranceInfo function without showing its own alert
          // to combine alerts at the end
          let insuranceSuccess = false;
          
          await fetch(`${apiUrl}/api/integrations/insurance/${vehicleId}/${data.regaplnr || updatedVehicle.regaplnr}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader()
            }
          }).then(async (insuranceResponse) => {
            if (insuranceResponse.ok) {
              const insuranceData = await insuranceResponse.json();
              
              if (insuranceData.success && insuranceData.lastPolicyDate) {
                console.log('[Frontend] Found insurance policy date:', insuranceData.lastPolicyDate);
                
                // Make a copy of the updated reminders
                const insuranceUpdatedReminders = [...updatedVehicleData.reminders];
                
                const insuranceIndex = insuranceUpdatedReminders.findIndex(
                  reminder => reminder.name === 'Insurance Renewal'
                );
                
                if (insuranceIndex >= 0) {
                  // Update existing reminder
                  insuranceUpdatedReminders[insuranceIndex] = {
                    ...insuranceUpdatedReminders[insuranceIndex],
                    date: insuranceData.lastPolicyDate,
                    enabled: true
                  };
                } else {
                  // Add new reminder
                  insuranceUpdatedReminders.push({
                    name: 'Insurance Renewal',
                    date: insuranceData.lastPolicyDate,
                    enabled: true
                  });
                }
                
                // Update the vehicle with insurance data
                const insuranceUpdatedVehicle = {
                  ...updatedVehicleData,
                  reminders: insuranceUpdatedReminders
                };
                
                // Save the updated vehicle with insurance data
                const finalUpdateResponse = await fetch(`${apiUrl}/api/vehicles/${vehicleId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                  },
                  body: JSON.stringify(insuranceUpdatedVehicle),
                });
                
                if (finalUpdateResponse.ok) {
                  const finalUpdatedVehicleData = await finalUpdateResponse.json();
                  
                  // Update the vehicles array with the final updated vehicle
                  setVehicles(vehicles.map(v => 
                    v.id === finalUpdatedVehicleData.id ? finalUpdatedVehicleData : v
                  ));
                  
                  // Return the final updated vehicle data
                  updatedVehicleData.reminders = insuranceUpdatedReminders;
                  insuranceSuccess = true;
                }
              }
            }
          }).catch(error => {
            console.error('[Frontend] Error fetching insurance info during sync:', error);
          });
          
          // Show success message with information about what was updated
          alert(insuranceSuccess 
            ? 'All vehicle data successfully synchronized: Road worthiness and insurance reminders updated.' 
            : 'Vehicle data partially synchronized: Road worthiness updated, but insurance data could not be retrieved.');
        } catch (error) {
          console.error('[Frontend] Error updating insurance info during sync:', error);
          alert('Vehicle data partially synchronized: Road worthiness updated, but insurance data could not be retrieved.');
        }
      } else {
        alert('Vehicle details successfully updated from e.csdd.lv. No Registration Certificate Number available to check insurance.');
      }
      
      return updatedVehicleData;
    } catch (error) {
      console.error('[Frontend] Error syncing vehicle with CSDD:', error);
      alert(`Error syncing vehicle details: ${error.message}`);
      return null;
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

  // Reset modal state when closing
  const handleCloseVehicleModal = () => {
    setShowAddVehicleModal(false);
    setVehicleToEdit(null);
  };

  // Make syncVehicleRemindersWithCsdd available to child components
  window.syncVehicleRemindersWithCsdd = syncVehicleRemindersWithCsdd;

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
              <div className="ml-4 relative">
                <button 
                  className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="text-sm font-medium text-blue-700">{currentUser?.firstName?.charAt(0) || currentUser?.username?.charAt(0) || 'A'}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                    <div className="py-2">
                      <p className="px-4 py-2 text-sm text-gray-700">
                        {currentUser?.firstName && currentUser?.lastName 
                          ? `${currentUser.firstName} ${currentUser.lastName}` 
                          : currentUser?.username || 'Admin'}
                        <br />
                        <span className="text-xs text-gray-500">{currentUser?.email || ''}</span>
                      </p>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Profile
                      </Link>
                      <button 
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={logout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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
                                  <button 
                                    className="p-1 hover:bg-gray-100 rounded"
                                    onClick={() => openEditVehicleModal(vehicle)}
                                  >
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
                                            <p className="text-gray-500">License: {vehicle.id}</p>
                                            <p className="text-gray-500">Registration Certificate Number: {vehicle.regaplnr}</p>
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

                                    {/* Due Dates & Reminders Section */}
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm text-gray-900">Due Dates & Reminders</h4>
                                        {csddIntegration.connectionStatus === 'connected' && (
                                          <button 
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center"
                                            onClick={() => syncVehicleRemindersWithCsdd(vehicle.id).then(result => {
                                              if (result) alert('Reminders successfully updated from e.csdd.lv');
                                            })}
                                          >
                                            <span className="mr-1">🔄</span>Sync with CSDD
                                          </button>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        {vehicle.reminders && vehicle.reminders.length > 0 ? (
                                          vehicle.reminders.filter(r => r.enabled).map((reminder, idx) => {
                                            // Calculate days remaining
                                            const dueDate = new Date(reminder.date);
                                            const today = new Date();
                                            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                            
                                            // Determine status class based on days remaining
                                            let statusClass = "bg-green-100 text-green-800"; // Default: > 30 days
                                            let statusText = "On Track";
                                            
                                            if (daysRemaining < 0) {
                                              statusClass = "bg-red-100 text-red-800";
                                              statusText = "Overdue";
                                            } else if (daysRemaining <= 30) {
                                              statusClass = "bg-amber-100 text-amber-800";
                                              statusText = "Due Soon";
                                            }
                                            
                                            // Format due date
                                            const formattedDate = dueDate.toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric', 
                                              year: 'numeric' 
                                            });
                                            
                                            return (
                                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                                                <div className="flex items-center">
                                                  <span className="text-gray-400 mr-2">
                                                    {reminder.name.includes('Insurance') ? '🔐' : 
                                                     reminder.name.includes('Service') ? '🔧' : 
                                                     reminder.name.includes('Worthiness') ? '📝' : '🔔'}
                                                  </span>
                                                  <div>
                                                    <p className="text-sm font-medium text-gray-900">{reminder.name}</p>
                                                    <p className="text-xs text-gray-500">Due: {formattedDate}</p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center">
                                                  <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
                                                    {daysRemaining < 0 
                                                      ? `${Math.abs(daysRemaining)} days overdue` 
                                                      : daysRemaining === 0 
                                                        ? "Due today"
                                                        : `${daysRemaining} days left`}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-center py-4">
                                            <p className="text-sm text-gray-500">No active reminders</p>
                                            <button 
                                              className="mt-2 px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                              onClick={() => openEditVehicleModal(vehicle)}
                                            >
                                              <span className="mr-1">➕</span>Add Reminder
                                            </button>
                                          </div>
                                        )}
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
        <AddVehicleModal 
          onClose={handleCloseVehicleModal} 
          onSave={handleSaveVehicle} 
          csddIntegration={csddIntegration}
          setCsddIntegration={setCsddIntegration}
          vehicleToEdit={vehicleToEdit}
        />
      )}

      {/* Edit Confirmation Modal */}
      {showEditConfirmationModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px]">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg text-gray-900">Confirm Changes</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditConfirmationModal(false)}
              >
                <span className="text-xl">✖️</span>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">Are you sure you want to save the changes?</p>
              <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
                {vehicleChanges?.changes?.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-2">
              <button 
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                onClick={() => setShowEditConfirmationModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500"
                onClick={handleConfirmEdit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
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
const AddVehicleModal = ({ onClose, onSave, csddIntegration, setCsddIntegration, vehicleToEdit }) => {
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
  // Use csddIntegration state from props instead of local state
  const [csddCredentials, setCsddCredentials] = useState({ 
    email: csddIntegration.credentials?.email || '', 
    password: csddIntegration.credentials?.password || '' 
  });
  const [csddError, setCsddError] = useState(null);
  // Add insuranceLoading state
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  // Add fetchingData state for overall data loading
  const [fetchingData, setFetchingData] = useState(false);
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

  // Check session on component mount
  useEffect(() => {
    // Store the initial data for comparison when editing
    if (vehicleToEdit) {
      setInitialData(JSON.parse(JSON.stringify(vehicleToEdit)));
      
      // Make sure all fields are explicitly set, using regaplnr consistently
      setVehicleData({
        ...vehicleData,
        ...vehicleToEdit
      });
    }

    // If we're already connected, no need to check the session
    if (csddIntegration.connectionStatus === 'connected') return;
    
    // Check if there's an active session on the backend
    checkCsddSession();
  }, []);
  
  const checkCsddSession = async () => {
    try {
      console.log('[Frontend] Checking for active CSDD session...');
      
      const response = await fetch(`${apiUrl}/api/integrations/csdd/session/default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('[Frontend] Failed to check session status:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      console.log('[Frontend] Session check response:', data);
      
      if (data.success && data.connected) {
        console.log('[Frontend] Active session found, user info:', data.userInfo);
        // Update the parent component's state
        setCsddIntegration({
          ...csddIntegration,
          connectionStatus: 'connected',
          userInfo: data.userInfo
        });
      } else {
        console.log('[Frontend] No active session found');
      }
    } catch (error) {
      console.error('[Frontend] Error checking CSDD session:', error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value
    });
  };

  const handleCsddCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCsddCredentials({
      ...csddCredentials,
      [name]: value
    });
  };
  
  const connectToCsdd = async () => {
    // Validate form
    if (!csddCredentials.email || !csddCredentials.password) {
      setCsddError('Please provide both email and password');
      return;
    }

    try {
      console.log('[Frontend] Attempting to connect to e.csdd.lv with email:', csddCredentials.email);
      
      // Update parent component state
      setCsddIntegration({
        ...csddIntegration,
        connectionStatus: 'connecting',
        credentials: csddCredentials
      });
      setCsddError(null);
      
      console.log('[Frontend] Sending connection request to backend...');
      const response = await fetch(`${apiUrl}/api/integrations/csdd/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: csddCredentials.email,
          password: csddCredentials.password,
          userId: 'default' // Using a default user ID for this example
        }),
      });

      console.log('[Frontend] Connection response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Frontend] Connection response data:', data);
      
      if (data.success) {
        console.log('[Frontend] Successfully connected to e.csdd.lv as:', data.userInfo);
        // Update parent component state
        setCsddIntegration({
          ...csddIntegration,
          connectionStatus: 'connected',
          credentials: csddCredentials,
          userInfo: data.userInfo
        });
      } else {
        throw new Error(data.message || 'Connection failed');
      }
    } catch (error) {
      console.error('[Frontend] Error connecting to CSDD:', error);
      // Update parent component state
      setCsddIntegration({
        ...csddIntegration,
        connectionStatus: 'disconnected'
      });
      setCsddError(error.message || 'Failed to connect to e.csdd.lv. Please check your credentials.');
    }
  };

  const disconnectFromCsdd = async () => {
    try {
      console.log('[Frontend] Disconnecting from e.csdd.lv...');
      
      // Call the backend to disconnect the session
      const response = await fetch(`${apiUrl}/api/integrations/csdd/disconnect/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('[Frontend] Disconnect response:', data);
      
      // Update parent component state
      setCsddIntegration({
        connectionStatus: 'disconnected',
        credentials: { email: '', password: '' },
        userInfo: null
      });
      
      // Update local state
      setCsddCredentials({ email: '', password: '' });
      
      console.log('[Frontend] Successfully disconnected from e.csdd.lv');
    } catch (error) {
      console.error('[Frontend] Error disconnecting from CSDD:', error);
    }
  };

  const handleAutoFill = async () => {
    // Check if we have enough data to fetch anything
    if (!vehicleData.id) {
      alert('Please enter a Registration Number to auto-fill vehicle details');
      return;
    }

    try {
      // First, check if we can fetch from CSDD (requires connection and registration number)
      if (csddIntegration.connectionStatus === 'connected') {
        console.log('[Frontend] Attempting to fetch data from CSDD for:', vehicleData.id);
        
        // Show loading state
        setFetchingData(true);
        
        // Fetch vehicle details from CSDD
        const response = await fetch(`${apiUrl}/api/integrations/csdd/vehicle/${vehicleData.id}?userId=default`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch vehicle details: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('[Frontend] Successfully retrieved vehicle details:', data);
          
          // Format road worthiness date if available
          let formattedRoadWorthinessDate = null;
          if (data.roadWorthinessDate) {
            const parts = data.roadWorthinessDate.split('.');
            if (parts.length === 3) {
              formattedRoadWorthinessDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          
          // Update vehicle reminders with road worthiness date if available
          let updatedReminders = [...(vehicleData.reminders || [])];
          
          if (formattedRoadWorthinessDate) {
            const roadWorthinessIndex = updatedReminders.findIndex(
              reminder => reminder.name === 'Road Worthiness Certificate'
            );
            
            if (roadWorthinessIndex >= 0) {
              updatedReminders[roadWorthinessIndex] = {
                ...updatedReminders[roadWorthinessIndex],
                date: formattedRoadWorthinessDate,
                enabled: true
              };
            } else {
              updatedReminders.push({
                name: 'Road Worthiness Certificate',
                date: formattedRoadWorthinessDate,
                enabled: true
              });
            }
          }
          
          // Create a new vehicle data object with the updated information
          const updatedVehicleData = {
            ...vehicleData,
            make: data.make || vehicleData.make,
            model: data.model || vehicleData.model,
            year: data.year || vehicleData.year,
            regaplnr: data.regaplnr || vehicleData.regaplnr,
            mileage: data.mileage !== undefined ? data.mileage : vehicleData.mileage,
            reminders: updatedReminders
          };
          
          console.log('[Frontend] Updated vehicle data with CSDD info:', updatedVehicleData);
          
          // Update the state with the new vehicle data
          setVehicleData(updatedVehicleData);
          
          // If we got the regaplnr from CSDD or it was already present, try to fetch insurance info
          const regaplnr = data.regaplnr || vehicleData.regaplnr;
          
          if (regaplnr) {
            console.log('[Frontend] Registration Certificate Number available, fetching insurance info');
            // Pass the updated data to fetchInsuranceInfo instead of relying on state
            await fetchInsuranceInfo(vehicleData.id, regaplnr, updatedVehicleData);
          } else {
            setFetchingData(false);
            alert('Vehicle details successfully imported from e.csdd.lv, but no Registration Certificate Number was found to check insurance.');
          }
        } else {
          setFetchingData(false);
          throw new Error(data.message || 'Failed to retrieve vehicle information');
        }
      } 
      // If we're not connected to CSDD but have both registration numbers, try insurance lookup only
      else if (vehicleData.regaplnr) {
        console.log('[Frontend] Not connected to CSDD but have Registration Certificate Number, trying insurance info only');
        await fetchInsuranceInfo(vehicleData.id, vehicleData.regaplnr);
      }
      // Neither CSDD connection nor registration certificate number
      else {
        alert('Please connect to e.csdd.lv to auto-fill vehicle details or enter a Registration Certificate Number to check insurance');
      }
    } catch (error) {
      setFetchingData(false);
      console.error('[Frontend] Error in auto-fill process:', error);
      alert(`Error fetching data: ${error.message}`);
    }
  };
  
  // Fetch insurance information using the Registration Number and Registration Certificate Number
  // Added optional parameter to pass already updated vehicle data
  const fetchInsuranceInfo = async (registrationNumber, regaplnr, updatedVehicleDataFromCsdd = null) => {
    if (!registrationNumber || !regaplnr) {
      alert('Both Registration Number and Registration Certificate Number are required to fetch insurance information');
      return;
    }
    
    try {
      console.log('[Frontend] Fetching insurance info for:', registrationNumber, 'with cert number:', regaplnr);
      
      // Use the passed in data from CSDD if available, otherwise use current state
      const currentVehicleData = updatedVehicleDataFromCsdd || { ...vehicleData };
      console.log('[Frontend] Current vehicle data before insurance fetch:', currentVehicleData);
      
      // Set loading state
      setInsuranceLoading(true);
      
      const response = await fetch(`${apiUrl}/api/integrations/insurance/${registrationNumber}/${regaplnr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insurance info: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Frontend] Insurance info response:', data);
      
      // Reset loading states
      setInsuranceLoading(false);
      setFetchingData(false);
      
      if (data.success && data.lastPolicyDate) {
        console.log('[Frontend] Found insurance policy date:', data.lastPolicyDate);
        
        // Make a copy of the existing reminders or initialize an empty array if none exist
        const updatedReminders = [...(currentVehicleData.reminders || [])];
        
        const insuranceIndex = updatedReminders.findIndex(
          reminder => reminder.name === 'Insurance Renewal'
        );
        
        if (insuranceIndex >= 0) {
          // Update existing reminder
          updatedReminders[insuranceIndex] = {
            ...updatedReminders[insuranceIndex],
            date: data.lastPolicyDate,
            enabled: true
          };
        } else {
          // Add new reminder
          updatedReminders.push({
            name: 'Insurance Renewal',
            date: data.lastPolicyDate,
            enabled: true
          });
        }
        
        // Create the updated data object while preserving ALL existing fields 
        const updatedVehicleData = {
          ...currentVehicleData,
          reminders: updatedReminders
        };
        
        console.log('[Frontend] Updated vehicle data after adding insurance:', updatedVehicleData);
        
        // Set state with the updated data first
        setVehicleData(updatedVehicleData);
        
        // Wait for React to complete the state update
        setTimeout(() => {
          // Double check that our data is still intact before showing the alert
          console.log('[Frontend] Vehicle data before showing alert:', vehicleData);
          // Only now show the alert
          alert('Vehicle details and insurance information successfully imported.');
        }, 100); // Reduced timeout for better UX
      } else {
        console.log('[Frontend] No insurance data found');
        alert('Vehicle details imported, but no insurance information was found.');
      }
    } catch (error) {
      // Reset loading states
      setInsuranceLoading(false);
      setFetchingData(false);
      
      console.error('[Frontend] Error fetching insurance info:', error);
      alert(`Vehicle details imported, but couldn't fetch insurance info: ${error.message}`);
    }
  };
  
  // Handle reminder changes
  const handleReminderChange = (index, field, value) => {
    const updatedReminders = [...vehicleData.reminders];
    updatedReminders[index] = {
      ...updatedReminders[index],
      [field]: value
    };
    setVehicleData({
      ...vehicleData,
      reminders: updatedReminders
    });
  };
  
  // Add a new custom reminder
  const addReminder = () => {
    const newReminder = {
      name: 'Custom Reminder',
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      enabled: true
    };
    
    setVehicleData({
      ...vehicleData,
      reminders: vehicleData.reminders ? [...vehicleData.reminders, newReminder] : [newReminder]
    });
  };
  
  // Remove a reminder
  const removeReminder = (index) => {
    if (!vehicleData.reminders) return;
    
    const updatedReminders = [...vehicleData.reminders];
    updatedReminders.splice(index, 1);
    setVehicleData({
      ...vehicleData,
      reminders: updatedReminders
    });
  };
  
  // Generate a list of changes when in edit mode
  const getChanges = () => {
    if (!vehicleToEdit) return null;
    
    const changes = [];
    const changedFields = {};
    
    // Track simple field changes
    for (const key in vehicleData) {
      // Skip the reminders array as we'll handle it separately
      if (key === 'reminders') continue;
      
      // Check if the value has changed
      if (JSON.stringify(vehicleData[key]) !== JSON.stringify(initialData[key])) {
        changes.push(`${key}: Changed from "${initialData[key]}" to "${vehicleData[key]}"`);
        changedFields[key] = {
          from: initialData[key],
          to: vehicleData[key]
        };
      }
    }
    
    // Track reminder changes
    const currentReminders = vehicleData.reminders || [];
    const originalReminders = initialData.reminders || [];
    
    // Find added reminders
    for (const reminder of currentReminders) {
      if (!originalReminders.some(r => 
        r.name === reminder.name && r.date === reminder.date && r.enabled === reminder.enabled
      )) {
        changes.push(`Added reminder: ${reminder.name} (${reminder.date})`);
      }
    }
    
    // Find removed reminders
    for (const reminder of originalReminders) {
      if (!currentReminders.some(r => 
        r.name === reminder.name && r.date === reminder.date && r.enabled === reminder.enabled
      )) {
        changes.push(`Removed reminder: ${reminder.name} (${reminder.date})`);
      }
    }
    
    return {
      changes,
      changedFields,
      updatedData: vehicleData
    };
  };
  
  const handleSave = () => {
    // Validate form
    if (!vehicleData.id || !vehicleData.make || !vehicleData.model) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (vehicleToEdit) {
      // In edit mode, track changes and show confirmation
      const changes = getChanges();
      if (changes && changes.changes.length > 0) {
        onSave(vehicleData, changes);
      } else {
        // No changes detected
        alert('No changes detected');
      }
    } else {
      // In add mode, just save the new vehicle
      onSave(vehicleData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[800px] flex flex-col max-h-[90vh] my-4">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center bg-white z-10 rounded-t-lg sticky top-0">
          <h2 className="text-lg text-gray-900">{vehicleToEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-6">
            <div className="w-full">
              <label className="block text-sm text-gray-700 mb-1">Registration Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="id"
                  value={vehicleData.id}
                  onChange={handleChange}
                  placeholder="XYZ-123" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                  disabled={vehicleToEdit} // Don't allow changing registration number when editing (used as ID)
                />
                {!vehicleToEdit && !fetchingData && (
                  <button 
                    className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-900"
                    onClick={handleAutoFill}
                    disabled={!vehicleData.id}
                  >
                    <span className="mr-1">🔍</span>Auto-fill Data
                  </button>
                )}
                {fetchingData && (
                  <div className="absolute right-2 top-2 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-xs text-blue-600">Fetching data...</span>
                  </div>
                )}
              </div>
              {!vehicleToEdit && (
                <p className="mt-1 text-xs text-gray-500">
                  {csddIntegration.connectionStatus === 'connected' 
                    ? "Connected to e.csdd.lv. Will auto-fill from CSDD and check insurance info."
                    : "Enter Registration Number and Certificate Number to check insurance info."}
                </p>
              )}
            </div>
            <div className="w-full">
              <label className="block text-sm text-gray-700 mb-1">Registration Certificate Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="regaplnr"
                  value={vehicleData.regaplnr}
                  onChange={handleChange}
                  placeholder="AF 0000000" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                />
                {vehicleData.id && vehicleData.regaplnr && !insuranceLoading && (
                  <button 
                    className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => fetchInsuranceInfo(vehicleData.id, vehicleData.regaplnr)}
                  >
                    <span className="mr-1">🔍</span>Check Insurance
                  </button>
                )}
                {insuranceLoading && (
                  <div className="absolute right-2 top-2 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-xs text-blue-600">Fetching insurance data...</span>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">This field and Registration Number will be used to obtain insurance certificate data.</p>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <button 
                className={`px-3 py-2 text-sm rounded-md ${activeTab === 'details' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('details')}
              >
                Vehicle Details
              </button>
              <button 
                className={`px-3 py-2 text-sm rounded-md ${activeTab === 'tracking' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('tracking')}
              >
                Tracking
              </button>
              <button 
                className={`px-3 py-2 text-sm rounded-md ${activeTab === 'integrations' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('integrations')}
              >
                Integrations
              </button>
              <button 
                className={`px-3 py-2 text-sm rounded-md ${activeTab === 'documents' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
              <button 
                className={`px-3 py-2 text-sm rounded-md ${activeTab === 'notifications' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
            </div>

            {activeTab === 'details' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Make</label>
                    <input 
                      type="text" 
                      name="make"
                      value={vehicleData.make}
                      onChange={handleChange}
                      placeholder="Manufacturer" 
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
                      placeholder="Model" 
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
                      <option>Vieglais auto</option>
                      <option>Kravas auto</option>
                      <option>Piekabe</option>
                      <option>Autobuss</option>
                      <option>Mopēds</option>
                      <option>Motocikls</option>
                      <option>Tricikls</option>
                      <option>Laiva</option>
                      <option>Kuģis</option>
                      <option>Cits</option>
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
                    <label className="block text-sm text-gray-700 mb-1">Current Mileage (KM)</label>
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

                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h4 className="text-sm text-gray-900">Reminder Settings</h4>
                    <div className="flex gap-2">
                      {csddIntegration.connectionStatus === 'connected' && vehicleToEdit && (
                        <button 
                          className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center"
                          onClick={async () => {
                            // Use the vehicleToEdit ID since we're in edit mode
                            const updatedVehicle = await window.syncVehicleRemindersWithCsdd(vehicleToEdit.id);
                            if (updatedVehicle) {
                              // Update local state with the synced data
                              setVehicleData({
                                ...vehicleData,
                                reminders: updatedVehicle.reminders,
                                make: updatedVehicle.make,
                                model: updatedVehicle.model,
                                year: updatedVehicle.year,
                                regaplnr: updatedVehicle.regaplnr,
                                mileage: updatedVehicle.mileage
                              });
                              alert('Reminders successfully updated from e.csdd.lv');
                            }
                          }}
                        >
                          <span className="mr-1">🔄</span>Sync with CSDD
                        </button>
                      )}
                      <button 
                        className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 flex items-center self-start sm:self-auto"
                        onClick={addReminder}
                      >
                        <span className="text-sm mr-1">➕</span>Add Reminder
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {vehicleData.reminders && vehicleData.reminders.map((reminder, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-50 rounded gap-2">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300" 
                            checked={reminder.enabled}
                            onChange={(e) => handleReminderChange(index, 'enabled', e.target.checked)} 
                          />
                          <input
                            type="text"
                            className="ml-2 text-sm text-gray-900 bg-transparent border-none focus:ring-0 w-full sm:w-40"
                            value={reminder.name}
                            onChange={(e) => handleReminderChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="date" 
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full sm:w-auto" 
                            value={reminder.date ? reminder.date.substring(0, 10) : ''}
                            onChange={(e) => handleReminderChange(index, 'date', e.target.value)}
                          />
                          <button 
                            className="text-gray-500 hover:text-red-500"
                            onClick={() => removeReminder(index)}
                          >
                            <span className="text-sm">❌</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Other tabs remain the same */}
            {activeTab === 'tracking' && (
              <div className="py-4">
                <p className="text-gray-700">Configure vehicle tracking options here.</p>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="py-4">
                <h3 className="text-lg text-gray-900 mb-3">Third-Party Integrations</h3>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3 flex-shrink-0">
                                             <span className="text-blue-600 text-xl">🔑</span>
                      </span>
                      <div>
                        <h4 className="text-md font-medium text-gray-900">e.csdd.lv Connection</h4>
                        <p className="text-sm text-gray-500">Connect to the Latvian Road Traffic Safety Directorate portal</p>
                      </div>
                    </div>
                    <div>
                    {csddIntegration.connectionStatus === 'connected' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      ) : csddIntegration.connectionStatus === 'connecting' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Connecting...
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disconnected
                        </span>
                      )}
                    </div>
                  </div>

                  {csddIntegration.connectionStatus === 'connected' ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-900">Connected as: <span className="font-medium">{csddIntegration.userInfo?.firstName} {csddIntegration.userInfo?.lastName}</span></p>
                            <p className="text-xs text-gray-500 mt-1">You can now auto-fill vehicle details using the registration number</p>
                          </div>
                          <button 
                            className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 self-start sm:self-auto"
                            onClick={disconnectFromCsdd}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Available Actions</h5>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm text-gray-700">
                            <span className="mr-2 text-green-500">✓</span>
                            Auto-fill vehicle details using registration number
                          </li>
                          <li className="flex items-center text-sm text-gray-700">
                            <span className="mr-2 text-green-500">✓</span>
                            Import vehicle due dates and reminders
                          </li>
                          <li className="flex items-center text-sm text-gray-700">
                            <span className="mr-2 text-green-500">✓</span>
                            Update vehicle reminders from csdd.lv
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {csddError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                          {csddError}
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">E-mail</label>
                          <input 
                            type="email" 
                            name="email"
                            value={csddCredentials.email}
                            onChange={handleCsddCredentialsChange}
                            placeholder="your.email@example.com" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Password</label>
                          <input 
                            type="password" 
                            name="password"
                            value={csddCredentials.password}
                            onChange={handleCsddCredentialsChange}
                            placeholder="••••••••" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                          />
                        </div>
                      </div>
                      
                      
                      <button 
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500"
                        onClick={connectToCsdd}
                      >
                        Connect to e.csdd.lv
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 flex justify-end space-x-2 mt-auto rounded-b-lg">
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
            {vehicleToEdit ? 'Save Changes' : 'Save Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
