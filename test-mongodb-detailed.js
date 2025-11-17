const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adani-excel';
const MONGODB_DB = process.env.MONGODB_DB || 'adani-excel';

console.log('Connecting to MongoDB with URI:', MONGODB_URI);
console.log('Using database:', MONGODB_DB);

async function testConnection() {
  let client;
  
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Add proper SSL options for MongoDB connections
    client = new MongoClient(MONGODB_URI, {
      tls: true,
      retryWrites: true,
      // Add options to handle connection issues
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // SSL options for MongoDB Atlas
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });
    
    console.log('MongoClient created, attempting connection...');
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const db = client.db(MONGODB_DB);
    console.log('Database selected:', MONGODB_DB);
    
    const stats = await db.command({ ping: 1 });
    console.log('Ping result:', stats);
    
    if (stats.ok === 1) {
      console.log('MongoDB ping successful');
    } else {
      console.log('MongoDB ping failed');
    }
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Error connecting to MongoDB:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('Disconnected from MongoDB');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError.message);
      }
    }
  }
}

testConnection();