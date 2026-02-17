import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './config/db.config';
import mongoose from 'mongoose';

// Import your Subscription model
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'PLN' },
  billingCycle: { type: String, enum: ['MONTHLY', 'YEARLY'], required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'CANCELLED', 'PAUSED'], default: 'ACTIVE' },
  nextBillingDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

// Test user ID (same as in controller)
const TEST_USER_ID = '507f1f77bcf86cd799439011';

// Sample subscriptions
const sampleSubscriptions = [
  {
    userId: TEST_USER_ID,
    name: 'Netflix',
    price: 49.99,
    currency: 'PLN',
    billingCycle: 'MONTHLY',
    category: 'STREAMING',
    status: 'ACTIVE',
    nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // za 5 dni
  },
  {
    userId: TEST_USER_ID,
    name: 'Spotify',
    price: 19.99,
    currency: 'PLN',
    billingCycle: 'MONTHLY',
    category: 'MUSIC',
    status: 'ACTIVE',
    nextBillingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // za 10 dni
  },
  {
    userId: TEST_USER_ID,
    name: 'ChatGPT Plus',
    price: 89,
    currency: 'PLN',
    billingCycle: 'MONTHLY',
    category: 'SAAS',
    status: 'ACTIVE',
    nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // za 3 dni (urgent!)
  },
  {
    userId: TEST_USER_ID,
    name: 'iCloud Storage',
    price: 13.99,
    currency: 'PLN',
    billingCycle: 'MONTHLY',
    category: 'CLOUD_STORAGE',
    status: 'ACTIVE',
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // za 15 dni
  },
  {
    userId: TEST_USER_ID,
    name: 'Adobe Creative Cloud',
    price: 199.99,
    currency: 'PLN',
    billingCycle: 'MONTHLY',
    category: 'SAAS',
    status: 'ACTIVE',
    nextBillingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // za 20 dni
  },
];

async function seed() {
  try {
    console.log('🌱 Starting seed...');
    
    // Connect to database
    await connectDatabase();
    
    // Clear existing subscriptions for test user
    const deletedCount = await Subscription.deleteMany({ userId: TEST_USER_ID });
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing subscriptions`);
    
    // Insert sample subscriptions
    const inserted = await Subscription.insertMany(sampleSubscriptions);
    console.log(`✅ Inserted ${inserted.length} subscriptions:`);
    
    inserted.forEach((sub) => {
      console.log(`   - ${sub.name}: ${sub.price} ${sub.currency}/${sub.billingCycle}`);
    });
    
    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
