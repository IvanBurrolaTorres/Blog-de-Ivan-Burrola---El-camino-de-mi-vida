// FILE: prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({ data: { username: 'admin', password: hashed, role: 'admin' } });
    console.log('Admin user created: admin / admin123');
  }
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        {
          slug: 'infografico-tiempo',
          title: 'Aportación 1: Infográfico de administración del tiempo',
          excerpt: 'Impacto académico y profesional de gestionar el tiempo.',
          content: '<h2>Propósito</h2><p>Crear un blog en formato digital y publicar la primera aportación.</p>',
          tags: JSON.stringify(['Hábitos','Productividad','Semana 1']),
          published: true,
          views: 42
        },
        {
          slug: 'habitos-exitosos',
          title: 'Aportación 2: 10 hábitos recomendados por gente exitosa',
          excerpt: 'Análisis de los hábitos que personas exitosas comparten.',
          content: '<h2>Propósito</h2><p>Investigar y compartir hábitos saludables.</p>',
          tags: JSON.stringify(['Éxito','Hábitos','Desarrollo personal','Semana 2']),
          published: true,
          views: 18
        }
      ]
    });
    console.log('Sample posts created');
  }
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(async()=>{ await prisma.$disconnect(); });
