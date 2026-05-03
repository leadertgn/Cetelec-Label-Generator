import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Convertit les dates d'un objet du format "YYYY-MM-DD HH:MM:SS.mmm" vers ISO-8601
function fixDates(obj) {
  const dateFields = ['createdAt', 'updatedAt'];
  for (const field of dateFields) {
    if (obj[field] && typeof obj[field] === 'string') {
      // Remplacer l'espace par 'T' et ajouter 'Z' si pas de fuseau
      let fixed = obj[field].replace(' ', 'T');
      if (!fixed.endsWith('Z') && !fixed.includes('+')) {
        fixed += 'Z';
      }
      obj[field] = fixed;
    }
  }
  return obj;
}

async function importData() {
  try {
    const backupDir = path.join(__dirname, '../backup');
    
    const files = {
      users: path.join(backupDir, 'users.json'),
      projects: path.join(backupDir, 'projects.json'),
      sections: path.join(backupDir, 'sections.json'),
      labels: path.join(backupDir, 'labels.json')
    };

    // Vérification
    for (const [key, filepath] of Object.entries(files)) {
      if (!fs.existsSync(filepath)) {
        throw new Error(`Fichier non trouvé : ${filepath}`);
      }
    }

    const users = JSON.parse(fs.readFileSync(files.users, 'utf8'));
    const projects = JSON.parse(fs.readFileSync(files.projects, 'utf8'));
    const sections = JSON.parse(fs.readFileSync(files.sections, 'utf8'));
    const labels = JSON.parse(fs.readFileSync(files.labels, 'utf8'));

    console.log(`📊 Données lues :`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Sections: ${sections.length}`);
    console.log(`   - Labels: ${labels.length}`);

    console.log('🧹 Nettoyage des tables existantes...');
    await prisma.label.deleteMany();
    await prisma.section.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('   → Tables vidées');

    console.log('🔄 Import des utilisateurs...');
    for (const user of users) {
      await prisma.user.create({ data: fixDates(user) });
    }

    console.log('🔄 Import des projets...');
    for (const project of projects) {
      await prisma.project.create({ data: fixDates(project) });
    }

    console.log('🔄 Import des sections...');
    for (const section of sections) {
      await prisma.section.create({ data: fixDates(section) });
    }

    console.log('🔄 Import des labels...');
    for (const label of labels) {
      await prisma.label.create({ data: fixDates(label) });
    }

    console.log('✅ Import terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'import :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();