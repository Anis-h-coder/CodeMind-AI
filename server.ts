import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import authRoutes from './backend/src/routes/authRoutes';
import projectRoutes from './backend/src/routes/projectRoutes';
import conversationRoutes from './backend/src/routes/conversationRoutes';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request parsing middleware
  app.use(express.json());

  // API Route Declarations
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      platform: 'CodeMind AI Core', 
      timestamp: new Date().toISOString() 
    });
  });

  // Business logic router groups
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/conversations', conversationRoutes);

  // Integration with Vite
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CodeMind Server] Running in DEVELOPMENT mode. Mounting Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[CodeMind Server] Running in PRODUCTION mode. Serving static artifacts...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CodeMind API] Ready. Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CodeMind Server] Startup failed with error:', err);
  process.exit(1);
});
