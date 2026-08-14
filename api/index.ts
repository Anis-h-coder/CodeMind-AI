import express from 'express';
import dotenv from 'dotenv';
import authRoutes from '../backend/src/routes/authRoutes';
import projectRoutes from '../backend/src/routes/projectRoutes';
import conversationRoutes from '../backend/src/routes/conversationRoutes';

dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware to normalize URL paths for Vercel rewrites
app.use((req, res, next) => {
  console.log(`[CodeMind API] Request: ${req.method} ${req.url}`);
  next();
});

// API Route Declarations (support both /api/ prefix and stripped routes)
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  res.json({ 
    status: 'healthy', 
    platform: 'CodeMind AI Core', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/projects', projectRoutes);
app.use('/projects', projectRoutes);

app.use('/api/conversations', conversationRoutes);
app.use('/conversations', conversationRoutes);

// Catch-all 404 handler for API routes
app.use((req, res) => {
  console.warn(`[CodeMind API] Unmatched route: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint ${req.method} ${req.url} not found.`
    }
  });
});

// Global Error Handler for Vercel Serverless Functions
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[CodeMind API Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err?.message || 'Database connection or server error occurred on Vercel.'
    }
  });
});

export default app;
