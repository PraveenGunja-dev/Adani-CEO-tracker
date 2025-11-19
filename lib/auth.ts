import { db } from './sqlite';
import bcrypt from 'bcrypt';

// Users table is initialized in lib/sqlite.ts

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export async function createUser(username: string, email: string, password: string) {
  // Check if user already exists
  const existingUser = await db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);

  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into database
  const result = await db.run(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );

  return {
    id: result.lastID,
    username,
    email,
    password: hashedPassword,
    createdAt: new Date()
  };
}

export async function authenticateUser(email: string, password: string) {
  // Find user by email
  const user: any = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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
  const user: any = await db.get('SELECT * FROM users WHERE id = ?', [id]);

  if (!user) {
    throw new Error('User not found');
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}