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
    res.json({ data: schedules })
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

/**
 * 生成排班
 */
router.post('/generate', async (req, res) => {
  try {
    const { schedule_id, store_id, sa_config, cost_params } = req.body

    // 验证必要参数
    if (!schedule_id || !store_id) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 获取排班表信息
    const [schedules] = await pool.query(
      'SELECT * FROM schedules WHERE id = ? AND store_id = ?',
      [schedule_id, store_id]
    )

    if (schedules.length === 0) {
      return res.status(404).json({ error: '排班表不存在' })
    }

    // 获取该门店的所有员工信息
    const [employees] = await pool.query(
      'SELECT * FROM employees WHERE store_id = ?',
      [store_id]
    )

    // 获取该排班表的所有班次信息
    const [shifts] = await pool.query(
      'SELECT * FROM shifts WHERE schedule_id = ?',
      [schedule_id]
    )

    // 获取每个班次的职位需求
    const shiftPositions = await Promise.all(
      shifts.map(async (shift) => {
        const [positions] = await pool.query(
          'SELECT * FROM shift_positions WHERE shift_id = ?',
          [shift.id]
        )
        return {
          ...shift,
          positions
        }
      })
    )

    // TODO: 调用排班算法生成排班
    // const scheduleResult = await generateSchedule({
    //   employees,
    //   shifts: shiftPositions,
    //   sa_config,
    //   cost_params
    // })

    // 返回生成结果
    res.json({
      message: '排班生成成功',
      data: {
        schedule_id,
        store_id,
        // schedule: scheduleResult
      }
    })
  } catch (error) {
    console.error('生成排班失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router
