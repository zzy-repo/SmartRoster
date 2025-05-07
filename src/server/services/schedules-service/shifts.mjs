import express from 'express'
import { pool } from '../../shared/database/index.mjs'

const router = express.Router()

/**
 * 创建班次
 */
router.post('/', async (req, res) => {
  try {
    const { day, start_time, end_time, store_id, schedule_id, positions } = req.body

    // 验证必要参数
    const requiredFields = ['day', 'start_time', 'end_time', 'store_id', 'schedule_id']
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null)
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        missing: missingFields,
        received: { day, start_time, end_time, store_id, schedule_id }
      })
    }

    // 验证day范围
    if (day < 0 || day > 6) {
      return res.status(400).json({ error: 'day必须在0-6之间' })
    }

    // 验证时间格式
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({ error: '时间格式无效，请使用HH:mm格式' })
    }

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 插入班次基本信息
      const [result] = await connection.query(
        'INSERT INTO shifts (day, start_time, end_time, store_id, schedule_id) VALUES (?, ?, ?, ?, ?)',
        [day, start_time, end_time, store_id, schedule_id],
      )

      const shiftId = result.insertId

      // 如果有positions，插入岗位需求
      if (positions && positions.length > 0) {
        for (const position of positions) {
          if (!position.position || !position.count) {
            throw new Error('岗位信息不完整，需要position和count字段')
          }
          await connection.query(
            'INSERT INTO shift_positions (shift_id, position, count) VALUES (?, ?, ?)',
            [shiftId, position.position, position.count]
          )
        }
      }

      // 提交事务
      await connection.commit()

      res.status(201).json({ 
        id: shiftId,
        message: '班次创建成功'
      })
    }
    catch (error) {
      // 如果出错，回滚事务
      console.error('数据库操作失败:', error)
      await connection.rollback()
      throw error
    }
    finally {
      // 释放连接
      connection.release()
    }
  }
  catch (error) {
    console.error('创建班次失败:', error)
    res.status(500).json({ 
      error: '服务器错误',
      details: error.message,
      stack: error.stack
    })
  }
})

/**
 * 获取班次列表
 */
router.get('/', async (req, res) => {
  try {
    const { scheduleId } = req.query
    if (!scheduleId) {
      return res.status(400).json({ error: '缺少必要的排班ID参数' })
    }

    const [shifts] = await pool.query(
      'SELECT * FROM shifts WHERE schedule_id = ?',
      [scheduleId]
    )
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
    const { day, start_time, end_time, store_id, schedule_id } = req.body

    // 验证必要参数
    if (!day || !start_time || !end_time || !store_id || !schedule_id) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const [result] = await pool.query(
      'UPDATE shifts SET day = ?, start_time = ?, end_time = ?, store_id = ?, schedule_id = ? WHERE id = ?',
      [day, start_time, end_time, store_id, schedule_id, id],
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
