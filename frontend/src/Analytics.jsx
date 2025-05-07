import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './components/NotificationBell';
import ProfileDropdown from './components/ProfileDropdown';
import Sidebar from './components/Sidebar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [serviceRecords, setServiceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeader, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const { t } = useTranslation();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/analytics' } });
    }
  }, [isAuthenticated, navigate]);

  // Fetch all vehicles
  const fetchVehicles = useCallback(async () => {
    if (!isAuthenticated) {
      return [];
    }

    try {
      const response = await fetch(`${apiUrl}/api/vehicles`, {
        headers: getAuthHeader()
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }
      
      const data = await response.json();
      
      setVehicles(data);
      
      // Initialize selected vehicles with first two vehicles or all if less than two
      if (data.length > 0 && selectedVehicles.length === 0) {
        setSelectedVehicles(data.slice(0, Math.min(2, data.length)).map(v => v.id));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError(error.message);
      return [];
    }
  }, [getAuthHeader, isAuthenticated, selectedVehicles.length]);
  
  // Fetch service history for analysis
  const fetchServiceHistory = useCallback(async () => {
    setLoading(true);
    
    if (!isAuthenticated) {
      setServiceRecords([]);
      setLoading(false);
      return [];
    }

    try {
      const url = `${apiUrl}/api/service-history`;
      console.log('Fetching service history from:', url);
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader(),
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service history: ${response.status}`);
      }
      
      // Get the response as text first to debug any issues
      const rawText = await response.text();
      console.log('Raw API response:', rawText);
      
      // Try to parse the text as JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
      
      if (!Array.isArray(data)) {
        console.error('Invalid data format, expected array:', data);
        throw new Error('Invalid data format returned from API');
      }
      
      console.log(`Fetched ${data.length} service history records`);
      setServiceRecords(data);
      setError(null);
      return data;
    } catch (error) {
      console.error('Error fetching service history:', error);
      setError(error.message);
      setServiceRecords([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, isAuthenticated]);

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // Handle vehicle selection
  const toggleVehicleSelection = (vehicleId) => {
    setSelectedVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchVehicles();
      await fetchServiceHistory();
      setLoading(false);
    };
    
    loadData();
  }, [fetchVehicles, fetchServiceHistory]);

  // Filter records based on time range
  const getFilteredRecords = () => {
    if (!serviceRecords || !serviceRecords.length) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Filter records by date and selected vehicles
    return serviceRecords.filter(record => {
      try {
        if (!record || !record.service_date) return false;
        
        const recordDate = new Date(record.service_date);
        const isInTimeRange = recordDate >= startDate && recordDate <= now;
        const isSelectedVehicle = !selectedVehicles.length || selectedVehicles.includes(record.vehicle_id);
        return isInTimeRange && isSelectedVehicle;
      } catch (e) {
        return false;
      }
    });
  };

  const filteredRecords = getFilteredRecords();

  // Calculate data for charts
  const calculateChartData = () => {
    // Group by month for time-based charts
    const recordsByMonth = {};
    const costByServiceType = {};
    const costByVehicle = {};
    let totalMileage = {};
    
    filteredRecords.forEach(record => {
      try {
        if (!record) return;
        
        const date = new Date(record.service_date || new Date());
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const cost = Number(record.cost) || 0;
        const vehicleId = record.vehicle_id;
        
        if (!vehicleId) return;
        
        // Monthly costs
        if (!recordsByMonth[monthYear]) {
          recordsByMonth[monthYear] = 0;
        }
        recordsByMonth[monthYear] += cost;
        
        // Cost by service type
        if (record.service_type) {
          if (!costByServiceType[record.service_type]) {
            costByServiceType[record.service_type] = 0;
          }
          costByServiceType[record.service_type] += cost;
        }
        
        // Cost by vehicle
        if (!costByVehicle[vehicleId]) {
          costByVehicle[vehicleId] = 0;
        }
        costByVehicle[vehicleId] += cost;
        
        // Mileage tracking
        if (record.mileage && !totalMileage[vehicleId]) {
          totalMileage[vehicleId] = { 
            id: vehicleId,
            make: record.make || 'Unknown',
            model: record.model || 'Model',
            data: [] 
          };
        }
        
        if (record.mileage && totalMileage[vehicleId]) {
          totalMileage[vehicleId].data.push({
            date: record.service_date,
            mileage: record.mileage
          });
        }
      } catch (e) {
        console.error('Error processing record:', e, record);
      }
    });
    
    // Sort mileage data by date and remove duplicates (keep latest)
    Object.keys(totalMileage).forEach(vehicleId => {
      if (totalMileage[vehicleId].data.length) {
        totalMileage[vehicleId].data.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    });
    
    return {
      recordsByMonth,
      costByServiceType,
      costByVehicle,
      totalMileage: Object.values(totalMileage)
    };
  };

  const chartData = calculateChartData();

  // Setup chart data
  const costTrendData = {
    labels: Object.keys(chartData.recordsByMonth),
    datasets: [
      {
        label: 'Total Cost',
        data: Object.values(chartData.recordsByMonth),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };
  
  const costByServiceTypeData = {
    labels: Object.keys(chartData.costByServiceType),
    datasets: [
      {
        label: 'Cost by Service Type',
        data: Object.values(chartData.costByServiceType),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  const costByVehicleData = {
    labels: Object.keys(chartData.costByVehicle).map(id => {
      const vehicle = vehicles.find(v => v.id === id);
      return vehicle ? `${id} (${vehicle.make} ${vehicle.model})` : id;
    }),
    datasets: [
      {
        label: 'Cost by Vehicle',
        data: Object.values(chartData.costByVehicle),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderWidth: 1
      }
    ]
  };
  
  // Calculate mileage trend data for line chart
  const mileageTrendData = {
    datasets: chartData.totalMileage.map((vehicle, index) => {
      const colors = [
        'rgb(75, 192, 192)',
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)'
      ];
      
      return {
        label: `${vehicle.id} (${vehicle.make} ${vehicle.model})`,
        data: vehicle.data.map(d => {
          try {
            return { 
              x: new Date(d.date).toISOString(), 
              y: d.mileage 
            };
          } catch (e) {
            return null;
          }
        }).filter(d => d !== null),
        borderColor: colors[index % colors.length],
        tension: 0.1
      };
    })
  };
  
  // Calculate monthly costs for the table
  const calculateMonthlyCosts = () => {
    const currentDate = new Date();
    const thisMonth = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Last month
    const lastMonthDate = new Date(currentDate);
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    const lastMonth = lastMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // YTD totals
    const ytdStartDate = new Date(currentDate.getFullYear(), 0, 1); // Jan 1 of current year
    
    const categoryCosts = {
      'Fuel': { thisMonth: 0, lastMonth: 0, ytd: 0 },
      'Maintenance': { thisMonth: 0, lastMonth: 0, ytd: 0 },
      'Documents': { thisMonth: 0, lastMonth: 0, ytd: 0 }
    };
    
    filteredRecords.forEach(record => {
      if (!record || !record.service_date || !record.cost) return;
      
      try {
        const recordDate = new Date(record.service_date);
        const recordMonthYear = recordDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const cost = Number(record.cost) || 0;
        
        // Categorize service types
        let category = 'Maintenance';
        if (record.service_type && (
            record.service_type.toLowerCase().includes('fuel') || 
            record.service_type.toLowerCase().includes('gas') ||
            record.service_type.toLowerCase().includes('diesel'))) {
          category = 'Fuel';
        } else if (record.service_type && (
                  record.service_type.toLowerCase().includes('document') ||
                  record.service_type.toLowerCase().includes('license') ||
                  record.service_type.toLowerCase().includes('registration') ||
                  record.service_type.toLowerCase().includes('permit'))) {
          category = 'Documents';
        }
        
        // Add costs to appropriate time periods
        if (recordMonthYear === thisMonth) {
          categoryCosts[category].thisMonth += cost;
        }
        
        if (recordMonthYear === lastMonth) {
          categoryCosts[category].lastMonth += cost;
        }
        
        if (recordDate >= ytdStartDate) {
          categoryCosts[category].ytd += cost;
        }
      } catch (e) {
        console.error('Error processing record for monthly costs:', e, record);
      }
    });
    
    return categoryCosts;
  };
  
  const monthlyCosts = calculateMonthlyCosts();

  const hasServiceRecords = serviceRecords && serviceRecords.length > 0;

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
              <div className="ml-4">
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
                <h1 className="text-2xl text-gray-900 dark:text-white">{t('analytics.pageTitle')}</h1>
                <div className="flex space-x-4">
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                  >
                    <option value="7d">{t('analytics.timeRange.last7Days')}</option>
                    <option value="30d">{t('analytics.timeRange.last30Days')}</option>
                    <option value="3m">{t('analytics.timeRange.last3Months')}</option>
                    <option value="1y">{t('analytics.timeRange.lastYear')}</option>
                  </select>
                  <button 
                    className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm dark:bg-gray-700"
                    onClick={() => {
                      // Export data logic would go here
                      alert('Data export functionality will be implemented in a future update.');
                    }}
                  >
                    {t('analytics.exportData')}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button 
                        onClick={() => {
                          setError(null);
                          setLoading(true);
                          Promise.all([fetchVehicles(), fetchServiceHistory()]).finally(() => setLoading(false));
                        }}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                      >
                        {t('analytics.retry')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                  <div className="flex items-center space-x-4 mb-6">
                    <h3 className="text-lg text-gray-900 dark:text-white">{t('analytics.vehicleSelection')}</h3>
                    <div className="flex space-x-2 flex-wrap">
                      {vehicles.map(vehicle => (
                        <button 
                          key={vehicle.id}
                          className={`px-3 py-1 ${selectedVehicles.includes(vehicle.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} rounded text-sm mb-2`}
                          onClick={() => toggleVehicleSelection(vehicle.id)}
                        >
                          {vehicle.id} - {vehicle.make} {vehicle.model}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading ? (
                    <div className="h-96 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('analytics.loadingData')}</p>
                      </div>
                    </div>
                  ) : !hasServiceRecords ? (
                    <div className="h-96 flex items-center justify-center">
                      <div className="text-center max-w-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{t('analytics.noServiceHistory')}</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('analytics.noServiceHistoryDescription')}</p>
                        <div className="mt-6">
                          <Link
                            to="/service-history"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            {t('analytics.addServiceRecord')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                        <h4 className="text-sm text-gray-700 mb-4 dark:text-gray-200">{t('analytics.totalExpenseTrend')}</h4>
                        {Object.keys(chartData.recordsByMonth).length > 0 ? (
                          <div className="h-64">
                            <Line 
                              data={costTrendData} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => formatCurrency(value)
                                    }
                                  }
                                }
                              }} 
                            />
                          </div>
                        ) : (
                          <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">{t('analytics.noDataAvailable')}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                        <h4 className="text-sm text-gray-700 mb-4 dark:text-gray-200">{t('analytics.maintenanceCostByServiceType')}</h4>
                        {Object.keys(chartData.costByServiceType).length > 0 ? (
                          <div className="h-64">
                            <Doughnut 
                              data={costByServiceTypeData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: ${formatCurrency(value)}`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">{t('analytics.noDataAvailable')}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm text-gray-700 dark:text-gray-200">{t('analytics.mileageTracking')}</h4>
                        </div>
                        {chartData.totalMileage.length > 0 && chartData.totalMileage.some(v => v.data.length > 0) ? (
                          <div className="h-64">
                            <Line 
                              data={mileageTrendData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  x: {
                                    type: 'time',
                                    time: {
                                      unit: 'month',
                                      displayFormats: {
                                        month: 'MMM yyyy'
                                      }
                                    },
                                    title: {
                                      display: true,
                                      text: 'Date'
                                    }
                                  },
                                  y: {
                                    title: {
                                      display: true,
                                      text: 'Mileage (km)'
                                    },
                                    beginAtZero: false
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">{t('analytics.noMileageDataAvailable')}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900">
                        <h4 className="text-sm text-gray-700 mb-4 dark:text-gray-200">{t('analytics.costByVehicle')}</h4>
                        {Object.keys(chartData.costByVehicle).length > 0 ? (
                          <div className="h-64">
                            <Bar 
                              data={costByVehicleData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => formatCurrency(value)
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-64 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">{t('analytics.noDataAvailable')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {hasServiceRecords && (
                <div className="mt-8">
                  <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                    <h3 className="text-lg text-gray-900 mb-6 dark:text-white">{t('analytics.costBreakdown')}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">{t('analytics.category')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">{t('analytics.thisMonth')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">{t('analytics.lastMonth')}</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase dark:text-gray-400">{t('analytics.ytd')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(monthlyCosts).map(([category, costs]) => (
                            <tr key={category}>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{category}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(costs.thisMonth)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(costs.lastMonth)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(costs.ytd)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{t('analytics.total')}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(Object.values(monthlyCosts).reduce((sum, category) => sum + category.thisMonth, 0))}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(Object.values(monthlyCosts).reduce((sum, category) => sum + category.lastMonth, 0))}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(Object.values(monthlyCosts).reduce((sum, category) => sum + category.ytd, 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;