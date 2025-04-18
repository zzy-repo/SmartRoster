import express from 'express'
import { pool } from '../../shared/database/index.mjs'

const router = express.Router()

/**
 * 创建排班
 */
router.post('/', async (req, res) => {
  try {
    const { start_date, end_date, status, store_id, created_by } = req.body

    const [result] = await pool.query(
      'INSERT INTO schedules (start_date, end_date, status, store_id, created_by) VALUES (?, ?, ?, ?, ?)',
      [start_date, end_date, status, store_id, created_by],
    )

    res.status(201).json({ id: result.insertId })
  }
  catch (error) {
    console.error('创建排班失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 获取排班列表
 */
router.get('/', async (req, res) => {
  try {
    const [schedules] = await pool.query('SELECT * FROM schedules')
    res.json({ schedules })
  }
  catch (error) {
    console.error('获取排班列表失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 获取单个排班
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [schedules] = await pool.query(
      'SELECT * FROM schedules WHERE id = ?',
      [id],
    )

    if (schedules.length === 0) {
      return res.status(404).json({ error: '排班不存在' })
    }

    res.json({ schedule: schedules[0] })
  }
  catch (error) {
    console.error('获取排班失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 更新排班
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { start_date, end_date, status } = req.body

    const [result] = await pool.query(
      'UPDATE schedules SET start_date = ?, end_date = ?, status = ? WHERE id = ?',
      [start_date, end_date, status, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '排班不存在' })
    }

    res.json({ message: '排班更新成功' })
  }
  catch (error) {
    console.error('更新排班失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 删除排班
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await pool.query(
      'DELETE FROM schedules WHERE id = ?',
      [id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '排班不存在' })
    }

    res.json({ message: '排班删除成功' })
  }
  catch (error) {
    console.error('删除排班失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router