/**
 * Main Express Server Entry Point
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Import database
import { initDatabase } from './utils/database';

// Import routes
import settingsRoutes from './routes/settings';
import jiraRoutes from './routes/jira';
import templatesRoutes from './routes/templates';
import testplanRoutes from './routes/testplan';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite default dev server
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Static files (templates)
app.use('/templates', express.static(path.join(process.cwd(), 'templates')));

// API Routes
app.use('/api/settings', settingsRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/testplan', testplanRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  - Settings: http://localhost:${PORT}/api/settings`);
      console.log(`  - JIRA: http://localhost:${PORT}/api/jira`);
      console.log(`  - Templates: http://localhost:${PORT}/api/templates`);
      console.log(`  - Test Plan: http://localhost:${PORT}/api/testplan`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
