import dotenv from 'dotenv';
dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
