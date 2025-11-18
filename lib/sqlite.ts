import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the database directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'adani-excel.db');
const db = new Database(dbPath);

// Initialize the database tables with versioning and soft delete support
db.exec(`
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

db.exec(`
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

db.exec(`
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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add version and is_deleted columns to existing tables if they don't exist
try {
  db.exec(`ALTER TABLE table_data ADD COLUMN version INTEGER DEFAULT 1`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('table_data.version column already exists or error adding it');
}

try {
  db.exec(`ALTER TABLE table_data ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('table_data.is_deleted column already exists or error adding it');
}

try {
  db.exec(`ALTER TABLE dropdown_options ADD COLUMN version INTEGER DEFAULT 1`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('dropdown_options.version column already exists or error adding it');
}

try {
  db.exec(`ALTER TABLE dropdown_options ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('dropdown_options.is_deleted column already exists or error adding it');
}

try {
  db.exec(`ALTER TABLE location_relationships ADD COLUMN version INTEGER DEFAULT 1`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('location_relationships.version column already exists or error adding it');
}

try {
  db.exec(`ALTER TABLE location_relationships ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('location_relationships.is_deleted column already exists or error adding it');
}

// Add fiscal_year column to existing tables if it doesn't exist
try {
  db.exec(`ALTER TABLE dropdown_options ADD COLUMN fiscal_year TEXT NOT NULL DEFAULT 'FY_25'`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('dropdown_options.fiscal_year column already exists or error adding it');
}

try {
  db.exec(`ALTER TABLE location_relationships ADD COLUMN fiscal_year TEXT NOT NULL DEFAULT 'FY_25'`);
} catch (error) {
  // Column might already exist, ignore the error
  console.log('location_relationships.fiscal_year column already exists or error adding it');
}

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_table_data_fiscal_year ON table_data(fiscal_year)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_table_data_fiscal_year_deleted ON table_data(fiscal_year, is_deleted)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_dropdown_options_fiscal_year ON dropdown_options(fiscal_year)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_dropdown_options_type ON dropdown_options(option_type)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_dropdown_options_fiscal_year_deleted ON dropdown_options(fiscal_year, is_deleted)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_location_relationships_fiscal_year ON location_relationships(fiscal_year)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_location_relationships_fiscal_year_deleted ON location_relationships(fiscal_year, is_deleted)
`);

console.log('SQLite database initialized successfully');

export { db };