"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import SearchableDropdown from './SearchableDropdown';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define the structure for table rows
interface TableRow {
  id: number;
  sno: number;
  capacity: number | null;
  group: string;
  ppaMerchant: string;
  type: string;
  solar: number | null;
  wind: number | null;
  spv: string;
  locationCode: string;
  location: string;
  pss: string;
  connectivity: string;
}

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

export default function AnalyticsPage() {
  const [fiscalYear, setFiscalYear] = useState('FY_25');
  const [showTracker, setShowTracker] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tableData, setTableData] = useState<TableRow[]>([]); // State to hold data from API
  const [newRow, setNewRow] = useState<Omit<TableRow, 'id' | 'sno'>>({
    capacity: null,
    group: '',
    ppaMerchant: '',
    type: '',
    solar: null,
    wind: null,
    spv: '',
    locationCode: '',
    location: '',
    pss: '',
    connectivity: ''
  });

  // State for dropdown options
  const [groups, setGroups] = useState<string[]>(['AGEL', 'ACL']);
  const [ppaMerchants, setPpaMerchants] = useState<string[]>(['PPA', 'Merchant']);
  const [types, setTypes] = useState<string[]>(['Solar', 'Wind', 'Hybrid']);
  const [locationCodes, setLocationCodes] = useState<string[]>(['Khavda', 'RJ']);
  const [locations, setLocations] = useState<string[]>(['Khavda', 'Baap', 'Essel']);
  const [connectivities, setConnectivities] = useState<string[]>(['CTU']);

  // State for table filters
  const [filters, setFilters] = useState({
    group: '',
    ppaMerchant: '',
    type: '',
    locationCode: '',
    location: '',
    connectivity: ''
  });

  // State for location relationships
  const [locationRelationships, setLocationRelationships] = useState<LocationRelationship[]>([
    { location: 'Khavda', locationCode: 'Khavda' },
    { location: 'Baap', locationCode: 'RJ' },
    { location: 'Essel', locationCode: 'RJ' }
  ]);

  // Load dropdown options and location relationships from API
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load dropdown options
        const response = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`);
        if (response.ok) {
          const options = await response.json();
          // Ensure all options are arrays
          setGroups(Array.isArray(options.groups) ? options.groups : ['AGEL', 'ACL']);
          setPpaMerchants(Array.isArray(options.ppaMerchants) ? options.ppaMerchants : ['PPA', 'Merchant']);
          setTypes(Array.isArray(options.types) ? options.types : ['Solar', 'Wind', 'Hybrid']);
          setLocationCodes(Array.isArray(options.locationCodes) ? options.locationCodes : ['Khavda', 'RJ']);
          setLocations(Array.isArray(options.locations) ? options.locations : ['Khavda', 'Baap', 'Essel']);
          setConnectivities(Array.isArray(options.connectivities) ? options.connectivities : ['CTU']);
        } else {
          console.error('Failed to load dropdown options:', response.status, response.statusText);
        }
        
        // Load location relationships
        const relResponse = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`);
        if (relResponse.ok) {
          const relationships = await relResponse.json();
          if (Array.isArray(relationships) && relationships.length > 0) {
            setLocationRelationships(relationships);
          }
        }
      } catch (error: any) {
        console.error('Error loading master data:', error.message || error);
      }
    };
    
    loadMasterData();
  }, [fiscalYear]);

  // Function to save all dropdown options to API
  const saveDropdownOptions = async () => {
    try {
      const response = await fetch('/api/dropdown-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fiscalYear,
          groups,
          ppaMerchants,
          types,
          locationCodes,
          locations,
          connectivities
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save dropdown options:', response.status, response.statusText);
        throw new Error(`Failed to save dropdown options: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Dropdown options saved successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Error saving dropdown options:', error.message || error);
      throw error;
    }
  };

  // Function to save location relationships to API
  const saveLocationRelationships = async () => {
    try {
      const response = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationRelationships)
      });
      
      if (!response.ok) {
        console.error('Failed to save location relationships:', response.status, response.statusText);
      }
    } catch (error: any) {
      console.error('Error saving location relationships:', error.message || error);
    }
  };

  // Function to handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Function to save a single dropdown option and update the API
  const saveDropdownOption = async (optionType: string, value: string) => {
    // Check if the value already exists to prevent duplicates
    let alreadyExists = false;
    switch (optionType) {
      case 'groups':
        alreadyExists = groups.includes(value);
        break;
      case 'ppaMerchants':
        alreadyExists = ppaMerchants.includes(value);
        break;
      case 'types':
        alreadyExists = types.includes(value);
        break;
      case 'locationCodes':
        alreadyExists = locationCodes.includes(value);
        break;
      case 'locations':
        alreadyExists = locations.includes(value);
        break;
      case 'connectivities':
        alreadyExists = connectivities.includes(value);
        break;
      default:
        return;
    }
    
    // If the value already exists, don't add it again
    if (alreadyExists) {
      return;
    }
    
    // First update the local state
    switch (optionType) {
      case 'groups':
        setGroups(prev => [...prev, value]);
        break;
      case 'ppaMerchants':
        setPpaMerchants(prev => [...prev, value]);
        break;
      case 'types':
        setTypes(prev => [...prev, value]);
        break;
      case 'locationCodes':
        setLocationCodes(prev => [...prev, value]);
        break;
      case 'locations':
        setLocations(prev => [...prev, value]);
        break;
      case 'connectivities':
        setConnectivities(prev => [...prev, value]);
        break;
      default:
        return;
    }
    
    // Then save the individual option to the API
    try {
      const response = await fetch('/api/dropdown-option', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fiscalYear,
          optionType,
          optionValue: value
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save dropdown option');
      }
      
      const result = await response.json();
      console.log(`Successfully added new ${optionType}: ${value}`, result);
    } catch (error: any) {
      console.error(`Failed to save ${optionType}: ${value}`, error);
      alert(`Failed to save ${optionType}: ${error.message || 'Unknown error'}`);
      // Revert the local state change if save failed
      switch (optionType) {
        case 'groups':
          setGroups(prev => prev.filter(item => item !== value));
          break;
        case 'ppaMerchants':
          setPpaMerchants(prev => prev.filter(item => item !== value));
          break;
        case 'types':
          setTypes(prev => prev.filter(item => item !== value));
          break;
        case 'locationCodes':
          setLocationCodes(prev => prev.filter(item => item !== value));
          break;
        case 'locations':
          setLocations(prev => prev.filter(item => item !== value));
          break;
        case 'connectivities':
          setConnectivities(prev => prev.filter(item => item !== value));
          break;
      }
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    setShowTracker(prev => !prev);
  };

  // Handle add new capacity button click
  const handleAddNewCapacity = () => {
    if (user) {
      setShowTracker(true);
    } else {
      // Redirect to login page with proper redirect URL
      router.push('/login?redirect=/application#analytics');
    }
  };

  // Check if we should show the tracker after login
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const shouldShowTracker = localStorage.getItem('showTrackerAfterLogin');
      if (shouldShowTracker === 'true') {
        setShowTracker(true);
        localStorage.removeItem('showTrackerAfterLogin');
      }
    }
  }, [user]);

  // Also check on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldShowTracker = localStorage.getItem('showTrackerAfterLogin');
      if (shouldShowTracker === 'true' && user) {
        setShowTracker(true);
        localStorage.removeItem('showTrackerAfterLogin');
      }
    }
  }, []);

  // Fetch table data from API when fiscal year changes
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await fetch(`/api/table-data?fiscalYear=${fiscalYear}`);
        if (response.ok) {
          const result = await response.json();
          setTableData(result.data || []);
        } else {
          console.error('Failed to fetch table data:', response.status, response.statusText);
          setTableData([]);
        }
      } catch (error) {
        console.error('Error fetching table data:', error);
        setTableData([]);
      }
    };

    fetchTableData();
  }, [fiscalYear]);

  // Handle adding a new row
  const handleAddRow = async () => {
    // Check if user is authenticated
    if (!user) {
      alert('You need to be authenticated to add a new row.');
      return;
    }

    // Validate required fields
    if (!newRow.capacity || !newRow.group || !newRow.ppaMerchant || !newRow.type || 
        !newRow.location || !newRow.locationCode || !newRow.pss || !newRow.connectivity) {
      alert('Please fill in all required fields');
      return;
    }

    // Create a new row with proper ID and S.No
    const nextId = tableData.length > 0 ? Math.max(...tableData.map(row => row.id)) + 1 : 1;
    const nextSno = tableData.length > 0 ? Math.max(...tableData.map(row => row.sno)) + 1 : 1;

    const rowToAdd: TableRow = {
      id: nextId,
      sno: nextSno,
      ...newRow,
      // If type is Hybrid, use only wind value and clear solar
      ...(newRow.type === 'Hybrid' && { solar: null })
    };

    // Add the new row to the table data
    const updatedData = [...tableData, rowToAdd];
    setTableData(updatedData);

    // Reset new row
    setNewRow({
      capacity: null,
      group: '',
      ppaMerchant: '',
      type: '',
      solar: null,
      wind: null,
      spv: '',
      locationCode: '',
      location: '',
      pss: '',
      connectivity: ''
    });

    // Save to database
    try {
      const response = await fetch('/api/table-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fiscalYear, data: updatedData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save data to database:', response.status, response.statusText, errorText);
        alert(`Failed to save data to database: ${response.status} ${response.statusText}`);
      } else {
        const result = await response.json();
        console.log('Data saved successfully to database:', result);
      }
    } catch (error: any) {
      console.error('Error saving table data to database:', error);
      alert(`Error saving data to database: ${error.message || 'Unknown error'}`);
    }

    // Close the form
    setShowTracker(false);
  };

  // Sample data for charts - now using data from API
  const getChartData = () => {
    // Use data from API instead of static JSON files
    let data = tableData;

    // Calculate statistics from the data
    let totalCapacity = 0;
    let totalSolar = 0;
    let totalWind = 0;
    let projectCount = data.length;
    
    // Group data by type and group for charts
    const typeData: Record<string, number> = {
      'Solar': 0,
      'Wind': 0,
      'Hybrid': 0
    };
    
    const groupData: Record<string, number> = {
      'AGEL': 0,
      'ACL': 0
    };
    
    // Group data by PPA/Merchant for charts
    const ppaMerchantData: Record<string, number> = {};
    

    
    // Process each data entry
    data.forEach(item => {
      const capacity = typeof item.capacity === 'number' ? item.capacity : 0;
      const solar = typeof item.solar === 'number' ? item.solar : 0;
      const wind = typeof item.wind === 'number' ? item.wind : 0;
      const type = item.type || 'Unknown';
      const group = item.group || 'Unknown';
      const ppaMerchant = item.ppaMerchant || 'Unknown';

      
      totalCapacity += capacity;
      totalSolar += solar;
      totalWind += wind;
      
      // Update type data
      if (typeData.hasOwnProperty(type)) {
        typeData[type] += capacity;
      }
      
      // Update group data
      if (groupData.hasOwnProperty(group)) {
        groupData[group] += 1;
      }
      
      // Update PPA/Merchant data
      if (!ppaMerchantData.hasOwnProperty(ppaMerchant)) {
        ppaMerchantData[ppaMerchant] = 0;
      }
      ppaMerchantData[ppaMerchant] += capacity;
      

    });
    
    // Prepare chart data for Bar chart (Capacity by Type)
    const typeChartData = {
      labels: Object.keys(typeData),
      datasets: [
        {
          label: 'Capacity (MW)',
          data: Object.values(typeData),
          backgroundColor: [
            'rgba(11, 116, 176, 0.8)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 0.8)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 0.8)',   // Adani Pink (#BD3861)
          ],
          borderColor: [
            'rgba(11, 116, 176, 1)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 1)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 1)',   // Adani Pink (#BD3861)
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Prepare chart data for Pie chart (Projects by Group)
    const groupChartData = {
      labels: Object.keys(groupData),
      datasets: [
        {
          label: 'Projects',
          data: Object.values(groupData),
          backgroundColor: [
            'rgba(11, 116, 176, 0.8)', // Adani Blue (#0B74B0)
            'rgba(189, 56, 97, 0.8)',   // Adani Pink (#BD3861)
          ],
          borderColor: [
            'rgba(11, 116, 176, 1)', // Adani Blue (#0B74B0)
            'rgba(189, 56, 97, 1)',   // Adani Pink (#BD3861)
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Prepare chart data for PPA/Merchant chart
    const ppaMerchantChartData = {
      labels: Object.keys(ppaMerchantData),
      datasets: [
        {
          label: 'Capacity (MW)',
          data: Object.values(ppaMerchantData),
          backgroundColor: [
            'rgba(11, 116, 176, 0.8)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 0.8)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 0.8)',   // Adani Pink (#BD3861)
            'rgba(255, 176, 0, 0.8)',   // Yellow
            'rgba(0, 176, 117, 0.8)',   // Green
            'rgba(176, 0, 117, 0.8)',   // Magenta
          ],
          borderColor: [
            'rgba(11, 116, 176, 1)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 1)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 1)',   // Adani Pink (#BD3861)
            'rgba(255, 176, 0, 1)',   // Yellow
            'rgba(0, 176, 117, 1)',   // Green
            'rgba(176, 0, 117, 1)',   // Magenta
          ],
          borderWidth: 1,
        },
      ],
    };
    

    
    return {
      capacity: Math.round(totalCapacity),
      solar: Math.round(totalSolar),
      wind: Math.round(totalWind),
      projects: projectCount,
      typeData: typeChartData,
      groupData: groupChartData,
      ppaMerchantData: ppaMerchantChartData,

    };
  };

  const chartData = getChartData();

  return (
    <div className=" dark:bg-[#171717]">
      {/* Main Layout - Year Selection on Left, Charts on Right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Year Selection and Summary Cards */}
        <div className="lg:w-1/4 flex items-center">
          {/* Fiscal Year Selection */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">View and analyze data with the charts below.</p>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Year
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="FY_23">FY23</option>
                <option value="FY_24">FY24</option>
                <option value="FY_25">FY25</option>
                <option value="FY_26">FY26</option>
                <option value="FY_27">FY27</option>
              </select>
              <svg 
                className="absolute right-3 top-8 h-5 w-5 text-gray-400 dark:text-gray-300 pointer-events-none" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Right Column - Charts */}
        <div className="lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Capacity by Type</h3>
              <div className="h-64">
                <Bar 
                  data={chartData.typeData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Projects by Group</h3>
              <div className="h-64">
                <Pie 
                  data={chartData.groupData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Capacity by PPA/Merchant</h3>
              <div className="h-64">
                <Bar 
                  data={chartData.ppaMerchantData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            

          </div>
        </div>
      </div>
      
      {/* Add New Capacity Button - Moved above the table */}
      <div className="mt-6">
        {user ? (
          <button
            type="button"
            onClick={handleAddNewCapacity}
            className="rounded-md bg-button-primary hover:bg-button-primary-hover px-4 py-2 text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-primary transition-colors"
          >
            Add New Capacity
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Redirect to login page
              router.push('/login?redirect=/application#analytics');
            }}
            className="rounded-md bg-button-primary hover:bg-button-primary-hover px-4 py-2 text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-primary transition-colors"
          >
            Login to Add
          </button>
        )}
      </div>
      
      {/* Tracker Form - Add New Capacity Entry */}
      {showTracker && user && (
        <div className="mt-6 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Capacity Entry</h2>
                <button
                  onClick={() => setShowTracker(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={newRow.capacity || ''}
                      onChange={(e) => setNewRow({...newRow, capacity: e.target.value ? parseFloat(e.target.value) : null})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter capacity"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group
                  </label>
                  <SearchableDropdown
                    options={groups}
                    value={newRow.group}
                    onChange={(value) => setNewRow({...newRow, group: value})}
                    onAddNew={(value) => {
                      saveDropdownOption('groups', value);
                      setNewRow({...newRow, group: value});
                    }}
                    placeholder="Select or type group..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PPA/Merchant
                  </label>
                  <SearchableDropdown
                    options={ppaMerchants}
                    value={newRow.ppaMerchant}
                    onChange={(value) => setNewRow({...newRow, ppaMerchant: value})}
                    onAddNew={(value) => {
                      saveDropdownOption('ppaMerchants', value);
                      setNewRow({...newRow, ppaMerchant: value});
                    }}
                    placeholder="Select or type PPA/Merchant..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <SearchableDropdown
                    options={types}
                    value={newRow.type}
                    onChange={(value) => {
                      // Create a new object with the updated type
                      const updatedRow = {
                        ...newRow,
                        type: value
                      };
                      
                      // Clear solar when type is Wind or Hybrid
                      if (value === 'Wind' || value === 'Hybrid') {
                        updatedRow.solar = null;
                      }
                      
                      // Clear wind when type is Solar
                      if (value === 'Solar') {
                        updatedRow.wind = null;
                      }
                      
                      setNewRow(updatedRow);
                    }}
                    onAddNew={(value) => {
                      saveDropdownOption('types', value);
                      // Create a new object with the updated type
                      const updatedRow = {
                        ...newRow,
                        type: value
                      };
                      
                      // Clear solar when type is Wind or Hybrid
                      if (value === 'Wind' || value === 'Hybrid') {
                        updatedRow.solar = null;
                      }
                      
                      // Clear wind when type is Solar
                      if (value === 'Solar') {
                        updatedRow.wind = null;
                      }
                      
                      setNewRow(updatedRow);
                    }}
                    placeholder="Select or type type..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Solar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={newRow.solar || ''}
                      onChange={(e) => setNewRow({...newRow, solar: e.target.value ? parseFloat(e.target.value) : null})}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${newRow.type === 'Wind' || newRow.type === 'Hybrid' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter solar value"
                      disabled={newRow.type === 'Wind' || newRow.type === 'Hybrid'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wind
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={newRow.wind || ''}
                      onChange={(e) => setNewRow({...newRow, wind: e.target.value ? parseFloat(e.target.value) : null})}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${newRow.type === 'Solar' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter wind value"
                      disabled={newRow.type === 'Solar'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SPV</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newRow.spv}
                      onChange={(e) => setNewRow({...newRow, spv: e.target.value.toUpperCase()})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter SPV"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <SearchableDropdown
                    options={locations}
                    value={newRow.location}
                    onChange={(value) => {
                      const location = value;
                      // Set location code based on location selection
                      let locationCode = '';
                      const relationship = locationRelationships.find(rel => rel.location === location);
                      locationCode = relationship ? relationship.locationCode : '';
                      setNewRow({...newRow, location, locationCode});
                    }}
                    onAddNew={(value) => {
                      // Also add to location relationships with a default location code
                      const newRelationship = { location: value, locationCode: value };
                      setLocationRelationships(prev => [...prev, newRelationship]);
                      saveDropdownOption('locations', value);
                      // Save location relationships to API
                      saveLocationRelationships();
                      setNewRow({...newRow, location: value, locationCode: value});
                    }}
                    placeholder="Select or type location..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newRow.locationCode}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PSS</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newRow.pss.replace('PSS - ', '')}
                      onChange={(e) => setNewRow({...newRow, pss: `PSS - ${e.target.value}`})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter number"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Connectivity</label>
                  <SearchableDropdown
                    options={connectivities}
                    value={newRow.connectivity}
                    onChange={(value) => setNewRow({...newRow, connectivity: value})}
                    onAddNew={(value) => {
                      saveDropdownOption('connectivities', value);
                      setNewRow({...newRow, connectivity: value});
                    }}
                    placeholder="Select or type connectivity..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowTracker(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRow}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Table - Display data from database */}
      {tableData.length > 0 ? (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <h3 className="text-lg font-medium text-foreground dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            Data for {fiscalYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">S.No</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">Capacity</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Group</span>
                      <div className="mt-1">
                        <SearchableDropdown
                          options={['', ...groups]}
                          value={filters.group}
                          onChange={(value) => handleFilterChange('group', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('groups', value);
                            handleFilterChange('group', value);
                          }}
                          placeholder="All"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-36">
                    <div className="flex flex-col">
                      <span>PPA/Merchant</span>
                      <div className="mt-1">
                        <SearchableDropdown
                          options={['', ...ppaMerchants]}
                          value={filters.ppaMerchant}
                          onChange={(value) => handleFilterChange('ppaMerchant', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('ppaMerchants', value);
                            handleFilterChange('ppaMerchant', value);
                          }}
                          placeholder="All"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-28">
                    <div className="flex flex-col">
                      <span>Type</span>
                      <div className="mt-1">
                        <SearchableDropdown
                          options={['', ...types]}
                          value={filters.type}
                          onChange={(value) => handleFilterChange('type', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('types', value);
                            handleFilterChange('type', value);
                          }}
                          placeholder="All"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">Solar</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">Wind</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">SPV</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Location Code</span>
                      <div className="mt-1">
                        <SearchableDropdown
                          options={['', ...locationCodes]}
                          value={filters.locationCode}
                          onChange={(value) => handleFilterChange('locationCode', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('locationCodes', value);
                            handleFilterChange('locationCode', value);
                          }}
                          placeholder="All"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Location</span>
                      <div className="mt-1">
                        <SearchableDropdown
                          options={['', ...locations]}
                          value={filters.location}
                          onChange={(value) => handleFilterChange('location', value)}
                          onAddNew={(value) => {
                            // Also add to location relationships with a default location code
                            const newRelationship = { location: value, locationCode: value };
                            setLocationRelationships(prev => [...prev, newRelationship]);
                            saveDropdownOption('locations', value);
                            handleFilterChange('location', value);
                            // Save location relationships to API
                            saveLocationRelationships();
                          }}
                          placeholder="All"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">PSS</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Connectivity</span>
                      <div className="mt-1">
                        <SearchableDropdown
                          options={['', ...connectivities]}
                          value={filters.connectivity}
                          onChange={(value) => handleFilterChange('connectivity', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('connectivities', value);
                            handleFilterChange('connectivity', value);
                          }}
                          placeholder="All"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tableData
                  .filter(row => 
                    (filters.group === '' || row.group === filters.group) &&
                    (filters.ppaMerchant === '' || row.ppaMerchant === filters.ppaMerchant) &&
                    (filters.type === '' || row.type === filters.type) &&
                    (filters.locationCode === '' || row.locationCode === filters.locationCode) &&
                    (filters.location === '' || row.location === filters.location) &&
                    (filters.connectivity === '' || row.connectivity === filters.connectivity)
                  )
                  .map((row, index) => (
                    <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{row.sno || index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.capacity !== null ? row.capacity.toFixed(2) : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.group || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.ppaMerchant || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.type || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.solar !== null ? row.solar.toFixed(2) : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.wind !== null ? row.wind.toFixed(2) : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.spv || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.locationCode || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.location || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.pss || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.connectivity || ''}</td>
                    </tr>
                  ))
                }
                {tableData.filter(row => 
                  (filters.group === '' || row.group === filters.group) &&
                  (filters.ppaMerchant === '' || row.ppaMerchant === filters.ppaMerchant) &&
                  (filters.type === '' || row.type === filters.type) &&
                  (filters.locationCode === '' || row.locationCode === filters.locationCode) &&
                  (filters.location === '' || row.location === filters.location) &&
                  (filters.connectivity === '' || row.connectivity === filters.connectivity)
                ).length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No data matches the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for {fiscalYear}</p>
        </div>
      )}
    </div>
  );
}