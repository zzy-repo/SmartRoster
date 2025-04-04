import mysql from 'mysql2/promise'
import { config } from '../../config/index.mjs'

// 创建连接池
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('数据库连接成功')
    connection.release()
    return true
  }
  catch (error) {
    console.error('数据库连接失败:', error)
    return false
  }
}

export { pool, testConnection }
