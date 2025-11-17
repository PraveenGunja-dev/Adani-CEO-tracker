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
    client = new MongoClient(MONGODB_URI);
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