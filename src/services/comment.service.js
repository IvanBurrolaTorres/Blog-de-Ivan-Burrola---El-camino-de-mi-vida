
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CommentService {
  async create({ postId, author, email = '', content, approved = true }) {
    return prisma.comment.create({
      data: { postId, author, email, content, approved }
    });
  }

  async update(id, { approved }) {
    return prisma.comment.update({ where: { id }, data: { approved } });
  }
}
