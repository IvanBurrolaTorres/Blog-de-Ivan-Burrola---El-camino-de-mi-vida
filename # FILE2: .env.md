# FILE: .env.example
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DATABASE_URL="file:./blog.db"
JWT_SECRET="your-very-long-and-secure-jwt-secret-min-32-chars-_____"
BCRYPT_ROUNDS=10
# Add local origins for dev and your prod domains (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://tu-dominio.com,https://www.tu-dominio.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
