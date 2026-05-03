import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// Créer une étiquette
router.post('/:sectionId/labels', async (req, res) => {
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

// Supprimer une étiquette
router.delete('/labels/:id', async (req, res) => {
  try {
    await prisma.label.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier une étiquette
router.patch('/labels/:id', async (req, res) => {
  const { text } = req.body;
  try {
    const label = await prisma.label.update({
      where: { id: req.params.id },
      data: { text }
    });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Génération groupée
router.post('/:sectionId/batch', async (req, res) => {
  const { type, count, prefix, start, end, suffix, text } = req.body;
  try {
    const labelsData = [];
    const baseOrder = await prisma.label.count({ where: { sectionId: req.params.sectionId } });

    if (type === 'count') {
      for (let i = 0; i < parseInt(count); i++) {
        labelsData.push({
          sectionId: req.params.sectionId,
          text: text || "Étiquette",
          order: baseOrder + i
        });
      }
    } else if (type === 'sequence') {
      const s = parseInt(start);
      const e = parseInt(end);
      let i = 0;
      for (let val = s; val <= e; val++) {
        labelsData.push({
          sectionId: req.params.sectionId,
          text: `${prefix || ''}${val}${suffix || ''}`,
          order: baseOrder + i
        });
        i++;
      }
    }

    if (labelsData.length > 0) {
      await prisma.label.createMany({ data: labelsData });
    }

    res.json({ success: true, count: labelsData.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
