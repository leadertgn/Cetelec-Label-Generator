import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// Créer une section
router.post('/projects/:projectId/sections', async (req, res) => {
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
    console.log(`[Section] Création : "${section.name}"`);
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier une section
router.patch('/:id', async (req, res) => {
  const { name, defaultWidth, defaultHeight, bgColor, textColor, borderSize, borderColor, borderRadius, spacing, fontSize, fontFamily, order } = req.body;
  try {
    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: { 
        name, defaultWidth: defaultWidth !== undefined ? parseFloat(defaultWidth) : undefined, defaultHeight: defaultHeight !== undefined ? parseFloat(defaultHeight) : undefined,
        bgColor, textColor, borderSize: borderSize !== undefined ? parseFloat(borderSize) : undefined, borderColor,
        borderRadius: borderRadius !== undefined ? parseFloat(borderRadius) : undefined, spacing: spacing !== undefined ? parseFloat(spacing) : undefined,
        fontSize: fontSize !== undefined ? parseFloat(fontSize) : undefined, fontFamily, order: order !== undefined ? parseInt(order) : undefined
      }
    });
    console.log(`[Section] Mise à jour : "${section.name}"`);
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une section
router.delete('/:id', async (req, res) => {
  try {
    const section = await prisma.section.delete({ where: { id: req.params.id } });
    console.log(`[Section] Suppression : "${section.name}"`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dupliquer une section
router.post('/:id/duplicate', async (req, res) => {
  try {
    const s = await prisma.section.findUnique({
      where: { id: req.params.id },
      include: { labels: true }
    });

    if (!s) return res.status(404).json({ error: "Section non trouvée" });

    const baseName = s.name.replace(/_\d+$/, "");
    const existingSections = await prisma.section.findMany({
      where: { 
        projectId: s.projectId,
        name: { startsWith: baseName }
      }
    });

    // Échapper les caractères spéciaux pour le Regex
    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    let maxNum = 0;
    existingSections.forEach(sec => {
      const match = sec.name.match(new RegExp(`^${escapedBaseName}_(\\d+)$`));
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    
    let newName = `${baseName}_${maxNum + 1}`;

    // Vérification de sécurité supplémentaire pour éviter les doublons
    let isUnique = false;
    let counter = maxNum + 1;
    while (!isUnique) {
      const collision = await prisma.section.findFirst({
        where: { projectId: s.projectId, name: newName }
      });
      if (collision) {
        counter++;
        newName = `${baseName}_${counter}`;
      } else {
        isUnique = true;
      }
    }

    const newSection = await prisma.section.create({
      data: {
        projectId: s.projectId,
        name: newName,
        order: s.order + 1,
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
      },
      include: { labels: true }
    });
    console.log(`[Section] Duplication : "${s.name}" -> "${newName}"`);
    res.json(newSection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
