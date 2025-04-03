import { pool } from '../../shared/database/index.mjs'

// 清空测试数据库中的表
export async function clearDatabase() {
  const tables = ['users', 'employees', 'stores', 'schedules', 'shifts']
  
  for (const table of tables) {
    try {
      await pool.execute(`DELETE FROM ${table}`)
    } catch (error) {
      console.error(`清空表 ${table} 失败:`, error)
    }
  }
}

// 关闭数据库连接
export async function closeDatabase() {
  await pool.end()
}