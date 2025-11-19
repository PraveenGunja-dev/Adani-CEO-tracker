import { db } from './sqlite';

// Mock the MongoDB interface to work with SQLite
export async function connectToDatabase() {
  return {
    db: {
      collection: (name: string) => {
        return {
          // Find one document by query
          findOne: async (query: any) => {
            if (name === 'tableData') {
              const fiscalYear = query.fiscalYear;
              // Only select non-deleted records
              const stmt = db.prepare('SELECT * FROM table_data WHERE fiscal_year = ? AND is_deleted = FALSE');
              const result: any = stmt.get(fiscalYear);
              console.log(`Finding data for fiscal year ${fiscalYear}:`, result);
              return result ? { ...result, data: JSON.parse(result.data) } : null;
            } else if (name === 'dropdownOptions') {
              const fiscalYear = query.fiscalYear;
              // Only select non-deleted records
              const stmt = db.prepare('SELECT * FROM dropdown_options WHERE fiscal_year = ? AND is_deleted = FALSE');
              const results: any[] = stmt.all(fiscalYear);
              
              if (results.length > 0) {
                // Combine all options into a single object
                const options: any = {
                  groups: [],
                  ppaMerchants: [],
                  types: [],
                  locationCodes: [],
                  locations: [],
                  connectivities: []
                };
                
                results.forEach(row => {
                  if (options[row.option_type]) {
                    options[row.option_type].push(row.option_value);
                  }
                });
                
                return options;
              }
              return null;
            } else if (name === 'locationRelationships') {
              const fiscalYear = query.fiscalYear;
              // Only select non-deleted records
              const stmt = db.prepare('SELECT * FROM location_relationships WHERE fiscal_year = ? AND is_deleted = FALSE');
              const results: any[] = stmt.all(fiscalYear);
              
              if (results.length > 0) {
                return { relationships: results.map(row => ({
                  location: row.location,
                  locationCode: row.location_code
                })) };
              }
              return null;
            }
            return null;
          },
          
          // Update or insert a document with versioning
          updateOne: async (filter: any, update: any, options: any) => {
            if (name === 'tableData') {
              const fiscalYear = filter.fiscalYear;
              const data = update.$set.data;
              const jsonData = JSON.stringify(data);
              
              console.log(`Updating table data for fiscal year ${fiscalYear} with data:`, data);
              
              // Check if record exists (and is not deleted)
              const checkStmt = db.prepare('SELECT id, version FROM table_data WHERE fiscal_year = ? AND is_deleted = FALSE');
              const existing = checkStmt.get(fiscalYear);
              
              console.log(`Existing record for ${fiscalYear}:`, existing);
              
              if (existing) {
                // Update existing record with version increment
                const updateStmt = db.prepare(
                  'UPDATE table_data SET data = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE fiscal_year = ? AND is_deleted = FALSE'
                );
                const result = updateStmt.run(jsonData, fiscalYear);
                console.log(`Updated existing record for ${fiscalYear}. Changes: ${result.changes}`);
                return { modifiedCount: result.changes };
              } else {
                // Insert new record with version 1
                const insertStmt = db.prepare(
                  'INSERT INTO table_data (fiscal_year, data, version) VALUES (?, ?, 1)'
                );
                const result = insertStmt.run(fiscalYear, jsonData);
                console.log(`Inserted new record for ${fiscalYear}. Changes: ${result.changes}`);
                return { upsertedCount: result.changes };
              }
            } else if (name === 'dropdownOptions') {
              // For dropdown options, we need to store them separately for each fiscal year
              // First, mark existing options as deleted (soft delete)
              db.prepare('UPDATE dropdown_options SET is_deleted = TRUE, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE fiscal_year = ?').run(update.$set.fiscalYear);
              
              // Insert new options for this fiscal year
              const options = update.$set;
              let changes = 0;
              
              Object.keys(options).forEach(key => {
                if (Array.isArray(options[key]) && key !== 'fiscalYear') {
                  options[key].forEach((value: string) => {
                    const stmt = db.prepare(
                      'INSERT INTO dropdown_options (fiscal_year, option_type, option_value, version) VALUES (?, ?, ?, 1)'
                    );
                    const result = stmt.run(update.$set.fiscalYear, key, value);
                    changes += result.changes;
                  });
                }
              });
              
              return { modifiedCount: changes };
            } else if (name === 'locationRelationships') {
              // For location relationships, we need to store them separately for each fiscal year
              // First, mark existing relationships as deleted (soft delete)
              db.prepare('UPDATE location_relationships SET is_deleted = TRUE, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE fiscal_year = ?').run(update.$set.fiscalYear);
              
              // Insert new relationships for this fiscal year
              const relationships = update.$set.relationships;
              let changes = 0;
              
              if (Array.isArray(relationships)) {
                relationships.forEach((rel: any) => {
                  const stmt = db.prepare(
                    'INSERT INTO location_relationships (fiscal_year, location, location_code, version) VALUES (?, ?, ?, 1)'
                  );
                  const result = stmt.run(update.$set.fiscalYear, rel.location, rel.locationCode);
                  changes += result.changes;
                });
              }
              
              return { modifiedCount: changes };
            }
            return { modifiedCount: 0 };
          },
          
          // Soft delete one document (mark as deleted instead of removing)
          deleteOne: async (filter: any) => {
            if (name === 'tableData') {
              const fiscalYear = filter.fiscalYear;
              // Soft delete - mark as deleted instead of removing
              const stmt = db.prepare('UPDATE table_data SET is_deleted = TRUE, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE fiscal_year = ?');
              const result = stmt.run(fiscalYear);
              return { deletedCount: result.changes };
            }
            return { deletedCount: 0 };
          },
          
          // Insert one document
          insertOne: async (doc: any) => {
            if (name === 'users') {
              const { username, email, password, createdAt } = doc;
              const stmt = db.prepare(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
              );
              const result = stmt.run(username, email, password);
              return { insertedId: result.lastInsertRowid };
            }
            return { insertedId: null };
          }
        };
      }
    }
  };
}

// Mock disconnect function (SQLite doesn't need explicit disconnection)
export async function disconnectFromDatabase() {
  // SQLite connections are managed automatically
  return Promise.resolve();
}