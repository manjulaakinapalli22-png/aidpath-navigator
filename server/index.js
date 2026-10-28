import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { testSupabaseConnection } from './config/supabase.js';
import { resolveUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import scholarshipRoutes from './routes/scholarshipRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import checklistRoutes from './routes/checklistRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Attach identity / persona resolution
app.use(resolveUser);

// API Health Check
app.get('/api/health', async (req, res) => {
  const dbHealth = await testSupabaseConnection();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Scholarship Eligibility and Application Deadline Navigator',
    database: {
      supabase_configured: Boolean(config.supabaseUrl && (config.supabaseServiceKey || config.supabaseKey)),
      supabase_connected: dbHealth.connected,
      message: dbHealth.message,
      mode: dbHealth.connected ? 'Supabase Cloud PostgreSQL' : 'Integrated Fallback Data Store',
    },
    version: '1.0.0',
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/metrics', metricsRoutes);

// Static files
app.use(express.static(path.join(rootDir, 'public')));

// SPA Fallback for client-side navigation
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`================================================================`);
    console.log(`🎓 Scholarship Eligibility & Application Deadline Navigator`);
    console.log(`🚀 Server listening at http://localhost:${config.port}`);
    console.log(`📁 Static files served from: ${path.join(rootDir, 'public')}`);
    console.log(`================================================================`);
  });
}

export default app;
