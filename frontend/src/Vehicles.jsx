import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './Analytics';

const Vehicles = () => {
  // State for expanded row
  const [expandedRow, setExpandedRow] = useState(null);
  // State for showing/hiding add vehicle modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  // Sample vehicle data
  const vehicles = [
    {
      id: 'XYZ-123',
      status: 'Active',
      type: 'Truck',
      lastService: 'Jan 15, 2025',
      documents: 'Valid',
      make: 'Toyota',
      model: 'Hino 300',
      year: 2023,
      license: 'XYZ-123',
      vin: '1HGCM82633A123456',
      mileage: '45,000 km'
    },
    {
      id: 'ABC-789',
      status: 'Active',
      type: 'Van',
      lastService: 'Mar 1, 2025',
      documents: 'Expiring Soon',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2022,
      license: 'ABC-789',
      vin: '2FMZA5145XBA12345',
      mileage: '32,500 km'
    },
    {
      id: 'DEF-456',
      status: 'Inactive',
      type: 'Truck',
      lastService: 'Feb 20, 2025',
      documents: 'Expired',
      make: 'Ford',
      model: 'Transit',
      year: 2021,
      license: 'DEF-456',
      vin: '3VWPD71K27M082526',
      mileage: '58,200 km'
    }
  ];

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
                      <input type="checkbox" className="rounded border-gray-300" />
                      <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
                        <span className="mr-1">⬇️</span>Export
                      </button>
                      <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
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
                                <input type="checkbox" className="rounded border-gray-300" />
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
                                  <button className="p-1 hover:bg-gray-100 rounded">
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
        <AddVehicleModal onClose={() => setShowAddVehicleModal(false)} />
      )}
    </div>
  );
};

// Add Vehicle Modal Component
const AddVehicleModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  
  const handleSave = () => {
    // Here you would handle saving the vehicle data
    console.log('Saving vehicle data...');
    onClose();
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
                <input type="text" placeholder="XYZ-123" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                <button className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="mr-1">🔍</span>Auto-fill
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">VIN</label>
              <div className="relative">
                <input type="text" placeholder="1HGCM82633A123456" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
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
                    <input type="text" placeholder="Toyota" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Model</label>
                    <input type="text" placeholder="Hino 300" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Year</label>
                    <input type="text" placeholder="2023" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Type</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md">
                      <option>Truck</option>
                      <option>Van</option>
                      <option>Car</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Status</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md">
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Current Mileage</label>
                    <input type="text" placeholder="45,000" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
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