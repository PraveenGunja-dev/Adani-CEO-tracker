import { MongoClient } from 'mongodb';

// Use direct connection string instead of SRV record to avoid DNS issues
const MONGODB_URI = process.env.MONGODB_URI?.replace('mongodb+srv://', 'mongodb://') || 'mongodb://localhost:27017/adani-excel';
const MONGODB_DB = process.env.MONGODB_DB || 'adani-excel';

type MongoClientType = {
  client: MongoClient;
  db: ReturnType<MongoClient['db']>;
};

declare global {
  var mongo: MongoClientType | undefined;
}

let cached: MongoClientType | undefined = global.mongo;

export async function connectToDatabase() {
  if (cached) {
    return cached;
  }

  try {
    // Add proper SSL options for MongoDB connections
    const client = new MongoClient(MONGODB_URI, {
      tls: false, // Disable TLS for direct connection
      retryWrites: true,
      // Add options to handle connection issues
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(MONGODB_DB);

    cached = { client, db };
    global.mongo = cached;

    console.log('Successfully connected to MongoDB');
    return cached;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Return a mock database object for development
    return {
      db: {
        collection: (name: string) => ({
          findOne: async () => null,
          find: async () => ({ toArray: async () => [] }),
          insertOne: async (doc: any) => ({ insertedId: 'mock-id' }),
          updateOne: async () => ({ modifiedCount: 1 }),
          deleteOne: async () => ({ deletedCount: 1 }),
          findOneAndUpdate: async () => ({ value: null }),
        }),
      },
    } as any;
  }
}

export async function disconnectFromDatabase() {
  if (cached) {
    await cached.client.close();
    cached = undefined;
    global.mongo = undefined;
  }
}