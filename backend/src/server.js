import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Logger Middleware Pro
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes de test
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Projets
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { sections: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body;
  try {
    const project = await prisma.project.create({
      data: { name }
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
