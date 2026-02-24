import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import progressReportRoutes from './routes/progressReportRoutes.js';
import sprintsRoutes from './routes/sprintsRoutes.js';

dotenv.config();

const app = express();

connectDB().catch(err => {
  console.warn('Database initialization warning:', err.message);
});

app.use(helmet());

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://krisban.vercel.app',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes - with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress-reports', progressReportRoutes);
app.use('/api/sprints', sprintsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KrisBan Backend is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KrisBan Backend API',
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

export default app;
