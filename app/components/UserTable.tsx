"use client";

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

// Import the fiscal year data files
import exDataFY24 from './ex.json';
import exDataFY25 from './ex_fy25.json';
import exDataFY26 from './ex_fy26.json';
import exDataFY27 from './ex_fy27.json';
import exDataFY28 from './ex_fy28.json';

// Import the custom dropdown component
import CustomDropdown from './CustomDropdown';

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

// Define the props interface
interface UserTableProps {
  fiscalYear?: string;
  isAuthenticated?: boolean;
  showTracker?: boolean;
  onFormSubmit?: () => void;
}

export default function UserTable({ 
  fiscalYear = 'FY_24', 
  isAuthenticated = true,
  showTracker = false,
  onFormSubmit
}: UserTableProps) {
  // This would typically come from your authentication system
  // const isAuthenticated = true; // Placeholder for now
  
  const [data, setData] = useState<TableRow[]>([]);
  const [nextId, setNextId] = useState(1);
  const [nextSno, setNextSno] = useState(1);
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

  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<TableRow | null>(null);

  // State for dropdown menus
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // State for enhanced dropdown with add functionality
  const [showAddInput, setShowAddInput] = useState<{[key: string]: boolean}>({});
  const [newDropdownValue, setNewDropdownValue] = useState<{[key: string]: string}>({});

  // State for filters (only for dropdown columns)
  const [filters, setFilters] = useState({
    group: '',
    ppaMerchant: '',
    type: '',
    locationCode: '',
    location: '',
    pss: '',
    connectivity: ''
  });

  // Refs for dropdowns
  const tableRef = useRef<HTMLDivElement>(null);

  // State for dropdown options
  const [groups, setGroups] = useState<string[]>(['AGEL', 'ACL']);
  const [ppaMerchants, setPpaMerchants] = useState<string[]>(['PPA', 'Merchant']);
  const [types, setTypes] = useState<string[]>(['Solar', 'Wind', 'Hybrid']);
  const [locationCodes, setLocationCodes] = useState<string[]>(['Khavda', 'RJ']);
  const [locations, setLocations] = useState<string[]>(['Khavda', 'Baap', 'Essel']);
  // PSS is now an input field with "PSS - " prefix, so we don't need a dropdown list
  const [connectivities, setConnectivities] = useState<string[]>(['CTU']);

  // State for location relationships
  const [locationRelationships, setLocationRelationships] = useState<LocationRelationship[]>([
    { location: 'Khavda', locationCode: 'Khavda' },
    { location: 'Baap', locationCode: 'RJ' },
    { location: 'Essel', locationCode: 'RJ' }
  ]);

  // Load dropdown options and location relationships from MongoDB
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load dropdown options
        const response = await fetch('/api/dropdown-options');
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
        const relResponse = await fetch('/api/location-relationships');
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
  }, []);

  // Load data based on fiscal year
  useEffect(() => {
    const loadTableData = async () => {
      try {
        // Reset data state immediately when fiscal year changes
        setData([]);
        setNextId(1);
        setNextSno(1);
        
        // Add a small delay to ensure state is reset before loading new data
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Try to load from database first
        const response = await fetch(`/api/table-data?fiscalYear=${fiscalYear}`, {
          cache: 'no-store', // Disable caching
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log(`Loading data for fiscal year: ${fiscalYear}`);
        console.log('Database response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`Database data for ${fiscalYear}:`, result);
          
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            // Use database data
            const validatedData = result.data.map((row: any) => ({
              id: row.id || 0,
              sno: row.sno || 0,
              capacity: typeof row.capacity === 'number' ? row.capacity : null,
              group: row.group || '',
              ppaMerchant: row.ppaMerchant || '',
              type: row.type || '',
              solar: typeof row.solar === 'number' ? row.solar : null,
              wind: typeof row.wind === 'number' ? row.wind : null,
              spv: row.spv || '',
              locationCode: row.locationCode || '',
              location: row.location || '',
              pss: row.pss || '',
              connectivity: row.connectivity || ''
            }));
            
            setData(validatedData);
            if (validatedData.length > 0) {
              setNextId(Math.max(...validatedData.map((row: TableRow) => row.id)) + 1);
              setNextSno(Math.max(...validatedData.map((row: TableRow) => row.sno)) + 1);
            }
            return;
          }
        } else {
          console.error('Failed to load data from database:', response.status, response.statusText);
        }
        
        // If no database data or error, use default data based on fiscal year
        let defaultData: any[] = [];
        
        // Select data based on fiscal year - corrected mapping
        switch (fiscalYear) {
          case 'FY_23':
            defaultData = exDataFY24; // FY_23 should use ex.json data
            break;
          case 'FY_24':
            defaultData = exDataFY25; // FY_24 should use ex_fy25.json data
            break;
          case 'FY_25':
            defaultData = exDataFY26; // FY_25 should use ex_fy26.json data
            break;
          case 'FY_26':
            defaultData = []; // FY_26 should be empty
            break;
          case 'FY_27':
            defaultData = []; // FY_27 should be empty
            break;
          case 'FY_28':
            defaultData = exDataFY28;
            break;
          default:
            defaultData = exDataFY24;
        }
        
        // Convert the default fiscal year data to TableRow format
        const convertedDefaultData: TableRow[] = defaultData.map((item: any, index: number) => {
          // Handle different possible field names for PSS
          let pssValue = '';
          if (item["PSS"]) {
            pssValue = item["PSS"];
          } else if (item["PSS -"]) {
            pssValue = item["PSS -"];
          } else if (item["PSS-"]) {
            pssValue = item["PSS-"];
          }
          
          // Format PSS field properly
          const formattedPSS = formatPSSField(pssValue || '');
          
          return {
            id: index + 1,
            sno: item["Sl No"] || index + 1,
            capacity: typeof item["Capacity"] === 'number' ? item["Capacity"] : 
                      (typeof item["Capacity"] === 'string' && !isNaN(parseFloat(item["Capacity"])) ? parseFloat(item["Capacity"]) : null),
            group: item["Group"] || '',
            ppaMerchant: item["PPA/Merchant"] || '',
            type: item["Type"] || '',
            solar: typeof item["Solar"] === 'number' ? item["Solar"] : 
                   (typeof item["Solar"] === 'string' && !isNaN(parseFloat(item["Solar"])) ? parseFloat(item["Solar"]) : null),
            wind: typeof item["Wind"] === 'number' ? item["Wind"] : 
                  (typeof item["Wind"] === 'string' && !isNaN(parseFloat(item["Wind"])) ? parseFloat(item["Wind"]) : null),
            spv: item["SPV"] || '',
            locationCode: item["Location Code"] || '',
            location: item["Location"] || '',
            pss: formattedPSS,
            connectivity: item["Connectivity"] || ''
          };
        });
        
        setData(convertedDefaultData);
        if (convertedDefaultData.length > 0) {
          setNextId(Math.max(...convertedDefaultData.map(row => row.id)) + 1);
          setNextSno(Math.max(...convertedDefaultData.map(row => row.sno)) + 1);
        }
      } catch (error) {
        console.error('Error loading table data:', error);
        // Fallback to default data
        let defaultData: any[] = [];
        
        // Select data based on fiscal year - corrected mapping
        switch (fiscalYear) {
          case 'FY_23':
            defaultData = exDataFY24; // FY_23 should use ex.json data
            break;
          case 'FY_24':
            defaultData = exDataFY25; // FY_24 should use ex_fy25.json data
            break;
          case 'FY_25':
            defaultData = exDataFY26; // FY_25 should use ex_fy26.json data
            break;
          case 'FY_26':
            defaultData = []; // FY_26 should be empty
            break;
          case 'FY_27':
            defaultData = []; // FY_27 should be empty
            break;
          case 'FY_28':
            defaultData = exDataFY28;
            break;
          default:
            defaultData = exDataFY24;
        }
        
        // Convert the default fiscal year data to TableRow format
        const convertedDefaultData: TableRow[] = defaultData.map((item: any, index: number) => {
          // Handle different possible field names for PSS
          let pssValue = '';
          if (item["PSS"]) {
            pssValue = item["PSS"];
          } else if (item["PSS -"]) {
            pssValue = item["PSS -"];
          } else if (item["PSS-"]) {
            pssValue = item["PSS-"];
          }
          
          // Format PSS field properly
          const formattedPSS = formatPSSField(pssValue || '');
          
          return {
            id: index + 1,
            sno: item["Sl No"] || index + 1,
            capacity: typeof item["Capacity"] === 'number' ? item["Capacity"] : 
                      (typeof item["Capacity"] === 'string' && !isNaN(parseFloat(item["Capacity"])) ? parseFloat(item["Capacity"]) : null),
            group: item["Group"] || '',
            ppaMerchant: item["PPA/Merchant"] || '',
            type: item["Type"] || '',
            solar: typeof item["Solar"] === 'number' ? item["Solar"] : 
                   (typeof item["Solar"] === 'string' && !isNaN(parseFloat(item["Solar"])) ? parseFloat(item["Solar"]) : null),
            wind: typeof item["Wind"] === 'number' ? item["Wind"] : 
                  (typeof item["Wind"] === 'string' && !isNaN(parseFloat(item["Wind"])) ? parseFloat(item["Wind"]) : null),
            spv: item["SPV"] || '',
            locationCode: item["Location Code"] || '',
            location: item["Location"] || '',
            pss: formattedPSS,
            connectivity: item["Connectivity"] || ''
          };
        });
        
        setData(convertedDefaultData);
        if (convertedDefaultData.length > 0) {
          setNextId(Math.max(...convertedDefaultData.map(row => row.id)) + 1);
          setNextSno(Math.max(...convertedDefaultData.map(row => row.sno)) + 1);
        }
      }
    };
    
    loadTableData();
  }, [fiscalYear]);
  
  // Helper function to format PSS field
  const formatPSSField = (pssValue: string): string => {
    if (!pssValue) return '';
    
    // Remove extra spaces and normalize the format
    let cleanedValue = pssValue.trim();
    
    // If the value already starts with "PSS - ", return as is
    if (cleanedValue.startsWith('PSS - ')) {
      return cleanedValue;
    }
    
    // If the value starts with "PSS-" or "PSS -" with extra spaces, normalize it
    if (cleanedValue.startsWith('PSS-') || cleanedValue.startsWith('PSS -')) {
      // Extract the part after "PSS-" or "PSS -"
      const parts = cleanedValue.split(/[-\s]+/);
      if (parts.length > 1) {
        return `PSS - ${parts.slice(1).join(' ')}`;
      }
      return 'PSS - ';
    }
    
    // If the value is just a number or other text, add the prefix
    if (cleanedValue) {
      return `PSS - ${cleanedValue}`;
    }
    
    return '';
  };

  // Function to save all dropdown options to API
  const saveDropdownOptions = async () => {
    try {
      const response = await fetch('/api/dropdown-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      }
    } catch (error: any) {
      console.error('Error saving dropdown options:', error.message || error);
    }
  };

  // Function to save a single dropdown option and update the API
  const saveDropdownOption = async (optionType: string, value: string) => {
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
    
    // Then save all options to the API
    saveDropdownOptions();
  };

  // Save data to localStorage whenever data changes, separated by fiscal year
  useEffect(() => {
    if (fiscalYear) {
      // Save to localStorage for backward compatibility
      localStorage.setItem(`tableData_${fiscalYear}`, JSON.stringify(data));
      
      // Save to database
      const saveToDatabase = async () => {
        try {
          // Validate data before sending to database
          const validatedData = data.map(row => ({
            id: row.id,
            sno: row.sno,
            capacity: row.capacity,
            group: row.group,
            ppaMerchant: row.ppaMerchant,
            type: row.type,
            solar: row.solar,
            wind: row.wind,
            spv: row.spv,
            locationCode: row.locationCode,
            location: row.location,
            pss: row.pss,
            connectivity: row.connectivity
          }));
          
          const response = await fetch('/api/table-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ fiscalYear, data: validatedData }),
          });
          
          if (!response.ok) {
            console.error('Failed to save data to database:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error saving table data to database:', error);
        }
      };
      
      saveToDatabase();
    }
  }, [data, fiscalYear]);

  // Save dropdown options to localStorage
  /*
  useEffect(() => {
    const options = {
      groups,
      ppaMerchants,
      types,
      locationCodes,
      locations,
      connectivities
    };
    localStorage.setItem('dropdownOptions', JSON.stringify(options));
  }, [groups, ppaMerchants, types, locationCodes, locations, connectivities]);
  */

  // Filter data based on filter criteria (only dropdown filters)
  const filteredData = data.filter(row => {
    return (
      (filters.group === '' || row.group === filters.group) &&
      (filters.ppaMerchant === '' || row.ppaMerchant === filters.ppaMerchant) &&
      (filters.type === '' || row.type === filters.type) &&
      (filters.locationCode === '' || row.locationCode === filters.locationCode) &&
      (filters.location === '' || row.location === filters.location) &&
      (filters.pss === '' || row.pss === filters.pss) &&
      (filters.connectivity === '' || row.connectivity === filters.connectivity)
    );
  });

  // Calculate sums for numeric columns
  const calculateSums = () => {
    return filteredData.reduce((acc, row) => {
      acc.capacity += row.capacity || 0;
      acc.solar += row.solar || 0;
      acc.wind += row.wind || 0;
      return acc;
    }, { capacity: 0, solar: 0, wind: 0 });
  };

  const sums = calculateSums();

  const handleAddRow = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('You need to be authenticated to add a new row.');
      return;
    }
    
    // Validate required fields
    if (!newRow.capacity || !newRow.group || !newRow.ppaMerchant || !newRow.type || 
        !newRow.location || !newRow.locationCode || !newRow.pss || !newRow.connectivity) {
      alert('Please fill in all required fields');
      return;
    }
    
    // For Hybrid type, ensure only wind value is used
    const rowToAdd: TableRow = {
      id: nextId,
      sno: nextSno,
      ...newRow,
      // If type is Hybrid, use only wind value and clear solar
      ...(newRow.type === 'Hybrid' && { solar: null })
    };
    
    setData([...data, rowToAdd]);
    setNextId(nextId + 1);
    setNextSno(nextSno + 1);
    
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
    
    // Call the onFormSubmit callback if provided to close the form
    if (onFormSubmit) {
      onFormSubmit();
    }
    
    // The data will be automatically saved to both localStorage and database by the useEffect hook
  };

  const handleDeleteRow = (id: number) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('You need to be authenticated to delete a row.');
      return;
    }
    
    const updatedData = data.filter(row => row.id !== id);
    setData(updatedData);
    setOpenMenuId(null);
  };

  const handleEditRow = (row: TableRow) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('You need to be authenticated to edit a row.');
      return;
    }
    
    setEditingId(row.id);
    setEditRow({...row});
    setOpenMenuId(null);
  };

  const handleSaveEdit = () => {
    if (editRow) {
      setData(data.map(row => row.id === editRow.id ? editRow : row));
      setEditingId(null);
      setEditRow(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRow(null);
  };

  const handleExportToExcel = () => {
    // Create the data array with headers
    const dataWithTotals = [
      ['S.No', 'Capacity', 'Group', 'PPA/Merchant', 'Type', 'Solar', 'Wind', 'SPV', 'Location Code', 'Location', 'PSS', 'Connectivity'],
      ...filteredData.map(row => [
        row.sno,
        row.capacity,
        row.group,
        row.ppaMerchant,
        row.type,
        row.solar,
        row.wind,
        row.spv,
        row.locationCode,
        row.location,
        row.pss,
        row.connectivity
      ]),
      [], // Empty row
      ['TOTAL', sums.capacity.toFixed(2), '', '', '', sums.solar, sums.wind, '', '', '', '', '']
    ];
    
    // Create the data worksheet with totals
    const dataWorksheet = XLSX.utils.aoa_to_sheet(dataWithTotals);
    
    // Create the summary worksheet with sums
    const summaryData = [
      ['SUMMARY REPORT'],
      [''],
      ['Metric', 'Value'],
      ['Total Capacity', sums.capacity.toFixed(2)],
      ['Total Solar', sums.solar],
      ['Total Wind', sums.wind]
    ];
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Create workbook and add both worksheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataWorksheet, 'Table Data');
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    
    XLSX.writeFile(workbook, 'table-data-with-summary.xlsx');
  };

  const handleInputChange = (field: keyof Omit<TableRow, 'id' | 'sno'>, value: string | number | null) => {
    // Clear solar when type is Wind and clear wind when type is Solar
    // For Hybrid, use only wind value
    if (field === 'type') {
      if (value === 'Wind') {
        setNewRow({
          ...newRow,
          type: value as string,
          solar: null
        });
      } else if (value === 'Solar') {
        setNewRow({
          ...newRow,
          type: value as string,
          wind: null
        });
      } else if (value === 'Hybrid') {
        setNewRow({
          ...newRow,
          type: value as string,
          solar: null  // Clear solar for Hybrid type
        });
      } else {
        setNewRow({
          ...newRow,
          type: value as string
        });
      }
    } 
    // Set location code based on location selection
    else if (field === 'location') {
      // Find the corresponding location code
      const selectedLocation = value as string;
      const relationship = locationRelationships.find(rel => rel.location === selectedLocation);
      const locationCode = relationship ? relationship.locationCode : '';
      
      setNewRow({
        ...newRow,
        location: selectedLocation,
        locationCode
      });
    } else {
      setNewRow({
        ...newRow,
        [field]: value
      });
    }
  };

  const handleEditInputChange = (field: keyof TableRow, value: string | number | null) => {
    if (editRow) {
      // Clear solar when type is Wind and clear wind when type is Solar
      // For Hybrid, use only wind value
      if (field === 'type') {
        if (value === 'Wind') {
          setEditRow({
            ...editRow,
            type: value as string,
            solar: null
          });
        } else if (value === 'Solar') {
          setEditRow({
            ...editRow,
            type: value as string,
            wind: null
          });
        } else if (value === 'Hybrid') {
          setEditRow({
            ...editRow,
            type: value as string,
            solar: null  // Clear solar for Hybrid type
          });
        } else {
          setEditRow({
            ...editRow,
            type: value as string
          });
        }
      }
      // Set location code based on location selection
      else if (field === 'location') {
        // Find the corresponding location code
        const selectedLocation = value as string;
        const relationship = locationRelationships.find(rel => rel.location === selectedLocation);
        const locationCode = relationship ? relationship.locationCode : '';
        
        setEditRow({
          ...editRow,
          location: selectedLocation,
          locationCode
        });
      } else {
        setEditRow({
          ...editRow,
          [field]: value
        });
      }
    }
  };

  // Toggle menu visibility
  const toggleMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside any menu
      if (openMenuId !== null) {
        const menuElement = document.getElementById(`menu-${openMenuId}`);
        if (menuElement && !menuElement.contains(e.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  // Handle filter changes
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  // Tooltip component
  const InfoTooltip = ({ text }: { text: string }) => (
    <div className="relative inline-block group ml-1">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-gray-500 cursor-help"
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
        {text}
        <div className="absolute top-1/2 right-full transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-foreground dark:text-white">Data Table</h1>
          <p className="mt-2 text-sm text-foreground/70 dark:text-gray-300">
            Manage your data entries with the table below.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-2">
          <button
            type="button"
            onClick={handleExportToExcel}
            className="block rounded-md bg-button-success hover:bg-button-success-hover px-3 py-2 text-center text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-success transition-colors"
          >
            Export to Excel
          </button>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                // Always call onFormSubmit to toggle the tracker form in the parent component
                if (onFormSubmit) {
                  onFormSubmit();
                }
              }}
              className="block rounded-md bg-button-primary hover:bg-button-primary-hover px-3 py-2 text-center text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-primary transition-colors"
            >
              Add New Capacity
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Redirect to login page
                window.location.href = '/login?redirect=/application#analytics';
              }}
              className="block rounded-md bg-button-primary hover:bg-button-primary-hover px-3 py-2 text-center text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-primary transition-colors"
            >
              Login to Add
            </button>
          )}

        </div>
      </div>
      
      {/* Delete Confirmation Modal */}

      {/* New Row Input */}
      {showTracker && isAuthenticated ? (
        <div className="mt-6 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Capacity Entry</h2>
                <button
                  onClick={() => {
                    // Call onFormSubmit to close the form
                    if (onFormSubmit) {
                      onFormSubmit();
                    }
                  }}
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
                    <InfoTooltip text="Enter value with up to 2 decimals, e.g. 12.35" />
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
                      onChange={(e) => handleInputChange('capacity', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter capacity"
                    />
                  </div>
                </div>
                
                <CustomDropdown
                  label="Group"
                  options={groups}
                  value={newRow.group}
                  onChange={(value) => handleInputChange('group', value)}
                  onAddNew={(value) => {
                    saveDropdownOption('groups', value);
                  }}
                  placeholder="Select Group"
                />
                
                <CustomDropdown
                  label="PPA/Merchant"
                  options={ppaMerchants}
                  value={newRow.ppaMerchant}
                  onChange={(value) => handleInputChange('ppaMerchant', value)}
                  onAddNew={(value) => {
                    saveDropdownOption('ppaMerchants', value);
                  }}
                  placeholder="Select Option"
                />
                
                <CustomDropdown
                  label="Type"
                  options={types}
                  value={newRow.type}
                  onChange={(value) => handleInputChange('type', value)}
                  onAddNew={(value) => {
                    saveDropdownOption('types', value);
                  }}
                  placeholder="Select Type"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Solar
                    <InfoTooltip text="Enter value with up to 2 decimals, e.g. 12.35" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      value={newRow.solar || ''}
                      onChange={(e) => handleInputChange('solar', e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${newRow.type === 'Wind' || newRow.type === 'Hybrid' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter solar value"
                      disabled={newRow.type === 'Wind' || newRow.type === 'Hybrid'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wind
                    <InfoTooltip text="Enter value with up to 2 decimals, e.g. 12.35" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      value={newRow.wind || ''}
                      onChange={(e) => handleInputChange('wind', e.target.value ? parseInt(e.target.value) : null)}
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
                      onChange={(e) => handleInputChange('spv', e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter SPV"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
                
                <CustomDropdown
                  label="Location"
                  options={locations}
                  value={newRow.location}
                  onChange={(value) => handleInputChange('location', value)}
                  onAddNew={(value) => {
                    // Also add to location relationships with a default location code
                    const newRelationship = { location: value, locationCode: value };
                    setLocationRelationships(prev => [...prev, newRelationship]);
                    saveDropdownOption('locations', value);
                  }}
                  placeholder="Select Location"
                />

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
                      onChange={(e) => handleInputChange('pss', `PSS - ${e.target.value}`)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter number"
                    />
                  </div>
                </div>
                
                <CustomDropdown
                  label="Connectivity"
                  options={connectivities}
                  value={newRow.connectivity}
                  onChange={(value) => handleInputChange('connectivity', value)}
                  onAddNew={(value) => {
                    saveDropdownOption('connectivities', value);
                  }}
                  placeholder="Select Connectivity"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Call onFormSubmit to close the form
                    if (onFormSubmit) {
                      onFormSubmit();
                    }
                  }}
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
      ) : (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-blue-100 dark:border-gray-700">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-blue-800 dark:text-blue-200">
              {isAuthenticated 
                ? "Click 'Add New Capacity' button above to add new entries to the table." 
                : "You need to be authenticated to add new entries to the table."}
            </p>
          </div>
        </div>
      )}
      
      {/* Data Table */}
      <div ref={tableRef} className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter sm:pl-6 lg:pl-8">
                  S.No
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  Capacity
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Group</div>
                  <div className="mt-1">
                    <CustomDropdown
                      options={['', ...groups]}
                      value={filters.group}
                      onChange={(value) => handleFilterChange('group', value)}
                      onAddNew={(value) => {
                        saveDropdownOption('groups', value);
                        handleFilterChange('group', value);
                      }}
                      placeholder="All"
                    />
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>PPA/Merchant</div>
                  <div className="mt-1">
                    <CustomDropdown
                      options={['', ...ppaMerchants]}
                      value={filters.ppaMerchant}
                      onChange={(value) => handleFilterChange('ppaMerchant', value)}
                      onAddNew={(value) => {
                        saveDropdownOption('ppaMerchants', value);
                        handleFilterChange('ppaMerchant', value);
                      }}
                      placeholder="All"
                    />
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Type</div>
                  <div className="mt-1">
                    <CustomDropdown
                      options={['', ...types]}
                      value={filters.type}
                      onChange={(value) => handleFilterChange('type', value)}
                      onAddNew={(value) => {
                        saveDropdownOption('types', value);
                        handleFilterChange('type', value);
                      }}
                      placeholder="All"
                    />
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  Solar
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  Wind
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  SPV
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Location Code</div>
                  <div className="mt-1">
                    <CustomDropdown
                      options={['', ...locationCodes]}
                      value={filters.locationCode}
                      onChange={(value) => handleFilterChange('locationCode', value)}
                      onAddNew={(value) => {
                        saveDropdownOption('locationCodes', value);
                        handleFilterChange('locationCode', value);
                      }}
                      placeholder="All"
                    />
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Location</div>
                  <div className="mt-1">
                    <CustomDropdown
                      options={['', ...locations]}
                      value={filters.location}
                      onChange={(value) => handleFilterChange('location', value)}
                      onAddNew={(value) => {
                        // Also add to location relationships with a default location code
                        const newRelationship = { location: value, locationCode: value };
                        setLocationRelationships(prev => [...prev, newRelationship]);
                        saveDropdownOption('locations', value);
                        handleFilterChange('location', value);
                      }}
                      placeholder="All"
                    />
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  PSS
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Connectivity</div>
                  <div className="mt-1">
                    <CustomDropdown
                      options={['', ...connectivities]}
                      value={filters.connectivity}
                      onChange={(value) => handleFilterChange('connectivity', value)}
                      onAddNew={(value) => {
                        saveDropdownOption('connectivities', value);
                        handleFilterChange('connectivity', value);
                      }}
                      placeholder="All"
                    />
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] py-3.5 pl-3 pr-4 backdrop-blur-sm backdrop-filter sm:pr-6 lg:pr-8">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border dark:divide-gray-700 bg-card-background dark:bg-[#171717]">
              {filteredData.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={index % 2 === 0 ? 'bg-card-background dark:bg-[#171717]' : 'bg-table-row-hover dark:bg-gray-800'}
                >
                  {editingId === row.id ? (
                    // Edit mode row
                    <>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground dark:text-white sm:pl-6 lg:pl-8">
                        {row.sno}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.01"
                            value={editRow?.capacity || ''}
                            onChange={(e) => handleEditInputChange('capacity', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                          />
                          <InfoTooltip text="Enter value with up to 2 decimals, e.g. 12.35" />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <CustomDropdown
                          options={groups}
                          value={editRow?.group || ''}
                          onChange={(value) => handleEditInputChange('group', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('groups', value);
                            handleEditInputChange('group', value);
                          }}
                          placeholder="Select Group"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <CustomDropdown
                          options={ppaMerchants}
                          value={editRow?.ppaMerchant || ''}
                          onChange={(value) => handleEditInputChange('ppaMerchant', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('ppaMerchants', value);
                            handleEditInputChange('ppaMerchant', value);
                          }}
                          placeholder="Select Option"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <CustomDropdown
                          options={types}
                          value={editRow?.type || ''}
                          onChange={(value) => handleEditInputChange('type', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('types', value);
                            handleEditInputChange('type', value);
                          }}
                          placeholder="Select Type"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={editRow?.solar || ''}
                            onChange={(e) => handleEditInputChange('solar', e.target.value ? parseInt(e.target.value) : null)}
                            className={`w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm ${editRow?.type === 'Wind' || editRow?.type === 'Hybrid' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={editRow?.type === 'Wind' || editRow?.type === 'Hybrid'}
                          />
                          <InfoTooltip text="Enter value with up to 2 decimals, e.g. 12.35" />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={editRow?.wind || ''}
                            onChange={(e) => handleEditInputChange('wind', e.target.value ? parseInt(e.target.value) : null)}
                            className={`w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm ${editRow?.type === 'Solar' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={editRow?.type === 'Solar'}
                          />
                          <InfoTooltip text="Enter value with up to 2 decimals, e.g. 12.35" />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <input
                          type="text"
                          value={editRow?.spv || ''}
                          onChange={(e) => handleEditInputChange('spv', e.target.value.toUpperCase())}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <input
                          type="text"
                          value={editRow?.locationCode || ''}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                          readOnly
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <CustomDropdown
                          options={locations}
                          value={editRow?.location || ''}
                          onChange={(value) => handleEditInputChange('location', value)}
                          onAddNew={(value) => {
                            // Also add to location relationships with a default location code
                            const newRelationship = { location: value, locationCode: value };
                            setLocationRelationships(prev => [...prev, newRelationship]);
                            saveDropdownOption('locations', value);
                            handleEditInputChange('location', value);
                          }}
                          placeholder="Select Location"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <input
                          type="text"
                          value={editRow?.pss?.replace('PSS - ', '') || ''}
                          onChange={(e) => handleEditInputChange('pss', `PSS - ${e.target.value}`)}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <CustomDropdown
                          options={connectivities}
                          value={editRow?.connectivity || ''}
                          onChange={(value) => handleEditInputChange('connectivity', value)}
                          onAddNew={(value) => {
                            saveDropdownOption('connectivities', value);
                            handleEditInputChange('connectivity', value);
                          }}
                          placeholder="Select Connectivity"
                        />
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Display mode row
                    <>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground dark:text-white sm:pl-6 lg:pl-8">
                        {row.sno}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.capacity?.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.group}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.ppaMerchant}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.solar?.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.wind?.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.spv}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.locationCode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.location}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.pss}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        {row.connectivity}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => toggleMenu(row.id, e)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openMenuId === row.id && (
                            <div 
                              id={`menu-${row.id}`}
                              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#171717] ring-1 ring-black ring-opacity-5 z-20"
                            >
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                {isAuthenticated ? (
                                  <>
                                    <button
                                      onClick={() => handleEditRow(row)}
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 w-full text-left"
                                      role="menuitem"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRow(row.id)}
                                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800 w-full text-left"
                                      role="menuitem"
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      // Redirect to login page
                                      window.location.href = '/login?redirect=/application#analytics';
                                    }}
                                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800 w-full text-left"
                                    role="menuitem"
                                  >
                                    Login to Edit/Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-table-header dark:bg-[#171717] font-semibold">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-foreground dark:text-white sm:pl-6 lg:pl-8">
                  TOTAL
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {sums.capacity.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {sums.solar.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {sums.wind.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}