
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/index.js';

const prisma = new PrismaClient();

export class AdminService {
  async login({ username, password }) {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) throw new Error('Invalid credentials');
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) throw new Error('Invalid credentials');
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    return { token, user: { username: admin.username, role: admin.role } };
  }
}
