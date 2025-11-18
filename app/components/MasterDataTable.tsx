"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

// Define the structure for dropdown options
interface DropdownOptions {
  groups: string[];
  ppaMerchants: string[];
  types: string[];
  locationCodes: string[];
  locations: string[];
  connectivities: string[];
}

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

export default function MasterDataTable() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [fiscalYear, setFiscalYear] = useState('FY_23');
  
  // State for dropdown management
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    groups: ['AGEL', 'ACL'],
    ppaMerchants: ['PPA', 'Merchant'],
    types: ['Solar', 'Wind', 'Hybrid'],
    locationCodes: ['Khavda', 'RJ'],
    locations: ['Khavda', 'Baap', 'Essel'],
    connectivities: ['CTU']
  });
  
  // State for location relationships
  const [locationRelationships, setLocationRelationships] = useState<LocationRelationship[]>([
    { location: 'Khavda', locationCode: 'Khavda' },
    { location: 'Baap', locationCode: 'RJ' },
    { location: 'Essel', locationCode: 'RJ' }
  ]);
  
  // State for tracking initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // State for adding new dropdown options
  const [newOption, setNewOption] = useState({
    category: 'groups',
    value: ''
  });
  
  // State for editing dropdown options
  const [editingOption, setEditingOption] = useState<{
    category: keyof DropdownOptions;
    index: number;
    value: string;
  } | null>(null);
  
  // State for adding new location relationships
  const [newRelationship, setNewRelationship] = useState<LocationRelationship>({
    location: '',
    locationCode: ''
  });
  
  // State for editing location relationships
  const [editingRelationship, setEditingRelationship] = useState<{
    index: number;
    relationship: LocationRelationship;
  } | null>(null);

  // Load dropdown options and location relationships from SQLite
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load dropdown options
        const response = await fetch('/api/dropdown-options');
        if (response.ok) {
          const options = await response.json();
          // Ensure all options are arrays
          setDropdownOptions({
            groups: Array.isArray(options.groups) ? options.groups : ['AGEL', 'ACL'],
            ppaMerchants: Array.isArray(options.ppaMerchants) ? options.ppaMerchants : ['PPA', 'Merchant'],
            types: Array.isArray(options.types) ? options.types : ['Solar', 'Wind', 'Hybrid'],
            locationCodes: Array.isArray(options.locationCodes) ? options.locationCodes : ['Khavda', 'RJ'],
            locations: Array.isArray(options.locations) ? options.locations : ['Khavda', 'Baap', 'Essel'],
            connectivities: Array.isArray(options.connectivities) ? options.connectivities : ['CTU']
          });
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
      } finally {
        // Mark initial load as complete
        setIsInitialLoad(false);
      }
    };
    
    loadMasterData();
  }, []);

  // Save dropdown options and location relationships to SQLite
  useEffect(() => {
    const saveMasterData = async () => {
      try {
        // Save dropdown options
        const response = await fetch('/api/dropdown-options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dropdownOptions),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save dropdown options:', response.status, response.statusText, errorText);
        }
        
        // Save location relationships
        const relResponse = await fetch('/api/location-relationships', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationRelationships),
        });
        
        if (!relResponse.ok) {
          const errorText = await relResponse.text();
          console.error('Failed to save location relationships:', relResponse.status, relResponse.statusText, errorText);
        }
      } catch (error: any) {
        console.error('Error saving master data:', error.message || error);
      }
    };
    
    // Don't save on initial load
    if (!isInitialLoad) {
      saveMasterData();
    }
  }, [dropdownOptions, locationRelationships, isInitialLoad]);

  const handleAddOption = () => {
    if (!user) {
      alert('You need to be authenticated to add new options.');
      return;
    }
    
    if (!newOption.value.trim()) {
      alert('Please enter a value.');
      return;
    }
    
    // Check if option already exists
    if (dropdownOptions[newOption.category as keyof DropdownOptions].includes(newOption.value)) {
      alert('This option already exists.');
      return;
    }
    
    setDropdownOptions(prev => ({
      ...prev,
      [newOption.category]: [...prev[newOption.category as keyof DropdownOptions], newOption.value]
    }));
    
    // If we're adding a new location, also add it to the locations list for immediate availability
    if (newOption.category === 'locations') {
      // The location will be added to the dropdown automatically through the state update above
      // But we also need to make sure it's available in the relationships if needed
    }
    
    // Reset form
    setNewOption({
      category: 'groups',
      value: ''
    });
  };

  const handleEditOption = () => {
    if (!user || !editingOption) {
      alert('You need to be authenticated to edit options.');
      return;
    }
    
    if (!editingOption.value.trim()) {
      alert('Please enter a value.');
      return;
    }
    
    setDropdownOptions(prev => {
      const updatedOptions = [...prev[editingOption.category]];
      updatedOptions[editingOption.index] = editingOption.value;
      return {
        ...prev,
        [editingOption.category]: updatedOptions
      };
    });
    
    setEditingOption(null);
  };

  const handleDeleteOption = (category: keyof DropdownOptions, index: number) => {
    if (!user) {
      alert('You need to be authenticated to delete options.');
      return;
    }
    
    if (dropdownOptions[category].length <= 1) {
      alert('You must have at least one option in each category.');
      return;
    }
    
    setDropdownOptions(prev => {
      const updatedOptions = [...prev[category]];
      updatedOptions.splice(index, 1);
      return {
        ...prev,
        [category]: updatedOptions
      };
    });
  };

  const handleAddRelationship = () => {
    if (!user) {
      alert('You need to be authenticated to add new relationships.');
      return;
    }
    
    if (!newRelationship.location.trim() || !newRelationship.locationCode.trim()) {
      alert('Please enter both location and location code.');
      return;
    }
    
    // Check if relationship already exists
    if (locationRelationships.some(rel => 
      rel.location === newRelationship.location && rel.locationCode === newRelationship.locationCode)) {
      alert('This relationship already exists.');
      return;
    }
    
    // Add the location to the locations dropdown if it doesn't exist
    if (!dropdownOptions.locations.includes(newRelationship.location)) {
      setDropdownOptions(prev => ({
        ...prev,
        locations: [...prev.locations, newRelationship.location]
      }));
    }
    
    setLocationRelationships([...locationRelationships, newRelationship]);
    
    // Reset form
    setNewRelationship({
      location: '',
      locationCode: ''
    });
  };

  const handleEditRelationship = () => {
    if (!user || !editingRelationship) {
      alert('You need to be authenticated to edit relationships.');
      return;
    }
    
    if (!editingRelationship.relationship.location.trim() || !editingRelationship.relationship.locationCode.trim()) {
      alert('Please enter both location and location code.');
      return;
    }
    
    const updatedRelationships = [...locationRelationships];
    updatedRelationships[editingRelationship.index] = editingRelationship.relationship;
    setLocationRelationships(updatedRelationships);
    
    setEditingRelationship(null);
  };

  const handleDeleteRelationship = (index: number) => {
    if (!user) {
      alert('You need to be authenticated to delete relationships.');
      return;
    }
    
    if (locationRelationships.length <= 1) {
      alert('You must have at least one location relationship.');
      return;
    }
    
    const updatedRelationships = [...locationRelationships];
    updatedRelationships.splice(index, 1);
    setLocationRelationships(updatedRelationships);
  };

  return (
    <div className="dark:bg-[#171717]">
      
      {/* Add new option form - only visible when authenticated */}
      {user && (
        <div className="mb-6 p-4 bg-[#0B74B0]/10 dark:bg-[#0B74B0]/20 rounded-lg">
          <h4 className="text-md font-semibold text-[#0B74B0] dark:text-[#75479C] mb-3">Add New Dropdown Option</h4>
          <div className="flex gap-2">
            <select
              value={newOption.category}
              onChange={(e) => setNewOption(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
            >
              <option value="groups">Group</option>
              <option value="ppaMerchants">PPA/Merchant</option>
              <option value="types">Type</option>
              <option value="locationCodes">Location Code</option>
              <option value="locations">Location</option>
              <option value="connectivities">Connectivity</option>
            </select>
            <input
              type="text"
              value={newOption.value}
              onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Enter new option"
              className="flex-1 px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
            />
            <button
              onClick={handleAddOption}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0B74B0] hover:bg-[#0B74B0]/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B74B0] transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
      
      {/* Location Relationships Management - only visible when authenticated */}
      {user && (
        <div className="mb-6 p-4 bg-[#75479C]/10 dark:bg-[#75479C]/20 rounded-lg">
          <h4 className="text-md font-semibold text-[#75479C] dark:text-[#75479C] mb-3">Location & Location Code Relationships</h4>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRelationship.location}
              onChange={(e) => setNewRelationship(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Location"
              className="flex-1 px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
            />
            <input
              type="text"
              value={newRelationship.locationCode}
              onChange={(e) => setNewRelationship(prev => ({ ...prev, locationCode: e.target.value }))}
              placeholder="Location Code"
              className="px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
            />
            <button
              onClick={() => {
                if (newRelationship.location && newRelationship.locationCode) {
                  setLocationRelationships(prev => [...prev, newRelationship]);
                  setNewRelationship({ location: '', locationCode: '' });
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-[#75479C] hover:bg-[#75479C]/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75479C] transition-colors"
            >
              Add
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location Code</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {locationRelationships.map((relationship, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {editingRelationship?.index === index ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingRelationship.relationship.location}
                            onChange={(e) => setEditingRelationship({
                              ...editingRelationship,
                              relationship: {
                                ...editingRelationship.relationship,
                                location: e.target.value
                              }
                            })}
                            className="w-full px-2 py-1 text-sm rounded border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={editingRelationship.relationship.locationCode}
                            onChange={(e) => setEditingRelationship({
                              ...editingRelationship,
                              relationship: {
                                ...editingRelationship.relationship,
                                locationCode: e.target.value
                              }
                            })}
                            className="w-full px-2 py-1 text-sm rounded border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white"
                          >
                            <option value="">Select Location Code</option>
                            {dropdownOptions.locationCodes.map(code => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={handleEditRelationship}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRelationship(null)}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-gray-300">
                          {relationship.location}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-gray-300">
                          {relationship.locationCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setEditingRelationship({index, relationship})}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRelationship(index)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Dropdown options management */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-foreground dark:text-white">Dropdown Options Management</h4>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user ? "Click edit/delete to modify options" : "Login to edit options"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Object.entries(dropdownOptions).map(([category, options]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h5 className="font-semibold text-foreground dark:text-white capitalize flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l-1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h5>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Options ({(options as string[]).length})
                  </span>
                </div>
                {(options as string[]).length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    {(options as string[]).map((option: string, index: number) => (
                      <li key={index} className="flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        {editingOption?.category === category && editingOption?.index === index ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingOption.value}
                              onChange={(e) => setEditingOption && setEditingOption({...editingOption, value: e.target.value})}
                              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={handleEditOption}
                                className="px-2.5 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                                title="Save"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingOption && setEditingOption(null)}
                                className="px-2.5 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                                title="Cancel"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <span className="text-foreground dark:text-gray-300 text-sm font-medium truncate max-w-[180px]">{option}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {user ? (
                                <>
                                  <button
                                    onClick={() => setEditingOption && setEditingOption({category: category as keyof DropdownOptions, index, value: option})}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOption && handleDeleteOption(category as keyof DropdownOptions, index)}
                                    className={`px-2 py-1 text-xs text-white rounded hover:bg-red-600 transition-colors flex items-center ${
                                      (options as string[]).length <= 1 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-red-500'
                                    }`}
                                    title="Delete"
                                    disabled={(options as string[]).length <= 1}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">Login to edit</span>
                              )}
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <p className="text-sm">No options available</p>
                    {user && (
                      <p className="text-xs mt-1 text-gray-400">Add options using the form above</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Removed the table display as requested */}
    </div>
  );
}