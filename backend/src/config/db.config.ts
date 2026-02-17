import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/subsguard';

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'subsguard' // ← DODAJ TO! Wymusza nazwę bazy
    });
    console.log('✅ MongoDB connected successfully to database: subsguard');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}
