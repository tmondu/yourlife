import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRouter from './routes/auth';
import entriesRouter from './routes/entries';
import uploadRouter from './routes/upload';
import pushRouter from './routes/push';
import { setupCronJobs } from './cron';

const app = express();

// Middleware
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/push', pushRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import fs from 'fs';

// Serve React build if available
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../client/dist'),
];

const distPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  console.log(`📦 Serving frontend from: ${distPath}`);
  app.use(express.static(distPath));
  
  // Handle React Router SPA fallback (Express 5 compatible)
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('⚠️ Frontend dist directory not found. Running in API-only mode.');
}

// Start server
const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  console.log(`🚀 YourLife server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  setupCronJobs();
});

export default app;
