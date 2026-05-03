import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
  try {
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema(), current_user`;
    console.log("🔍 Infos de connexion réelle :");
    console.table(result);
    
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log("📋 Tables trouvées dans le schéma public :");
    console.table(tables);
  } catch (e) {
    console.error("❌ Erreur :", e);
  } finally {
    await prisma.$disconnect();
  }
}
debug();
