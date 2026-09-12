import dotenv from 'dotenv';

// LOAD ENV FIRST!
dotenv.config();

console.log('🔍 Environment check:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI preview:', process.env.MONGODB_URI?.substring(0, 50) + '...');

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.config';
import { config } from './config/app.config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { runPushNotificationsSweep } from './services/pushNotifications.service';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',  // ⚠️ Tylko do developmentu!
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    setInterval(() => {
      runPushNotificationsSweep().catch(() => null);
    }, 60_000);
    
    // Start listening
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 SubsGuard API Server Running     ║
║                                        ║
║   Port:        ${config.port}                     ║
║   Environment: ${config.nodeEnv}            ║
║   API URL:     ${config.apiUrl}  ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
