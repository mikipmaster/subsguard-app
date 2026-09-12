import { Router } from 'express';
import authRoutes from './auth.routes';
import subscriptionsRoutes from './subscriptions.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/analytics', analyticsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint
router.get('/debug/subscriptions-count', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const count = await mongoose.connection.db.collection('subscriptions').countDocuments();
    const allDocs = await mongoose.connection.db.collection('subscriptions').find({}).toArray();
    res.json({ 
      count, 
      dbName: mongoose.connection.db.databaseName,
      docs: allDocs 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
