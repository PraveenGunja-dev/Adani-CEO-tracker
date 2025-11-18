import { db } from './sqlite';

// Initialize variables table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS variables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_variables_key_user ON variables(key, user_id)
`);

export interface Variable {
  id: number;
  key: string;
  value: any;
  userId?: string; // Optional user association
  createdAt: Date;
  updatedAt: Date;
}

export async function setVariable(key: string, value: any, userId?: string) {
  const variable = {
    key,
    value: JSON.stringify(value),
    userId: userId || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Check if variable exists
  const checkStmt = db.prepare('SELECT id FROM variables WHERE key = ? AND user_id IS ?');
  const existing = checkStmt.get(key, userId || null);
  
  if (existing) {
    // Update existing variable
    const updateStmt = db.prepare(
      'UPDATE variables SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ? AND user_id IS ?'
    );
    const result = updateStmt.run(JSON.stringify(value), key, userId || null);
    return { modifiedCount: result.changes };
  } else {
    // Insert new variable
    const insertStmt = db.prepare(
      'INSERT INTO variables (key, value, user_id) VALUES (?, ?, ?)'
    );
    const result = insertStmt.run(key, JSON.stringify(value), userId || null);
    return { insertedId: result.lastInsertRowid };
  }
}

export async function getVariable(key: string, userId?: string) {
  const stmt = db.prepare('SELECT * FROM variables WHERE key = ? AND user_id IS ?');
  const variable: any = stmt.get(key, userId || null);
  
  return variable ? JSON.parse(variable.value) : null;
}

export async function deleteVariable(key: string, userId?: string) {
  const stmt = db.prepare('DELETE FROM variables WHERE key = ? AND user_id IS ?');
  const result = stmt.run(key, userId || null);
  
  return result.changes > 0;
}

export async function getAllVariables(userId?: string) {
  const stmt = db.prepare('SELECT * FROM variables WHERE user_id IS ?');
  const variables: any[] = stmt.all(userId || null);
  
  // Convert to key-value pairs
  const result: Record<string, any> = {};
  variables.forEach(variable => {
    result[variable.key] = JSON.parse(variable.value);
  });
  
  return result;
}