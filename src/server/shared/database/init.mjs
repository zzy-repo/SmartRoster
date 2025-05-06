import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './index.mjs'
import { config } from '../../config/index.mjs'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 清空数据库中所有表
 */
async function clearDatabase() {
  try {
    console.log('开始清空数据库...')
    
    // 按照外键依赖关系的反序删除表
    const dropOrder = [
      'shift_assignments',    // 先删除引用了其他表的表
      'shift_positions',
      'shifts',
      'schedules',
      'schedule_rules',
      'employees',
      'stores',
      'users'                // 最后删除被其他表引用的基础表
    ]
    
    for (const tableName of dropOrder) {
      console.log(`正在删除表: ${tableName}`)
      await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``)
      console.log(`已删除表: ${tableName}`)
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
    console.log('开始初始化数据库...')
    console.log('数据库配置:', {
      host: config.database.host,
      user: config.database.user,
      database: config.database.database
    })
    
    await clearDatabase()
    console.log('开始检查数据库表结构...')
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8')
    
    // 分割SQL语句，处理多行语句
    const statements = sqlScript
      .replace(/--.*$/gm, '') // 移除单行注释
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .split(';') // 按分号分割
      .map(s => s.trim()) // 去除空白
      .filter(s => s.length > 0) // 过滤空语句
    
    console.log('需要执行的SQL语句数量:', statements.length)
    
    for (const statement of statements) {
      if (!statement) continue
      console.log('执行SQL语句:', statement)
      try {
        await pool.query(statement)
        console.log('SQL语句执行成功')
      } catch (error) {
        console.error('执行SQL语句失败:', error)
        throw error
      }
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
    console.log('开始设置数据库...')
    const connection = await pool.getConnection()
    console.log('数据库连接成功')
    connection.release()
    const result = await initDatabase()
    console.log('数据库设置结果:', result)
    return result
  } catch (error) {
    console.error('数据库设置失败:', error)
    return false
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

export { initDatabase, setupDatabase }
