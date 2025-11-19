// API adapter to replace SQLite functionality with calls to FastAPI backend
// Use relative URLs for API calls which will be proxied to the FastAPI backend
const API_BASE_URL = '';

// Mock the MongoDB interface to work with API calls
export async function connectToDatabase() {
  return {
    db: {
      collection: (name: string) => {
        return {
          // Find one document by query
          findOne: async (query: any) => {
            try {
              if (name === 'tableData') {
                const fiscalYear = query.fiscalYear;
                const response = await fetch(`${API_BASE_URL}/api/table-data?fiscalYear=${encodeURIComponent(fiscalYear)}`);
                if (response.ok) {
                  const result = await response.json();
                  console.log(`Finding data for fiscal year ${fiscalYear}:`, result);
                  return result.data ? { data: result.data } : null;
                } else {
                  console.error(`Error fetching table data for fiscal year ${fiscalYear}:`, response.status, response.statusText);
                  return null;
                }
              } else if (name === 'dropdownOptions') {
                const fiscalYear = query.fiscalYear;
                const response = await fetch(`${API_BASE_URL}/api/dropdown-options?fiscalYear=${encodeURIComponent(fiscalYear)}`);
                if (response.ok) {
                  const result = await response.json();
                  return result;
                } else {
                  console.error(`Error fetching dropdown options for fiscal year ${fiscalYear}:`, response.status, response.statusText);
                  return null;
                }
              } else if (name === 'locationRelationships') {
                const fiscalYear = query.fiscalYear;
                const response = await fetch(`${API_BASE_URL}/api/location-relationships?fiscalYear=${encodeURIComponent(fiscalYear)}`);
                if (response.ok) {
                  const result = await response.json();
                  return { relationships: result };
                } else {
                  console.error(`Error fetching location relationships for fiscal year ${fiscalYear}:`, response.status, response.statusText);
                  return null;
                }
              }
              return null;
            } catch (error) {
              console.error(`Error in findOne for ${name}:`, error);
              return null;
            }
          },

          // Update or insert a document with versioning
          updateOne: async (filter: any, update: any, options: any) => {
            try {
              if (name === 'tableData') {
                const fiscalYear = filter.fiscalYear;
                const data = update.$set.data;
                
                console.log(`Updating table data for fiscal year ${fiscalYear} with data:`, data);

                const response = await fetch(`${API_BASE_URL}/api/table-data`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ fiscalYear, data }),
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log(`Updated table data for fiscal year ${fiscalYear}:`, result);
                  return { modifiedCount: 1 };
                } else {
                  console.error(`Error updating table data for fiscal year ${fiscalYear}:`, response.status, response.statusText);
                  throw new Error(`Failed to update table data: ${response.statusText}`);
                }
              } else if (name === 'dropdownOptions') {
                const optionsData = update.$set;
                const fiscalYear = optionsData.fiscalYear || 'FY_25';

                const response = await fetch(`${API_BASE_URL}/api/dropdown-options`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(optionsData),
                });

                if (response.ok) {
                  const result = await response.json();
                  return { modifiedCount: 1 };
                } else {
                  console.error(`Error updating dropdown options:`, response.status, response.statusText);
                  throw new Error(`Failed to update dropdown options: ${response.statusText}`);
                }
              } else if (name === 'locationRelationships') {
                const relationships = update.$set.relationships;
                const fiscalYear = update.$set.fiscalYear || 'FY_25';

                const response = await fetch(`${API_BASE_URL}/api/location-relationships`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(relationships),
                });

                if (response.ok) {
                  const result = await response.json();
                  return { modifiedCount: relationships.length };
                } else {
                  console.error(`Error updating location relationships:`, response.status, response.statusText);
                  throw new Error(`Failed to update location relationships: ${response.statusText}`);
                }
              }
              return { modifiedCount: 0 };
            } catch (error) {
              console.error(`Error in updateOne for ${name}:`, error);
              throw error;
            }
          },

          // Soft delete one document (mark as deleted instead of removing)
          deleteOne: async (filter: any) => {
            try {
              if (name === 'tableData') {
                const fiscalYear = filter.fiscalYear;
                const response = await fetch(`${API_BASE_URL}/api/table-data?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
                  method: 'DELETE',
                });

                if (response.ok) {
                  const result = await response.json();
                  return { deletedCount: 1 };
                } else {
                  console.error(`Error deleting table data for fiscal year ${fiscalYear}:`, response.status, response.statusText);
                  return { deletedCount: 0 };
                }
              }
              return { deletedCount: 0 };
            } catch (error) {
              console.error(`Error in deleteOne for ${name}:`, error);
              return { deletedCount: 0 };
            }
          },

          // Insert one document
          insertOne: async (doc: any) => {
            // For now, we'll just return a mock result
            // In a real implementation, you would implement the specific API calls needed
            return { insertedId: null };
          }
        };
      }
    }
  };
}

// Mock disconnect function (API connections don't need explicit disconnection)
export async function disconnectFromDatabase() {
  // API connections are stateless
  return Promise.resolve();
}