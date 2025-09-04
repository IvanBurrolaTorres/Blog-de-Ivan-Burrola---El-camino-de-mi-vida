// FILE: src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/index.js';

export async function authenticate(request, reply) {
  try {
    const header = request.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    const decoded = jwt.verify(token, jwtConfig.secret);
    request.user = decoded;
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}
