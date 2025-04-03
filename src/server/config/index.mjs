import dotenv from 'dotenv';
import servicesConfig from './services.mjs';

// 加载环境变量
dotenv.config();

export const config = {
  gateway: {
    port: process.env.GATEWAY_PORT || 3000
  },
  services: servicesConfig,
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartroster'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  }
};