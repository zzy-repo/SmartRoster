import express from 'express'
import { pool } from '../../shared/database/index.mjs'

const router = express.Router()

/**
 * @api {get} /api/schedule/rules 获取排班规则
 * @apiName GetScheduleRules
 * @apiGroup Schedule
 * @apiDescription 获取所有排班规则
 *
 * @apiSuccess {object[]} rules 排班规则列表
 * @apiSuccess {number} rules.id 规则ID
 * @apiSuccess {number} rules.max_daily_hours 每日最大工作时长
 * @apiSuccess {number} rules.max_weekly_hours 每周最大工作时长
 * @apiSuccess {number} rules.user_id 用户ID
 */
router.get('/', async (req, res) => {
  try {
    const [rules] = await pool.query('SELECT * FROM schedule_rules WHERE id = 1')
    if (rules.length === 0) {
      return res.status(404).json({ error: '规则不存在' })
    }
    res.json({ rules })
  }
  catch (error) {
    console.error('获取排班规则失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {put} /api/schedule/rules/:id 更新排班规则
 * @apiName UpdateScheduleRule
 * @apiGroup Schedule
 * @apiDescription 更新指定的排班规则
 *
 * @apiParam {number} id 规则ID
 * @apiBody {number} max_daily_hours 每日最大工作时长
 * @apiBody {number} max_weekly_hours 每周最大工作时长
 *
 * @apiSuccess {string} message 成功消息
 */
router.put('/', async (req, res) => {
  try {
    const { id } = 1
    const { max_daily_hours, max_weekly_hours } = req.body

    const [result] = await pool.query(
      'UPDATE schedule_rules SET max_daily_hours = ?, max_weekly_hours = ? WHERE id = 1',
      [max_daily_hours, max_weekly_hours],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '规则不存在' })
    }

    res.json({ message: '规则更新成功' })
  }
  catch (error) {
    console.error('更新排班规则失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router
