import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// Empêcher Render de s'endormir (Ping toutes les 14 min)
const SELF_URL = process.env.SELF_URL;
if (SELF_URL) {
  console.log(`\x1b[36m[System] Self-ping active for: ${SELF_URL}\x1b[0m`);
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/health`);
      console.log('\x1b[90m[System] Self-ping success: Staying awake!\x1b[0m');
    } catch (e) {
      console.error('\x1b[31m[System] Self-ping error:\x1b[0m', e.message);
    }
  }, 10 * 60 * 1000);
}

app.use(cors());
app.use(express.json());

// Logger Middleware Pro (Explicite)
app.use((req, res, next) => {
  const start = Date.now();
  const userId = req.headers['x-user-id'] || 'anonymous';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    let color = '\x1b[32m'; // Vert (Success)
    if (status >= 400) color = '\x1b[33m'; // Jaune (Client Error)
    if (status >= 500) color = '\x1b[31m'; // Rouge (Server Error)

    console.log(`${color}[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${status} (${duration}ms) - User: ${userId}\x1b[0m`);
    
    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      // Masquer les données sensibles si nécessaire, ici on affiche tout pour le debug
      console.log(`  \x1b[90mBody: ${JSON.stringify(req.body, null, 2).replace(/\n/g, '\n  ')}\x1b[0m`);
    }
  });
  next();
});

// Routes de test
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Projets
app.get('/api/projects', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json([]);
  
  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { sections: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error("Erreur GET /api/projects:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body;
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: "Missing X-User-Id" });
  
  try {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });

    const project = await prisma.project.create({
      data: { name, userId }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/projects/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        sections: {
          include: { labels: true },
          orderBy: { order: 'asc' }
        }
      }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sections
app.post('/api/projects/:projectId/sections', async (req, res) => {
  const { name, defaultWidth, defaultHeight, bgColor, textColor, borderSize, borderColor, borderRadius, spacing, fontSize, fontFamily, order } = req.body;
  try {
    const section = await prisma.section.create({
      data: {
        projectId: req.params.projectId,
        name,
        defaultWidth,
        defaultHeight,
        bgColor,
        textColor,
        borderSize,
        borderColor,
        borderRadius,
        spacing,
        fontSize,
        fontFamily,
        order: order || 0
      }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/sections/:id', async (req, res) => {
  const { name, defaultWidth, defaultHeight, bgColor, textColor, borderSize, borderColor, borderRadius, spacing, fontSize, fontFamily, order } = req.body;
  try {
    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: {
        name,
        defaultWidth: defaultWidth !== undefined ? parseFloat(defaultWidth) : undefined,
        defaultHeight: defaultHeight !== undefined ? parseFloat(defaultHeight) : undefined,
        bgColor,
        textColor,
        borderSize: borderSize !== undefined ? parseFloat(borderSize) : undefined,
        borderColor,
        borderRadius: borderRadius !== undefined ? parseFloat(borderRadius) : undefined,
        spacing: spacing !== undefined ? parseFloat(spacing) : undefined,
        fontSize: fontSize !== undefined ? parseFloat(fontSize) : undefined,
        fontFamily,
        order: order !== undefined ? parseInt(order) : undefined
      }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sections/:id', async (req, res) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Étiquettes
app.post('/api/sections/:sectionId/labels', async (req, res) => {
  const { text } = req.body;
  try {
    const count = await prisma.label.count({ where: { sectionId: req.params.sectionId } });
    const label = await prisma.label.create({
      data: {
        sectionId: req.params.sectionId,
        text,
        order: count
      }
    });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/labels/:id', async (req, res) => {
  try {
    await prisma.label.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production - Servir le frontend compilé
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Rediriger toutes les autres requêtes vers l'app React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
