import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载.env文件
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  gateway: {
    port: 3000
  },
  services: {
    auth: {
      name: 'auth-service',
      port: 3001
    },
    store: {
      name: 'store-service',
      port: 3002
    },
    employee: {
      name: 'employee-service',
      port: 3003
    },
    schedule: {
      name: 'schedule-service',
      port: 3004
    },
    forecast: {
      name: 'forecast-service',
      port: 3005
    }
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'smartroster',
    port: process.env.DB_PORT || 3306
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  }
};