import express from 'express'
import { pool } from '../../shared/database/index.mjs'

const router = express.Router()

/**
 * 创建班次
 */
router.post('/', async (req, res) => {
  try {
    const { day, start_time, end_time, status, store_id } = req.body

    const [result] = await pool.query(
      'INSERT INTO shifts (day, start_time, end_time, status, store_id) VALUES (?, ?, ?, ?, ?)',
      [day, start_time, end_time, status, store_id],
    )

    res.status(201).json({ id: result.insertId })
  }
  catch (error) {
    console.error('创建班次失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 获取班次列表
 */
router.get('/', async (req, res) => {
  try {
    const [shifts] = await pool.query('SELECT * FROM shifts')
    res.json({ shifts })
  }
  catch (error) {
    console.error('获取班次列表失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 获取单个班次
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [shifts] = await pool.query(
      'SELECT * FROM shifts WHERE id = ?',
      [id],
    )

    if (shifts.length === 0) {
      return res.status(404).json({ error: '班次不存在' })
    }

    res.json({ shift: shifts[0] })
  }
  catch (error) {
    console.error('获取班次失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 更新班次
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { day, start_time, end_time, status } = req.body

    const [result] = await pool.query(
      'UPDATE shifts SET day = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?',
      [day, start_time, end_time, status, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '班次不存在' })
    }

    res.json({ message: '班次更新成功' })
  }
  catch (error) {
    console.error('更新班次失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * 删除班次
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await pool.query(
      'DELETE FROM shifts WHERE id = ?',
      [id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '班次不存在' })
    }

    res.json({ message: '班次删除成功' })
  }
  catch (error) {
    console.error('删除班次失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router
