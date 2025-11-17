import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface Variable {
  _id?: ObjectId;
  key: string;
  value: any;
  userId?: string; // Optional user association
  createdAt: Date;
  updatedAt: Date;
}

export async function setVariable(key: string, value: any, userId?: string) {
  const { db } = await connectToDatabase();
  
  const variable = {
    key,
    value,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Upsert the variable (update if exists, insert if not)
  const result = await db.collection('variables').findOneAndUpdate(
    { key, userId: userId || null }, // Find by key and user (or null for global)
    { $set: variable },
    { upsert: true, returnDocument: 'after' }
  );
  
  return result;
}

export async function getVariable(key: string, userId?: string) {
  const { db } = await connectToDatabase();
  
  const variable = await db.collection('variables').findOne({ 
    key, 
    userId: userId || null 
  });
  
  return variable ? variable.value : null;
}

export async function deleteVariable(key: string, userId?: string) {
  const { db } = await connectToDatabase();
  
  const result = await db.collection('variables').deleteOne({ 
    key, 
    userId: userId || null 
  });
  
  return result.deletedCount > 0;
}

export async function getAllVariables(userId?: string) {
  const { db } = await connectToDatabase();
  
  const variables = await db.collection('variables').find({ 
    userId: userId || null 
  }).toArray();
  
  // Convert to key-value pairs
  const result: Record<string, any> = {};
  variables.forEach(variable => {
    result[variable.key] = variable.value;
  });
  
  return result;
}