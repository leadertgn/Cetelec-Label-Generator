import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        sections: {
          include: { labels: true }
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
  const { name, defaultWidth, defaultHeight, bgColor, textColor, borderSize, borderColor, borderRadius, spacing } = req.body;
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
        spacing
      }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Étiquettes
app.post('/api/sections/:sectionId/labels', async (req, res) => {
  const { text } = req.body;
  try {
    const label = await prisma.label.create({
      data: {
        sectionId: req.params.sectionId,
        text
      }
    });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
