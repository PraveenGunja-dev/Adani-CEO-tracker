import { db } from './sqlite';
import bcrypt from 'bcrypt';

// Initialize users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export async function createUser(username: string, email: string, password: string) {
  // Check if user already exists
  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?');
  const existingUser = checkStmt.get(email, username);
  
  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert user into database
  const insertStmt = db.prepare(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
  );
  const result = insertStmt.run(username, email, hashedPassword);
  
  return {
    id: result.lastInsertRowid as number,
    username,
    email,
    password: hashedPassword,
    createdAt: new Date()
  };
}

export async function authenticateUser(email: string, password: string) {
  // Find user by email
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user: any = stmt.get(email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check password
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(id: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user: any = stmt.get(id);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}