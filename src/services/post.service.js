// FILE: src/services/post.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PostService {
  async getAll({ page = 1, limit = 10 }) {
    const p = Math.max(1, Number(page));
    const l = Math.min(50, Math.max(1, Number(limit)));
    const skip = (p - 1) * l;

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where: { published: true },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          tags: true,
          views: true,
          coverUrl: true,
          createdAt: true,
          _count: { select: { comments: { where: { approved: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l
      }),
      prisma.post.count({ where: { published: true } })
    ]);

    return {
      posts: posts.map(p => ({
        ...p,
        tags: JSON.parse(p.tags || '[]'),
        commentsCount: p._count.comments
      })),
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) }
    };
  }

  async getOneBySlug(slug) {
    const post = await prisma.post.findFirst({
      where: { slug, published: true },
      include: {
        comments: {
          where: { approved: true },
          select: { id: true, author: true, content: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!post) return null;

    await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    });

    return { ...post, tags: JSON.parse(post.tags || '[]') };
  }

  async search({ q, page = 1, limit = 10 }) {
    const term = String(q || '').trim();
    if (term.length < 2) return { posts: [], pagination: { page: 1, limit, total: 0, pages: 0 } };

    const p = Math.max(1, Number(page));
    const l = Math.min(50, Math.max(1, Number(limit)));
    const skip = (p - 1) * l;

    const where = {
      published: true,
      OR: [
        { title:   { contains: term, mode: 'insensitive' } },
        { excerpt: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
        { tags:    { contains: term, mode: 'insensitive' } }
      ]
    };

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        select: { id: true, slug: true, title: true, excerpt: true, tags: true, createdAt: true, views: true },
        orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: l
      }),
      prisma.post.count({ where })
    ]);

    return {
      posts: posts.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') })),
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) }
    };
  }

  async create(data) {
    const payload = { ...data, tags: JSON.stringify(data.tags || []) };
    return prisma.post.create({ data: payload });
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.tags) payload.tags = JSON.stringify(payload.tags);
    const post = await prisma.post.update({ where: { id }, data: payload });
    return { ...post, tags: JSON.parse(post.tags || '[]') };
  }

  async delete(id) {
    await prisma.post.delete({ where: { id } });
  }
}
