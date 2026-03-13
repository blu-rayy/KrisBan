import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import progressReportRoutes from './routes/progressReportRoutes.js';
import sprintsRoutes from './routes/sprintsRoutes.js';
import weeklyReportRoutes from './routes/weeklyReportRoutes.js';
import emailsCrmRoutes from './routes/emailsCrmRoutes.js';
import kanbanRoutes from './routes/kanbanRoutes.js';
import { startWeeklyReportScheduler } from './utils/weeklyReportScheduler.js';

// Load environment variables
dotenv.config();

const app = express();

// Connect to database
connectDB();
startWeeklyReportScheduler();

// Middleware
app.use(helmet());

// CORS configuration - allow local dev and all trusted Vercel deployments
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'https://krisban.vercel.app',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests (curl, health checks)
  if (allowedOrigins.has(origin)) return true;
  return /\.vercel\.app$/i.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress-reports', progressReportRoutes);
app.use('/api/sprints', sprintsRoutes);
app.use('/api/weekly-reports', weeklyReportRoutes);
app.use('/api/emails-crm', emailsCrmRoutes);
app.use('/api/kanban', kanbanRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PM-Suite Backend is running',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PM-Suite Backend running on http://localhost:${PORT}`);
  console.log(`📝 API Health: http://localhost:${PORT}/api/health`);
});
