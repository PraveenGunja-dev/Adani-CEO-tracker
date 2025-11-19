"use client";

import { useState, useEffect } from 'react';
import CustomDropdown from './CustomDropdown';
import { API_BASE_URL } from '@/lib/config';

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

// Define the props interface
interface EnhancedDataTableProps {
  fiscalYear?: string;
  isAuthenticated?: boolean;
}

export default function EnhancedDataTable({
  fiscalYear = 'FY_25',
  isAuthenticated = true
}: EnhancedDataTableProps) {
  const [data, setData] = useState<TableRow[]>([]);
  const [filteredData, setFilteredData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<TableRow | null>(null);

  // State for dropdown options
  const [groups, setGroups] = useState<string[]>(['AGEL', 'ACL']);
  const [ppaMerchants, setPpaMerchants] = useState<string[]>(['PPA', 'Merchant']);
  const [types, setTypes] = useState<string[]>(['Solar', 'Wind', 'Hybrid']);
  const [locationCodes, setLocationCodes] = useState<string[]>(['Khavda', 'RJ', 'Others']);
  const [locations, setLocations] = useState<string[]>(['Khavda', 'Baap', 'Essel', 'Kamuthi']);
  const [connectivities, setConnectivities] = useState<string[]>(['CTU', 'STU']);

  // State for filters
  const [filters, setFilters] = useState({
    group: '',
    ppaMerchant: '',
    type: '',
    locationCode: '',
    location: '',
    connectivity: ''
  });

  // Load dropdown options
  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dropdown-options?fiscalYear=${fiscalYear}`);
        if (response.ok) {
          const options = await response.json();
          setGroups(Array.isArray(options.groups) ? options.groups : ['AGEL', 'ACL']);
          setPpaMerchants(Array.isArray(options.ppaMerchants) ? options.ppaMerchants : ['PPA', 'Merchant']);
          setTypes(Array.isArray(options.types) ? options.types : ['Solar', 'Wind', 'Hybrid']);
          setLocationCodes(Array.isArray(options.locationCodes) ? options.locationCodes : ['Khavda', 'RJ', 'Others']);
          setLocations(Array.isArray(options.locations) ? options.locations : ['Khavda', 'Baap', 'Essel', 'Kamuthi']);
          setConnectivities(Array.isArray(options.connectivities) ? options.connectivities : ['CTU', 'STU']);
        }
      } catch (err) {
        console.error('Error loading dropdown options:', err);
      }
    };

    loadDropdownOptions();
  }, [fiscalYear]);

  // Load data based on fiscal year
  useEffect(() => {
    const loadTableData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading data for fiscal year:', fiscalYear);

        // Try to load from database
        const response = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${fiscalYear}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        console.log('API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('API response data:', result);

          // Use database data with correct field mapping
          const validatedData = result.data.map((row: any, index: number) => ({
            id: row.id || index + 1,
            sno: row.sno || index + 1,
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

          console.log('Processed data:', validatedData);
          setData(validatedData);
          setFilteredData(validatedData);
        } else {
          console.error('Failed to load data:', response.status, response.statusText);
          setError(`Failed to load data: ${response.status} ${response.statusText}`);
          // Initialize with empty data if there's an error
          setData([]);
          setFilteredData([]);
        }
      } catch (err) {
        console.error('Error loading table data:', err);
        setError(`Error loading table data: ${err}`);
        // Initialize with empty data if there's an error
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    loadTableData();
  }, [fiscalYear]);

  // Apply filters whenever data or filters change
  useEffect(() => {
    console.log('Applying filters:', filters);
    console.log('Data to filter:', data);

    const filtered = data.filter(row => {
      return (
        (filters.group === '' || row.group === filters.group) &&
        (filters.ppaMerchant === '' || row.ppaMerchant === filters.ppaMerchant) &&
        (filters.type === '' || row.type === filters.type) &&
        (filters.locationCode === '' || row.locationCode === filters.locationCode) &&
        (filters.location === '' || row.location === filters.location) &&
        (filters.connectivity === '' || row.connectivity === filters.connectivity)
      );
    });

    console.log('Filtered data:', filtered);
    setFilteredData(filtered);
  }, [data, filters]);

  // Handle filter changes
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    console.log('Filter change:', field, value);
    setFilters({
      ...filters,
      [field]: value
    });
  };

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

  // Handle edit row
  const handleEditRow = (row: TableRow) => {
    if (!isAuthenticated) {
      alert('You need to be authenticated to edit a row.');
      return;
    }

    setEditingId(row.id);
    setEditRow({ ...row });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!isAuthenticated) {
      alert('You need to be authenticated to save changes.');
      return;
    }

    if (!editRow) return;

    // Validate required fields
    if (!editRow.capacity || !editRow.group || !editRow.ppaMerchant || !editRow.type ||
      !editRow.location || !editRow.locationCode || !editRow.pss || !editRow.connectivity) {
      alert('Please fill in all required fields');
      return;
    }

    // For Hybrid type, ensure only wind value is used
    const validatedEditRow = {
      ...editRow,
      ...(editRow.type === 'Hybrid' && { solar: null })
    };

    // Update the data in state
    const updatedData = data.map(row => row.id === editRow.id ? validatedEditRow : row);
    setData(updatedData);
    setEditingId(null);
    setEditRow(null);

    // Save to database
    try {
      const response = await fetch(`${API_BASE_URL}/table-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ fiscalYear, data: updatedData }),
      });

      if (!response.ok) {
        console.error('Failed to save data to database:', response.status, response.statusText);
        alert('Failed to save changes to database');
      }
    } catch (error) {
      console.error('Error saving table data to database:', error);
      alert('Error saving changes to database');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRow(null);
  };

  // Handle delete row
  const handleDeleteRow = async (id: number) => {
    if (!isAuthenticated) {
      alert('You need to be authenticated to delete a row.');
      return;
    }
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this row?')) {
      return;
    }
    
    // Update the data in state
    const updatedData = data.filter(row => row.id !== id);
    setData(updatedData);
    
    // Save to database
    try {
      const response = await fetch(`${API_BASE_URL}/table-data`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
        body: JSON.stringify({ fiscalYear, data: updatedData }),
      });

    if (!response.ok) {
      console.error('Failed to save data to database:', response.status, response.statusText);
      alert('Failed to delete row from database');
      // Revert the change in UI if database update failed
      const originalData = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${fiscalYear}`).then(res => res.json());
      setData(originalData.data);
    }
  } catch (error) {
    console.error('Error saving table data to database:', error);
    alert('Error deleting row from database');
    // Revert the change in UI if database update failed
    const originalData = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${fiscalYear}`).then(res => res.json());
    setData(originalData.data);
  }
};

// Handle input change for edit row
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
    } else {
      setEditRow({
        ...editRow,
        [field]: value
      });
    }
  }
};

if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span className="ml-3">Loading data...</span>
    </div>
  );
}

if (error) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error! </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );
}

return (
  <div className="mt-8 overflow-x-auto">
    <div className="inline-block min-w-full align-middle">
      {/* Filter Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Group</label>
          <CustomDropdown
            options={['', ...groups]}
            value={filters.group}
            onChange={(value) => handleFilterChange('group', value)}
            placeholder="All Groups"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-1">PPA/Merchant</label>
          <CustomDropdown
            options={['', ...ppaMerchants]}
            value={filters.ppaMerchant}
            onChange={(value) => handleFilterChange('ppaMerchant', value)}
            placeholder="All PPA/Merchant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Type</label>
          <CustomDropdown
            options={['', ...types]}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            placeholder="All Types"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Location Code</label>
          <CustomDropdown
            options={['', ...locationCodes]}
            value={filters.locationCode}
            onChange={(value) => handleFilterChange('locationCode', value)}
            placeholder="All Location Codes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Location</label>
          <CustomDropdown
            options={['', ...locations]}
            value={filters.location}
            onChange={(value) => handleFilterChange('location', value)}
            placeholder="All Locations"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Connectivity</label>
          <CustomDropdown
            options={['', ...connectivities]}
            value={filters.connectivity}
            onChange={(value) => handleFilterChange('connectivity', value)}
            placeholder="All Connectivities"
          />
        </div>
      </div>

      {/* Data Summary */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-foreground dark:text-white">
          Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{data.length}</span> records
        </p>
        <p className="text-sm text-foreground dark:text-white">
          Fiscal Year: <span className="font-semibold">{fiscalYear}</span>
        </p>
      </div>

      {/* Data Table */}
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
              Group
            </th>
            <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
              PPA/Merchant
            </th>
            <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
              Type
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
              Location Code
            </th>
            <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
              Location
            </th>
            <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
              PSS
            </th>
            <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
              Connectivity
            </th>
            <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] py-3.5 pl-3 pr-4 backdrop-blur-sm backdrop-filter sm:pr-6 lg:pr-8">
              Actions
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
                    <input
                      type="number"
                      step="0.01"
                      value={editRow?.capacity || ''}
                      onChange={(e) => handleEditInputChange('capacity', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                    <CustomDropdown
                      options={groups}
                      value={editRow?.group || ''}
                      onChange={(value) => handleEditInputChange('group', value)}
                      placeholder="Select Group"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                    <CustomDropdown
                      options={ppaMerchants}
                      value={editRow?.ppaMerchant || ''}
                      onChange={(value) => handleEditInputChange('ppaMerchant', value)}
                      placeholder="Select Option"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                    <CustomDropdown
                      options={types}
                      value={editRow?.type || ''}
                      onChange={(value) => handleEditInputChange('type', value)}
                      placeholder="Select Type"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                    <input
                      type="number"
                      value={editRow?.solar || ''}
                      onChange={(e) => handleEditInputChange('solar', e.target.value ? parseFloat(e.target.value) : null)}
                      className={`w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm ${editRow?.type === 'Wind' || editRow?.type === 'Hybrid' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={editRow?.type === 'Wind' || editRow?.type === 'Hybrid'}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                    <input
                      type="number"
                      value={editRow?.wind || ''}
                      onChange={(e) => handleEditInputChange('wind', e.target.value ? parseFloat(e.target.value) : null)}
                      className={`w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-sm ${editRow?.type === 'Solar' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={editRow?.type === 'Solar'}
                    />
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
                    <CustomDropdown
                      options={locationCodes}
                      value={editRow?.locationCode || ''}
                      onChange={(value) => handleEditInputChange('locationCode', value)}
                      placeholder="Select Location Code"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                    <CustomDropdown
                      options={locations}
                      value={editRow?.location || ''}
                      onChange={(value) => handleEditInputChange('location', value)}
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
                    {isAuthenticated ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRow(row)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">Login required</span>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}

          {/* Total row */}
          {filteredData.length > 0 && (
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
          )}
        </tbody>
      </table>

      {filteredData.length === 0 && (
        <div className="text-center py-10">
          <p className="text-foreground dark:text-white">No data found matching the current filters.</p>
        </div>
      )}
    </div>
  </div>
);
}