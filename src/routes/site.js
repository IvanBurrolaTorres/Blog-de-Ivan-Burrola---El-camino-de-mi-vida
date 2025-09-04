
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PostService } from '../services/post.service.js';
import { CommentService } from '../services/comment.service.js';

const postService = new PostService();
const commentService = new CommentService();

export default async function siteRoutes(app) {
  // Public: health
  app.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }));

  // Public: list posts (paginated)
  app.get('/posts', {
    schema: {
      querystring: zodToJsonSchema(z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional()
      }))
    }
  }, async (req) => {
    const { page = 1, limit = 10 } = req.query;
    return postService.getAll({ page, limit });
  });

  // Public: get post by slug
  app.get('/posts/:slug', {
    schema: { params: zodToJsonSchema(z.object({ slug: z.string().min(1) })) }
  }, async (req, reply) => {
    const post = await postService.getOneBySlug(req.params.slug);
    if (!post) return reply.code(404).send({ error: 'Post not found' });
    return post;
  });

  // Public: search
  app.get('/search', {
    schema: {
      querystring: zodToJsonSchema(z.object({
        q: z.string().min(1),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional()
      }))
    }
  }, async (req) => {
    const { q, page = 1, limit = 10 } = req.query;
    return postService.search({ q, page, limit });
  });

  // Public: create comment
  app.post('/posts/:id/comments', {
    schema: {
      params: zodToJsonSchema(z.object({ id: z.string().min(1) })),
      body: zodToJsonSchema(z.object({
        author: z.string().min(2).max(80),
        email: z.string().email().optional().or(z.literal('')),
        content: z.string().min(3).max(2000)
      }))
    }
  }, async (req) => {
    const { id } = req.params;
    const { author, email = '', content } = req.body;
    const comment = await commentService.create({ postId: id, author, email, content, approved: true });
    return { success: true, comment };
  });
}
