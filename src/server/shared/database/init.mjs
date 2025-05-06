import { pool } from './index.mjs'

/**
 * 清空数据库中所有表
 */
async function clearDatabase() {
  try {
    const [tables] = await pool.query('SHOW TABLES')
    for (const table of tables) {
      const tableName = Object.values(table)[0]
      await pool.query(`DROP TABLE IF EXISTS ${tableName}`)
    }
  }
  catch (error) {
    console.error('清空数据库失败')
    throw error
  }
}

/**
 * 设置数据库（测试连接并初始化表结构）
 */
export async function setupDatabase() {
  try {
    // 检查表结构
    const statements = [
      // ... 表结构定义 ...
    ]
    
    // 执行SQL语句
    for (const statement of statements) {
      try {
        await pool.query(statement)
      }
      catch (error) {
        console.error('执行SQL语句失败')
        throw error
      }
    }
    
    return true
  }
  catch (error) {
    console.error('设置数据库失败')
    throw error
  }
}

/**
 * 初始化数据库表结构（先清空再执行SQL脚本）
 */
export async function initDatabase() {
  try {
    console.log('开始初始化数据库...')
    
    // 清空数据库
    console.log('清空数据库...')
    await clearDatabase()
    
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
