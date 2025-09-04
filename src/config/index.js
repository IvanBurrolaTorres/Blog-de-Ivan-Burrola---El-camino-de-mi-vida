export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'supersecreto',
  expiresIn: '1d'
};
export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  HOST: process.env.HOST || '127.0.0.1',
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 10
};

export const corsConfig = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

export const rateLimitConfig = {
  max: 100,
  timeWindow: '1 minute',
};
