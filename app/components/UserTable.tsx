"use client";

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

// Import the fiscal year data files
import exDataFY24 from './ex.json';
import exDataFY25 from './ex_fy25.json';
import exDataFY26 from './ex_fy26.json';

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
    // Get the default data for this fiscal year
    let defaultData: any[] = [];
    
    // Select data based on fiscal year
    switch (fiscalYear) {
      case 'FY_24':
        defaultData = exDataFY24;
        break;
      case 'FY_25':
        defaultData = exDataFY25;
        break;
      case 'FY_26':
        defaultData = exDataFY26;
        break;
      default:
        defaultData = exDataFY24;
    }
    
    // Check if we should force reload default data
    const forceReload = localStorage.getItem(`forceReload_${fiscalYear}`);
    
    // Convert the default fiscal year data to TableRow format
    const convertedDefaultData: TableRow[] = defaultData.map((item: any, index: number) => ({
      id: index + 1,
      sno: item["Sl No"] || index + 1,
      capacity: typeof item["Capacity"] === 'number' ? item["Capacity"] : null,
      group: item["Group"] || '',
      ppaMerchant: item["PPA/Merchant"] || '',
      type: item["Type"] || '',
      solar: typeof item["Solar"] === 'number' ? item["Solar"] : null,
      wind: typeof item["Wind"] === 'number' ? item["Wind"] : null,
      spv: item["SPV"] || '',
      locationCode: item["Location Code"] || '',
      location: item["Location"] || '',
      pss: formatPSSField(item["PSS"] || ''), // Format PSS field to ensure it has "PSS - " prefix
      connectivity: item["Connectivity"] || ''
    }));
    
    // Try to load saved data for this fiscal year, unless force reload is requested
    if (!forceReload) {
      const savedData = localStorage.getItem(`tableData_${fiscalYear}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Use saved data
          setData(parsedData);
          if (parsedData.length > 0) {
            setNextId(Math.max(...parsedData.map((row: TableRow) => row.id)) + 1);
            setNextSno(Math.max(...parsedData.map((row: TableRow) => row.sno)) + 1);
          } else {
            // If saved data is empty, use default data
            setData(convertedDefaultData);
            setNextId(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.id)) + 1 : 1);
            setNextSno(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.sno)) + 1 : 1);
          }
        } catch (e) {
          console.error('Error parsing saved data:', e);
          // If there's an error parsing saved data, use default data
          setData(convertedDefaultData);
          setNextId(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.id)) + 1 : 1);
          setNextSno(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.sno)) + 1 : 1);
        }
      } else {
        // If no saved data, use default data
        setData(convertedDefaultData);
        setNextId(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.id)) + 1 : 1);
        setNextSno(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.sno)) + 1 : 1);
      }
    } else {
      // Force reload default data
      setData(convertedDefaultData);
      setNextId(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.id)) + 1 : 1);
      setNextSno(convertedDefaultData.length > 0 ? Math.max(...convertedDefaultData.map(row => row.sno)) + 1 : 1);
      // Remove the force reload flag
      localStorage.removeItem(`forceReload_${fiscalYear}`);
    }
  }, [fiscalYear]);
  
  // Helper function to format PSS field
  const formatPSSField = (pssValue: string): string => {
    if (!pssValue) return '';
    // If the value already starts with "PSS - ", return as is
    if (pssValue.startsWith('PSS - ')) {
      return pssValue;
    }
    // If the value starts with "PSS-", add a space
    if (pssValue.startsWith('PSS-')) {
      return pssValue.replace('PSS-', 'PSS - ');
    }
    // If the value is just a number or other text, add the prefix
    return `PSS - ${pssValue}`;
  };

  // Function to save new dropdown options to API
  const saveDropdownOption = async (optionType: string, value: string) => {
    try {
      const response = await fetch('/api/dropdown-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: optionType,
          value: value
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save dropdown option:', response.status, response.statusText);
      }
    } catch (error: any) {
      console.error('Error saving dropdown option:', error.message || error);
    }
  };

  // Save data to localStorage whenever data changes, separated by fiscal year
  useEffect(() => {
    if (fiscalYear) {
      localStorage.setItem(`tableData_${fiscalYear}`, JSON.stringify(data));
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
    
    // Save data to localStorage
    const updatedData = [...data, rowToAdd];
    localStorage.setItem(`tableData_${fiscalYear}`, JSON.stringify(updatedData));
  };

  const handleDeleteRow = (id: number) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('You need to be authenticated to delete a row.');
      return;
    }
    
    setData(data.filter(row => row.id !== id));
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

  // Enhanced dropdown component with add functionality
  const EnhancedDropdown = ({ 
    label, 
    value, 
    options, 
    onChange, 
    onAddNew, 
    placeholder, 
    fieldKey,
    icon 
  }: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    onAddNew: (value: string) => void;
    placeholder: string;
    fieldKey: string;
    icon: React.ReactNode;
  }) => {
    const handleAddNew = () => {
      const newValue = newDropdownValue[fieldKey]?.trim();
      if (newValue && !options.includes(newValue)) {
        onAddNew(newValue);
        onChange(newValue);
        setNewDropdownValue({ ...newDropdownValue, [fieldKey]: '' });
        setShowAddInput({ ...showAddInput, [fieldKey]: false });
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddNew();
      } else if (e.key === 'Escape') {
        setShowAddInput({ ...showAddInput, [fieldKey]: false });
        setNewDropdownValue({ ...newDropdownValue, [fieldKey]: '' });
      }
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
          >
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddInput({ ...showAddInput, [fieldKey]: true })}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="Add new option"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {showAddInput[fieldKey] && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newDropdownValue[fieldKey] || ''}
              onChange={(e) => setNewDropdownValue({ ...newDropdownValue, [fieldKey]: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder={`Enter new ${label.toLowerCase()}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddNew}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddInput({ ...showAddInput, [fieldKey]: false });
                setNewDropdownValue({ ...newDropdownValue, [fieldKey]: '' });
              }}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
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
                
                <EnhancedDropdown
                  label="Group"
                  value={newRow.group}
                  options={groups}
                  onChange={(value) => handleInputChange('group', value)}
                  onAddNew={(value) => {
                    setGroups([...groups, value]);
                    // Optionally save to API
                    saveDropdownOption('groups', value);
                  }}
                  placeholder="Select Group"
                  fieldKey="group"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  }
                />
                
                <EnhancedDropdown
                  label="PPA/Merchant"
                  value={newRow.ppaMerchant}
                  options={ppaMerchants}
                  onChange={(value) => handleInputChange('ppaMerchant', value)}
                  onAddNew={(value) => {
                    setPpaMerchants([...ppaMerchants, value]);
                    saveDropdownOption('ppaMerchants', value);
                  }}
                  placeholder="Select Option"
                  fieldKey="ppaMerchant"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  }
                />
                
                <EnhancedDropdown
                  label="Type"
                  value={newRow.type}
                  options={types}
                  onChange={(value) => handleInputChange('type', value)}
                  onAddNew={(value) => {
                    setTypes([...types, value]);
                    saveDropdownOption('types', value);
                  }}
                  placeholder="Select Type"
                  fieldKey="type"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  }
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
                
                <EnhancedDropdown
                  label="Location"
                  value={newRow.location}
                  options={locations}
                  onChange={(value) => handleInputChange('location', value)}
                  onAddNew={(value) => {
                    setLocations([...locations, value]);
                    // Also add to location relationships with a default location code
                    const newRelationship = { location: value, locationCode: value };
                    setLocationRelationships([...locationRelationships, newRelationship]);
                    saveDropdownOption('locations', value);
                  }}
                  placeholder="Select Location"
                  fieldKey="location"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  }
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
                
                <EnhancedDropdown
                  label="Connectivity"
                  value={newRow.connectivity}
                  options={connectivities}
                  onChange={(value) => handleInputChange('connectivity', value)}
                  onAddNew={(value) => {
                    setConnectivities([...connectivities, value]);
                    saveDropdownOption('connectivities', value);
                  }}
                  placeholder="Select Connectivity"
                  fieldKey="connectivity"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l-1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  }
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
                    <select
                      value={filters.group}
                      onChange={(e) => handleFilterChange('group', e.target.value)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                    >
                      <option value="">All</option>
                      {groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>PPA/Merchant</div>
                  <div className="mt-1">
                    <select
                      value={filters.ppaMerchant}
                      onChange={(e) => handleFilterChange('ppaMerchant', e.target.value)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                    >
                      <option value="">All</option>
                      {ppaMerchants.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Type</div>
                  <div className="mt-1">
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                    >
                      <option value="">All</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
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
                    <select
                      value={filters.locationCode}
                      onChange={(e) => handleFilterChange('locationCode', e.target.value)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                    >
                      <option value="">All</option>
                      {locationCodes.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Location</div>
                  <div className="mt-1">
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                    >
                      <option value="">All</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  PSS
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                  <div>Connectivity</div>
                  <div className="mt-1">
                    <select
                      value={filters.connectivity}
                      onChange={(e) => handleFilterChange('connectivity', e.target.value)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                    >
                      <option value="">All</option>
                      {connectivities.map(conn => (
                        <option key={conn} value={conn}>{conn}</option>
                      ))}
                    </select>
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
                        <select
                          value={editRow?.group || ''}
                          onChange={(e) => handleEditInputChange('group', e.target.value)}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                        >
                          <option value="">Select Group</option>
                          {groups.map(group => (
                            <option key={group} value={group}>{group}</option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <select
                          value={editRow?.ppaMerchant || ''}
                          onChange={(e) => handleEditInputChange('ppaMerchant', e.target.value)}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                        >
                          <option value="">Select Option</option>
                          {ppaMerchants.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                        <select
                          value={editRow?.type || ''}
                          onChange={(e) => handleEditInputChange('type', e.target.value)}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                        >
                          <option value="">Select Type</option>
                          {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
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
                        <select
                          value={editRow?.location || ''}
                          onChange={(e) => handleEditInputChange('location', e.target.value)}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                        >
                          <option value="">Select Location</option>
                          {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
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
                        <select
                          value={editRow?.connectivity || ''}
                          onChange={(e) => handleEditInputChange('connectivity', e.target.value)}
                          className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                        >
                          <option value="">Select Connectivity</option>
                          {connectivities.map(conn => (
                            <option key={conn} value={conn}>{conn}</option>
                          ))}
                        </select>
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