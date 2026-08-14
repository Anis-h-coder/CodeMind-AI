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

// API Route Declarations (support both /api/ prefix and stripped routes)
app.get(['/api/health', '/health'], (req, res) => {
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

// Global Error Handler for Vercel Serverless Functions
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[CodeMind API Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'Database connection or server error occurred on Vercel.'
    }
  });
});

export default app;
