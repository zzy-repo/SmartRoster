import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './index.mjs'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 清空数据库中所有表
 */
async function clearDatabase() {
  try {
    console.log('开始清空数据库...')
    const [tables] = await pool.query('SHOW TABLES')
    const tableKey = tables[0] && Object.keys(tables[0])[0]
    for (const row of tables) {
      await pool.query(`DROP TABLE IF EXISTS \`${row[tableKey]}\``)
      console.log(`已删除表: ${row[tableKey]}`)
    }
    console.log('数据库已清空')
  } catch (error) {
    console.error('清空数据库失败:', error)
    throw error
  }
}

/**
 * 初始化数据库表结构（先清空再执行SQL脚本）
 */
async function initDatabase() {
  try {
    await clearDatabase()
    console.log('开始检查数据库表结构...')
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8')
    // 只保留非空且非注释的SQL语句，按分号分割
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
    for (const statement of statements) {
      await pool.query(statement)
    }
    console.log('数据库表结构检查完成')
    return true
  } catch (error) {
    console.error('初始化数据库失败:', error)
    return false
  }
}

/**
 * 设置数据库（测试连接并初始化表结构）
 */
async function setupDatabase() {
  try {
    const connection = await pool.getConnection()
    console.log('数据库连接成功')
    connection.release()
    await initDatabase()
    return true
  } catch (error) {
    console.error('数据库设置失败:', error)
    return false
  }
}

export { initDatabase, setupDatabase }
