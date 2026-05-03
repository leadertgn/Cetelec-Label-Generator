import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const counts = await prisma.$transaction([
  prisma.user.count(),
  prisma.project.count(),
  prisma.section.count(),
  prisma.label.count()
]);

console.log(`Users: ${counts[0]}, Projects: ${counts[1]}, Sections: ${counts[2]}, Labels: ${counts[3]}`);
await prisma.$disconnect();