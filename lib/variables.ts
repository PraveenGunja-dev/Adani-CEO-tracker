import { db } from './sqlite';

// Variables table should be initialized in lib/sqlite.ts

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
  const existing = await db.get('SELECT id FROM variables WHERE key = ? AND user_id IS ?', [key, userId || null]);

  if (existing) {
    // Update existing variable
    const result = await db.run(
      'UPDATE variables SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ? AND user_id IS ?',
      [JSON.stringify(value), key, userId || null]
    );
    return { modifiedCount: result.changes };
  } else {
    // Insert new variable
    const result = await db.run(
      'INSERT INTO variables (key, value, user_id) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), userId || null]
    );
    return { insertedId: result.lastID };
  }
}

export async function getVariable(key: string, userId?: string) {
  const variable: any = await db.get('SELECT * FROM variables WHERE key = ? AND user_id IS ?', [key, userId || null]);

  return variable ? JSON.parse(variable.value) : null;
}

export async function deleteVariable(key: string, userId?: string) {
  const result = await db.run('DELETE FROM variables WHERE key = ? AND user_id IS ?', [key, userId || null]);

  return result.changes > 0;
}

export async function getAllVariables(userId?: string) {
  const variables: any[] = await db.all('SELECT * FROM variables WHERE user_id IS ?', [userId || null]);

  // Convert to key-value pairs
  const result: Record<string, any> = {};
  variables.forEach(variable => {
    result[variable.key] = JSON.parse(variable.value);
  });

  return result;
}