const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Use direct connection string instead of SRV record to avoid DNS issues
const MONGODB_URI = process.env.MONGODB_URI?.replace('mongodb+srv://', 'mongodb://') || 'mongodb://localhost:27017/adani-excel';
const MONGODB_DB = process.env.MONGODB_DB || 'adani-excel';

console.log('Connecting to MongoDB with URI:', MONGODB_URI);
console.log('Using database:', MONGODB_DB);

async function testConnection() {
  let client;
  
  try {
    // Add proper SSL options for MongoDB connections
    client = new MongoClient(MONGODB_URI, {
      tls: false, // Disable TLS for direct connection
      retryWrites: true,
      // Add options to handle connection issues
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const stats = await db.command({ ping: 1 });
    
    if (stats.ok === 1) {
      console.log('MongoDB ping successful');
    } else {
      console.log('MongoDB ping failed');
    }
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

testConnection();