import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adani-excel';
const MONGODB_DB = process.env.MONGODB_DB || 'adani-excel';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

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

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cached = { client, db };
  global.mongo = cached;

  return cached;
}

export async function disconnectFromDatabase() {
  if (cached) {
    await cached.client.close();
    cached = undefined;
    global.mongo = undefined;
  }
}