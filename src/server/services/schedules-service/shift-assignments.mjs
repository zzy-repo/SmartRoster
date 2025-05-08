import express from 'express'
import { pool } from '../../shared/database/index.mjs'

const router = express.Router()

// 查询某个排班ID下的所有分配
router.get('/', async (req, res) => {
  const { schedule_id } = req.query
  if (!schedule_id) return res.status(400).json({ error: '缺少schedule_id' })
  try {
    const [rows] = await pool.query('SELECT * FROM shift_assignments WHERE schedule_id = ?', [schedule_id])
    res.json({ data: rows })
  } catch (error) {
    console.error('查询分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 批量写入/覆盖分配
router.post('/', async (req, res) => {
  const { schedule_id, assignments } = req.body
  if (!schedule_id || !Array.isArray(assignments)) {
    return res.status(400).json({ error: '缺少参数' })
  }
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    // 先删除旧分配
    await conn.query('DELETE FROM shift_assignments WHERE schedule_id = ?', [schedule_id])
    // 批量插入新分配
    for (const item of assignments) {
      // item: { position, shift_id, employee_id, store_id, assigned_by }
      await conn.query(
        'INSERT INTO shift_assignments (position, schedule_id, shift_id, employee_id, store_id, assigned_by) VALUES (?, ?, ?, ?, ?, ?)',
        [item.position, schedule_id, item.shift_id, item.employee_id, item.store_id, item.assigned_by || null]
      )
    }
    await conn.commit()
    res.json({ message: '分配写入成功' })
  } catch (error) {
    await conn.rollback()
    console.error('写入分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  } finally {
    conn.release()
  }
})

// 删除某个排班ID下的所有分配（可选）
router.delete('/', async (req, res) => {
  const { schedule_id } = req.query
  if (!schedule_id) return res.status(400).json({ error: '缺少schedule_id' })
  try {
    await pool.query('DELETE FROM shift_assignments WHERE schedule_id = ?', [schedule_id])
    res.json({ message: '分配已删除' })
  } catch (error) {
    console.error('删除分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router 