import { connectToDatabase } from './mongodb';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export async function createUser(username: string, email: string, password: string) {
  const { db } = await connectToDatabase();
  
  // Check if user already exists
  const existingUser = await db.collection('users').findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user object (without _id, let MongoDB generate it)
  const user = {
    username,
    email,
    password: hashedPassword,
    createdAt: new Date()
  };
  
  // Insert user into database
  const result = await db.collection('users').insertOne(user);
  return { ...user, _id: result.insertedId };
}

export async function authenticateUser(email: string, password: string) {
  const { db } = await connectToDatabase();
  
  // Find user by email
  const user = await db.collection('users').findOne({ email });
  
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
  const { db } = await connectToDatabase();
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}