import express from 'express';
import dotenv from 'dotenv';
import authRoutes from '../backend/src/routes/authRoutes.ts';
import projectRoutes from '../backend/src/routes/projectRoutes.ts';
import conversationRoutes from '../backend/src/routes/conversationRoutes.ts';

dotenv.config();

const app = express();
app.use(express.json());

// API Route Declarations
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    platform: 'CodeMind AI Core', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/conversations', conversationRoutes);

export default app;
