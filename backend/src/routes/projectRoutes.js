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
    if (project) console.log(`[Project] Chargement : "${project.name}"`);
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
    console.log(`[Project] Création : "${project.name}"`);
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
    console.log(`[Project] Mise à jour : "${project.name}"`);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un projet (CRUD COMPLET)
router.delete('/:id', async (req, res) => {
  try {
    const project = await prisma.project.delete({
      where: { id: req.params.id }
    });
    console.log(`[Project] Suppression : "${project.name}"`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dupliquer un projet
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        sections: {
          include: { labels: true }
        }
      }
    });

    if (!original) return res.status(404).json({ error: "Projet non trouvé" });

    const duplicatedProject = await prisma.project.create({
      data: {
        name: `${original.name} (Copie)`,
        userId: original.userId,
        marginTop: original.marginTop,
        marginBottom: original.marginBottom,
        marginLeft: original.marginLeft,
        marginRight: original.marginRight,
        headerHeight: original.headerHeight,
        footerHeight: original.footerHeight,
        showSectionTitles: original.showSectionTitles,
        sections: {
          create: original.sections.map(s => ({
            name: s.name,
            order: s.order,
            defaultWidth: s.defaultWidth,
            defaultHeight: s.defaultHeight,
            bgColor: s.bgColor,
            textColor: s.textColor,
            borderSize: s.borderSize,
            borderColor: s.borderColor,
            borderRadius: s.borderRadius,
            spacing: s.spacing,
            fontSize: s.fontSize,
            fontFamily: s.fontFamily,
            labels: {
              create: s.labels.map(l => ({
                text: l.text,
                order: l.order
              }))
            }
          }))
        }
      },
      include: {
        _count: { select: { sections: true } }
      }
    });

    console.log(`[Project] Duplication : "${duplicatedProject.name}"`);
    res.json(duplicatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
