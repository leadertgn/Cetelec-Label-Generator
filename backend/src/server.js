import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import projectRoutes from './routes/projectRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import labelRoutes from './routes/labelRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const userId = req.headers['x-user-id'] || 'anonymous';
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms) - User: ${userId}`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/sections', labelRoutes); // Label routes are also prefixed with /api/sections for convenience

// Production - Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Self-ping to stay awake on Render
const SELF_URL = process.env.SELF_URL;
if (SELF_URL) {
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/health`);
    } catch (e) {
      console.error('Self-ping failed', e.message);
    }
  }, 10 * 60 * 1000);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
