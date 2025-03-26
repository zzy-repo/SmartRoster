import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录
const rootDir = path.resolve(__dirname, '../')
const envPath = path.resolve(rootDir, '.env')

// 检查 .env 文件是否存在
if (fs.existsSync(envPath)) {
  console.log(`找到 .env 文件: ${envPath}`)
  // 使用绝对路径加载 .env 文件
  dotenv.config({ path: envPath })
}
else {
  console.error(`错误: .env 文件不存在: ${envPath}`)
}

// 打印数据库连接信息
console.log('数据库连接信息:')
console.log('主机:', process.env.DB_HOST || '未设置')
console.log('端口:', process.env.DB_PORT || '未设置')
console.log('用户名:', process.env.DB_USER || '未设置')
console.log('数据库名:', process.env.DB_NAME || '未设置')
console.log('正在尝试连接数据库...')

// 创建数据库连接池，必须提供所有必需的环境变量
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// 验证所有必需的环境变量是否都已设置
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER
  || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error('缺少必需的数据库配置环境变量')
}

// 测试连接
pool.getConnection()
  .then((connection) => {
    console.log('数据库连接成功!')
    connection.release()
  })
  .catch((err) => {
    console.error('数据库连接失败:', err.message)
    console.error('错误详情:', err)
  })

export default pool
