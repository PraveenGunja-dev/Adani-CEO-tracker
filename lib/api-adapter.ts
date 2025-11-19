// API adapter to replace SQLite functionality with direct data handling
// Instead of making HTTP requests, we'll return mock data directly
const isServer = typeof window === 'undefined';

// Mock the MongoDB interface to work with direct data handling
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
                // Return mock table data directly instead of making HTTP requests
                console.log(`Finding data for fiscal year ${fiscalYear}:`, []);
                return { data: [] };
              } else if (name === 'dropdownOptions') {
                const fiscalYear = query.fiscalYear;
                // Return mock dropdown options directly instead of making HTTP requests
                const mockOptions = {
                  fiscalYear,
                  groups: ['AGEL', 'ACL'],
                  ppaMerchants: ['PPA', 'Merchant'],
                  types: ['Solar', 'Wind', 'Hybrid'],
                  locationCodes: ['Khavda', 'RJ'],
                  locations: ['Khavda', 'Baap', 'Essel'],
                  connectivities: ['CTU']
                };
                return mockOptions;
              } else if (name === 'locationRelationships') {
                const fiscalYear = query.fiscalYear;
                // Return mock location relationships directly instead of making HTTP requests
                return { 
                  fiscalYear,
                  relationships: [] 
                };
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
                return { modifiedCount: 1 };
              } else if (name === 'dropdownOptions') {
                const optionsData = update.$set;
                const fiscalYear = optionsData.fiscalYear || 'FY_25';
                return { modifiedCount: 1 };
              } else if (name === 'locationRelationships') {
                const relationships = update.$set.relationships;
                const fiscalYear = update.$set.fiscalYear || 'FY_25';
                return { modifiedCount: relationships.length };
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
                return { deletedCount: 1 };
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