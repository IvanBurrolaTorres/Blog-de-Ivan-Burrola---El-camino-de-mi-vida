
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { authenticate } from '../middleware/auth.js';
import { PostService } from '../services/post.service.js';
import { CommentService } from '../services/comment.service.js';
import { AdminService } from '../services/admin.service.js';

const postService = new PostService();
const commentService = new CommentService();
const adminService = new AdminService();

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  tags: z.array(z.string()).min(0).max(10).default([]),
  coverUrl: z.string().url().optional(),
  published: z.boolean().default(false)
});

export default async function adminRoutes(app) {
  // Login (no auth)
  app.post('/login', {
    schema: { body: zodToJsonSchema(z.object({ username: z.string().min(1), password: z.string().min(1) })) }
  }, async (request, reply) => {
    try {
      return await adminService.login(request.body);
    } catch {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
  });

  // Protected routes
  app.addHook('preHandler', authenticate);

  app.post('/posts', async (request) => {
    const data = postSchema.parse(request.body);
    const post = await postService.create(data);
    return { success: true, post: { ...post, tags: data.tags } };
  });

  app.put('/posts/:id', async (request) => {
    const data = postSchema.partial().parse(request.body);
    return { success: true, post: await postService.update(request.params.id, data) };
  });

  app.delete('/posts/:id', async (request) => {
    await postService.delete(request.params.id);
    return { success: true };
  });

  app.patch('/comments/:id', {
    schema: { body: zodToJsonSchema(z.object({ approved: z.boolean() })) }
  }, async (request) => {
    const { approved } = request.body;
    return { success: true, comment: await commentService.update(request.params.id, { approved }) };
  });
}
