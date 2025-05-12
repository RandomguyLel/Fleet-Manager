import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useCsdd } from './CsddContext';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';
import Sidebar from './components/Sidebar';
import { useTranslation } from 'react-i18next';
import PDFPreviewModal from './components/PDFPreviewModal';
import VehicleTable from './components/vehicle/VehicleTable';
import VehicleSearchBar from './components/vehicle/VehicleSearchBar';
import VehicleDeleteModal from './components/vehicle/VehicleDeleteModal';
import EditConfirmationModal from './components/vehicle/EditConfirmationModal';
import AddVehicleModal from './components/vehicle/AddVehicleModal';
import { typeValueToKey, getStatusBadgeClass, getDocumentStatusClass, calculateDaysRemaining } from './components/vehicle/vehicleUtils';
import TopBar from './components/TopBar';
import ImportVehiclesModal from './components/vehicle/ImportVehiclesModal';

const Vehicles = () => {
  const { t } = useTranslation();
  // Add useNavigate for redirection
  const navigate = useNavigate();
  // Add useLocation for query param
  const location = useLocation();
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
  // Add state for tracking if all vehicles are selected
  const [allSelected, setAllSelected] = useState(false);
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // State for vehicle to delete
  const [vehicleToDelete, setVehicleToDelete] = useState(null);  // Get CSDD integration from global context
  const { csddIntegration } = useCsdd();
  // State for vehicle being edited
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  // State for edit confirmation modal
  const [showEditConfirmationModal, setShowEditConfirmationModal] = useState(false);
  // State for tracked changes
  const [vehicleChanges, setVehicleChanges] = useState(null);
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // State for filtered vehicles
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  // Get auth context
  const { currentUser, logout, getAuthHeader } = useAuth();
    // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  // State for insurance loading
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  // Add fetchingData state for overall data loading
  const [fetchingData, setFetchingData] = useState(false);
  // Add redirecting state to prevent multiple redirects
  const [redirecting, setRedirecting] = useState(false);
  // Add state for PDF preview modal
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  // Sidebar collapsed state (lifted up)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      return savedState === 'true';
    }
    return window.innerWidth < 768;
  });
  const [showImportModal, setShowImportModal] = useState(false);

  const rowRefs = useRef({});


  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Expand row if 'expand' query param is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const expandId = params.get('expand');
    if (expandId) {
      setExpandedRow(expandId);
    }
  }, [location.search]);

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

        // Handle authentication and authorization errors
        if (response.status === 401 || response.status === 403) {
          if (!redirecting) {
            setRedirecting(true);
            console.log('Session expired or invalid. Redirecting to login page...');
            // Clear the invalid session
            await logout(true);
            // Redirect to login page with a return URL
            navigate('/login', { 
              state: { 
                from: window.location.pathname,
                message: 'Your session has expired. Please log in again.' 
              } 
            });
            return;
          }
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setVehicles(data);
        setFilteredVehicles(data); // Initialize filtered vehicles with all vehicles
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError(`Error fetching vehicles: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [getAuthHeader, apiUrl, logout, navigate]);

  // Add useEffect to handle search filtering
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      // If search query is empty, use all vehicles
      setFilteredVehicles(vehicles);
    } else {
      // Filter vehicles based on search query
      const query = searchQuery.toLowerCase();
      const filtered = vehicles.filter(vehicle => 
        (vehicle.id && vehicle.id.toLowerCase().includes(query)) ||
        (vehicle.make && vehicle.make.toLowerCase().includes(query)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
        (vehicle.type && vehicle.type.toLowerCase().includes(query)) ||
        (vehicle.year && vehicle.year.toString().includes(query)) ||
        (vehicle.vin && vehicle.vin.toLowerCase().includes(query)) ||
        (vehicle.status && vehicle.status.toLowerCase().includes(query))
      );
      setFilteredVehicles(filtered);
    }
  }, [vehicles, searchQuery]);

  // Toggle expanded row
  const toggleExpandRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };
  // Status badge functions are now imported from vehicleUtils.js

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
    if (vehicleChanges) {
      updateVehicle(vehicleChanges.updatedData, vehicleChanges.changes);
    } else {
      setShowEditConfirmationModal(false);
    }
  };

  // Handle vehicle selection for delete
  const handleVehicleSelection = (vehicleId, isSelected) => {
    if (isSelected) {
      const newSelected = [...selectedVehicles, vehicleId];
      setSelectedVehicles(newSelected);
      // Update allSelected state based on if all filtered vehicles are now selected
      setAllSelected(newSelected.length === filteredVehicles.length);
    } else {
      const newSelected = selectedVehicles.filter(id => id !== vehicleId);
      setSelectedVehicles(newSelected);
      setAllSelected(false);
    }
  };

  // Handle select all vehicles
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedVehicles(filteredVehicles.map(vehicle => vehicle.id));
      setAllSelected(true);
    } else {
      setSelectedVehicles([]);
      setAllSelected(false);
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
      const sessionResponse = await fetch(`${apiUrl}/api/integrations/csdd/session/${currentUser.id}`, {
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
      const response = await fetch(`${apiUrl}/api/integrations/csdd/vehicle/${vehicleId}?userId=${currentUser.id}`, {
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
      
      // Road Worthiness Certificate reminder name
      const roadWorthinessCertificateName = 'Road Worthiness Certificate';
      
      // If we have a road worthiness date, update or add this reminder
      if (formattedRoadWorthinessDate) {
        const roadWorthinessIndex = updatedReminders.findIndex(
          reminder => reminder.name === roadWorthinessCertificateName
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
            name: roadWorthinessCertificateName,
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
                  // Insurance Renewal reminder name
                const insuranceRenewalName = 'Insurance Renewal';
                
                const insuranceIndex = insuranceUpdatedReminders.findIndex(
                  reminder => reminder.name === insuranceRenewalName
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
                    name: insuranceRenewalName,
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

    // After all deletions
    setVehicles(prevVehicles => prevVehicles.filter(
      v => !selectedVehicles.includes(v.id)
    ));
    setSelectedVehicles([]);
  };

  // Reset modal state when closing
  const handleCloseVehicleModal = () => {
    setShowAddVehicleModal(false);
    setVehicleToEdit(null);
  };

  // Make syncVehicleRemindersWithCsdd available to child components
  window.syncVehicleRemindersWithCsdd = syncVehicleRemindersWithCsdd;

  // Handle vehicle import
  const handleImportVehicle = async (vehicleData) => {
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
          console.warn(`Vehicle ${vehicleData.id} already exists, skipping...`);
          return false;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newVehicle = await response.json();
      setVehicles(prev => [...prev, newVehicle]);
      return true;
    } catch (error) {
      console.error('Error importing vehicle:', error);
      return false;
    }
  };


  // Scroll to expanded row when it changes
  useEffect(() => {
    if (expandedRow && rowRefs.current[expandedRow]) {
      // Delay to ensure the row is rendered
      setTimeout(() => {
        rowRefs.current[expandedRow]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  }, [expandedRow, filteredVehicles]);

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{t('common.error')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only in flex flow on md+ */}
        <div className="hidden md:block">
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </div>

        {/* Main content - full width on mobile */}
        <main className={`flex-1 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <div className="py-6 mt-16">
            <div className="px-4 sm:px-6 lg:px-8">                <div className="flex justify-between items-center">
                <h1 className="text-2xl text-gray-900 dark:text-white">{t('common.vehicles')}</h1>
                <div className="flex space-x-3">                  <button 
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white flex items-center"
                    onClick={() => setShowImportModal(true)}
                  >
                    <span className="mr-2">⬆️</span>{t('common.import')}
                  </button>
                  <button 
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md shadow-sm hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center"
                    onClick={() => setShowAddVehicleModal(true)}
                  >
                    <span className="mr-2">➕</span>{t('vehicles.addVehicle')}
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-white shadow rounded-lg dark:bg-gray-800">
                <div className="px-4 py-5 sm:p-6">
                  <VehicleSearchBar 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery}
                    openBulkDeleteConfirmation={openBulkDeleteConfirmation}
                    onExport={() => {
                      if (selectedVehicles.length === 0) {
                        alert('Please select at least one vehicle to export');
                        return;
                      }
                      setShowPDFPreview(true);
                    }}
                  />

                  <VehicleTable
                    filteredVehicles={filteredVehicles}
                    expandedRow={expandedRow}
                    rowRefs={rowRefs}
                    toggleExpandRow={toggleExpandRow}
                    selectedVehicles={selectedVehicles}
                    handleVehicleSelection={handleVehicleSelection}
                    allSelected={allSelected}
                    handleSelectAll={handleSelectAll}
                    openEditVehicleModal={openEditVehicleModal}
                    openDeleteConfirmation={openDeleteConfirmation}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getDocumentStatusClass={getDocumentStatusClass}
                    typeValueToKey={typeValueToKey}
                    csddIntegration={csddIntegration}
                    syncVehicleRemindersWithCsdd={syncVehicleRemindersWithCsdd}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (        <AddVehicleModal 
          onClose={handleCloseVehicleModal} 
          onSave={handleSaveVehicle} 
          vehicleToEdit={vehicleToEdit}
        />
      )}

      {/* Edit Confirmation Modal */}
      <EditConfirmationModal
        showEditConfirmationModal={showEditConfirmationModal}
        setShowEditConfirmationModal={setShowEditConfirmationModal}
        vehicleChanges={vehicleChanges}
        handleConfirmEdit={handleConfirmEdit}
      />

      {/* Delete Confirmation Modal */}
      <VehicleDeleteModal 
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        vehicleToDelete={vehicleToDelete}
        selectedVehicles={selectedVehicles}
        handleDeleteConfirm={handleDeleteConfirm}
      />
      {showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          selectedVehicles={selectedVehicles}
          vehicles={vehicles}
        />
      )}

      {/* Import Vehicles Modal */}
      <ImportVehiclesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportVehicle}
      />
    </div>
  );
};

export default Vehicles;
