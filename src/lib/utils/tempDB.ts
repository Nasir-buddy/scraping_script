import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI_TEMP;
if (!MONGODB_URI) throw new Error('Please define the MONGODB_URI environment variable');
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose;
  }
  if (!MONGODB_URI) throw new Error('Please define the MONGODB_URI environment variable');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: 'dataCaptureDatabase' });
  console.log('MongoDB connected');
  return mongoose;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}
