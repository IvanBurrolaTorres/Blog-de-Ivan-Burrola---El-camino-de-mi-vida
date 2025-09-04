
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import caching from '@fastify/caching';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { config, corsConfig, rateLimitConfig } from './config/index.js';
import { ValidationError, NotFoundError } from './utils/errors.js';
import siteRoutes from './routes/site.js';
import adminRoutes from './routes/admin.js';

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

const app = Fastify({
  logger: { level: config.NODE_ENV === 'production' ? 'info' : 'info' },
  genReqId: () => crypto.randomUUID()
});

// Decorate
app.decorate('prisma', prisma);
app.decorate('ValidationError', ValidationError);
app.decorate('NotFoundError', NotFoundError);

// Security headers (API-safe)
await app.register(helmet, {
  contentSecurityPolicy: false, // APIs return JSON; CSP not necessary here
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' }
});

await app.register(cors, corsConfig);
await app.register(rateLimit, rateLimitConfig);
await app.register(caching, { expiresIn: 60 });

// Central error handler with correlation ID
app.setErrorHandler((error, request, reply) => {
  const correlationId = request.id;
  app.log.error({ correlationId, err: error, path: request.routerPath });
  if (error instanceof ValidationError) return reply.code(400).send({ error: error.message, details: error.details, correlationId });
  if (error instanceof NotFoundError) return reply.code(404).send({ error: error.message, correlationId });
  if (error.validation) return reply.code(400).send({ error: 'Invalid request', correlationId });
  return reply.code(error.status || 500).send({ error: 'Internal server error', correlationId });
});

// Routes
await app.register(siteRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api/admin' });

// Seed (idempotent)
async function seedDatabase() {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', config.BCRYPT_ROUNDS);
    await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: { username: 'admin', password: hashedPassword, role: 'admin' }
    });
    app.log.info('Default admin created');
  }

  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        {
          slug: 'infografico-tiempo',
          title: 'Aportación 1: Infográfico de administración del tiempo',
          excerpt: 'Impacto académico y profesional de gestionar el tiempo. Sistema 90/15, Matriz de Eisenhower.',
          content: `<h2>Propósito</h2><p>Crear un blog en formato digital y publicar la primera aportación.</p>`,
          tags: JSON.stringify(['Hábitos', 'Productividad', 'Semana 1']),
          published: true,
          views: 42
        },
        {
          slug: 'habitos-exitosos',
          title: 'Aportación 2: 10 hábitos recomendados por gente exitosa',
          excerpt: 'Análisis de los hábitos que personas exitosas comparten.',
          content: `<h2>Propósito</h2><p>Investigar y compartir hábitos saludables.</p>`,
          tags: JSON.stringify(['Éxito', 'Hábitos', 'Desarrollo personal', 'Semana 2']),
          published: true,
          views: 18
        }
      ],
      skipDuplicates: true
    });
    app.log.info('Sample posts created');
  }
}

// Start
const start = async () => {
  try {
    await seedDatabase();
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`Server running at http://${config.HOST}:${config.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  app.log.info('Shutting down...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});

start();
