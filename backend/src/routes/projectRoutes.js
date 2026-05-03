import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// Liste des projets
router.get('/', async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Détails d'un projet
router.get('/:id', async (req, res) => {
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

// Créer un projet
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: "Missing X-User-Id" });
  
  try {
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

// Modifier un projet
router.patch('/:id', async (req, res) => {
  const { 
    name, marginTop, marginBottom, marginLeft, marginRight, 
    headerHeight, footerHeight, showSectionTitles 
  } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { 
        name,
        marginTop: marginTop !== undefined ? parseFloat(marginTop) : undefined,
        marginBottom: marginBottom !== undefined ? parseFloat(marginBottom) : undefined,
        marginLeft: marginLeft !== undefined ? parseFloat(marginLeft) : undefined,
        marginRight: marginRight !== undefined ? parseFloat(marginRight) : undefined,
        headerHeight: headerHeight !== undefined ? parseFloat(headerHeight) : undefined,
        footerHeight: footerHeight !== undefined ? parseFloat(footerHeight) : undefined,
        showSectionTitles
      }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un projet (CRUD COMPLET)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
