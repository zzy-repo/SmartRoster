import express from 'express'
import { pool } from '../../shared/database/index.mjs'

const router = express.Router()

/**
 * 创建班次分配
 */
router.post('/', async (req, res) => {
  try {
    const { position, override_reason, schedule_id, shift_id, employee_id, assigned_by } = req.body

    const [result] = await pool.query(
      'INSERT INTO shift_assignments (position, override_reason, schedule_id, shift_id, employee_id, assigned_by) VALUES (?, ?, ?, ?, ?, ?)',
      [position, override_reason, schedule_id, shift_id, employee_id, assigned_by],
    )

    res.status(201).json({ id: result.insertId })
  }
  catch (error) {
    console.error('创建班次分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 获取特定排班的班次分配
 */
router.get('/schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params

    const [assignments] = await pool.query(
      'SELECT * FROM shift_assignments WHERE schedule_id = ?',
      [scheduleId],
    )

    res.json({ assignments })
  }
  catch (error) {
    console.error('获取班次分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 更新班次分配
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { position, override_reason } = req.body

    const [result] = await pool.query(
      'UPDATE shift_assignments SET position = ?, override_reason = ? WHERE id = ?',
      [position, override_reason, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '班次分配不存在' })
    }

    res.json({ message: '班次分配更新成功' })
  }
  catch (error) {
    console.error('更新班次分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 删除班次分配
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await pool.query(
      'DELETE FROM shift_assignments WHERE id = ?',
      [id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '班次分配不存在' })
    }

    res.json({ message: '班次分配删除成功' })
  }
  catch (error) {
    console.error('删除班次分配失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router
