import mongoose from "mongoose";

/** Database name is fixed so local and Atlas URIs behave the same whether or not they include a path. */
export const DB_NAME = "jehan_nexus_hub";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { __mongoose?: MongooseCache };
const cache: MongooseCache = (globalForMongoose.__mongoose ??= { conn: null, promise: null });

/**
 * Returns a shared Mongoose connection. The promise is cached on `globalThis` so hot reloads in
 * development and warm serverless invocations reuse the same connection pool.
 */
export async function connectDB(uri = process.env.MONGODB_URI): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!uri) throw new Error("MONGODB_URI is not set");

  cache.promise ??= mongoose.connect(uri, {
    dbName: DB_NAME,
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
