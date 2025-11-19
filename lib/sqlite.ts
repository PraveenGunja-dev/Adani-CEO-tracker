import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the database directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'adani-excel.db');
const sqlite = sqlite3.verbose();
const dbInstance = new sqlite.Database(dbPath);

// Helper to promisify db methods
const db = {
  get: (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
      dbInstance.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      dbInstance.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  run: (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
    return new Promise<{ lastID: number; changes: number }>((resolve, reject) => {
      dbInstance.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  exec: (sql: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      dbInstance.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
};

// Initialize the database tables
const initDb = async () => {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS table_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fiscal_year TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS dropdown_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fiscal_year TEXT NOT NULL DEFAULT 'FY_25',
        option_type TEXT NOT NULL,
        option_value TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS location_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fiscal_year TEXT NOT NULL DEFAULT 'FY_25',
        location TEXT NOT NULL,
        location_code TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_variables_key_user ON variables(key, user_id)
    `);

    // Add columns if they don't exist (manual migration)
    const safeAddColumn = async (table: string, columnDef: string) => {
      try {
        await db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
      } catch (error) {
        // Ignore error if column exists
      }
    };

    await safeAddColumn('table_data', 'version INTEGER DEFAULT 1');
    await safeAddColumn('table_data', 'is_deleted BOOLEAN DEFAULT FALSE');
    await safeAddColumn('dropdown_options', 'version INTEGER DEFAULT 1');
    await safeAddColumn('dropdown_options', 'is_deleted BOOLEAN DEFAULT FALSE');
    await safeAddColumn('location_relationships', 'version INTEGER DEFAULT 1');
    await safeAddColumn('location_relationships', 'is_deleted BOOLEAN DEFAULT FALSE');
    await safeAddColumn('dropdown_options', "fiscal_year TEXT NOT NULL DEFAULT 'FY_25'");
    await safeAddColumn('location_relationships', "fiscal_year TEXT NOT NULL DEFAULT 'FY_25'");

    // Create indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_table_data_fiscal_year ON table_data(fiscal_year)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_table_data_fiscal_year_deleted ON table_data(fiscal_year, is_deleted)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_dropdown_options_fiscal_year ON dropdown_options(fiscal_year)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_dropdown_options_type ON dropdown_options(option_type)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_dropdown_options_fiscal_year_deleted ON dropdown_options(fiscal_year, is_deleted)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_location_relationships_fiscal_year ON location_relationships(fiscal_year)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_location_relationships_fiscal_year_deleted ON location_relationships(fiscal_year, is_deleted)`);

    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
  }
};

// Start initialization
initDb();

export { db };