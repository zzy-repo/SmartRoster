import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载测试环境变量
dotenv.config({ path: path.resolve(__dirname,  '.env.test') })

// 创建测试环境变量示例文件
export function setupTestEnv() {
  process.env.NODE_ENV = 'test'
  process.env.DB_HOST = 'localhost'
  process.env.DB_USER = 'test_user'
  process.env.DB_PASSWORD = 'test_password'
  process.env.DB_NAME = 'smartroster_test'
  process.env.DB_PORT = '3306'
  process.env.JWT_SECRET = 'test-secret-key'
}