import { pool } from './index.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 设置数据库（测试连接并初始化表结构）
 */
export async function setupDatabase() {
  try {
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, 'init_db.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // 分割SQL语句
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
    
    // 执行SQL语句
    for (const statement of statements) {
      try {
        await pool.query(statement)
      }
      catch (error) {
        console.error('执行SQL语句失败:', error.message)
        throw error
      }
    }
    
    return true
  }
  catch (error) {
    console.error('设置数据库失败:', error.message)
    throw error
  }
}

/**
 * 初始化数据库表结构
 */
export async function initDatabase() {
  try {
    console.log('开始初始化数据库...')
    
    // 初始化数据库
    const result = await setupDatabase()
    if (!result) {
      throw new Error('数据库初始化失败')
    }
    
    console.log('数据库初始化完成')
  }
  catch (error) {
    console.error('数据库初始化失败')
    throw error
  }
}

// 如果直接运行此文件，则执行数据库初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(success => {
      if (success) {
        console.log('数据库初始化成功')
        process.exit(0)
      } else {
        console.error('数据库初始化失败')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('数据库初始化过程中发生错误:', error)
      process.exit(1)
    })
}
