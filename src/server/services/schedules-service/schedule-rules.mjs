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
    const userId = req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ error: '未提供用户ID' })
    }

    const [rules] = await pool.query('SELECT * FROM schedule_rules WHERE user_id = ?', [userId])
    if (rules.length === 0) {
      // 如果没有规则，创建一个默认规则
      const [result] = await pool.query(
        `INSERT INTO schedule_rules (
          max_daily_hours, max_weekly_hours,
          initial_temp, min_temp, cooling_rate, iter_per_temp, iterations,
          understaff_penalty, workday_violation, time_pref_violation,
          daily_hours_violation, weekly_hours_violation,
          user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          8, 40,  // 基本工时限制
          100.0, 0.1, 0.95, 100, 50,  // 模拟退火算法参数
          100, 10, 5, 20, 50,  // 成本参数
          userId
        ]
      )
      const [newRules] = await pool.query('SELECT * FROM schedule_rules WHERE id = ?', [result.insertId])
      return res.json({ rules: newRules })
    }
    res.json({ rules })
  }
  catch (error) {
    console.error('获取排班规则失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {put} /api/schedule/rules 更新排班规则
 * @apiName UpdateScheduleRule
 * @apiGroup Schedule
 * @apiDescription 更新排班规则
 *
 * @apiParam {number} id 规则ID
 * @apiBody {number} max_daily_hours 每日最大工作时长
 * @apiBody {number} max_weekly_hours 每周最大工作时长
 * @apiBody {number} initial_temp 初始温度
 * @apiBody {number} min_temp 最小温度
 * @apiBody {number} cooling_rate 冷却速率
 * @apiBody {number} iter_per_temp 每温度迭代次数
 * @apiBody {number} iterations 迭代次数
 * @apiBody {number} understaff_penalty 人员不足惩罚
 * @apiBody {number} workday_violation 工作日违反惩罚
 * @apiBody {number} time_pref_violation 时间偏好违反惩罚
 * @apiBody {number} daily_hours_violation 每日工作时长违反惩罚
 * @apiBody {number} weekly_hours_violation 每周工作时长违反惩罚
 *
 * @apiSuccess {string} message 成功消息
 */
router.put('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ error: '未提供用户ID' })
    }

    const {
      max_daily_hours,
      max_weekly_hours,
      initial_temp,
      min_temp,
      cooling_rate,
      iter_per_temp,
      iterations,
      understaff_penalty,
      workday_violation,
      time_pref_violation,
      daily_hours_violation,
      weekly_hours_violation
    } = req.body

    const [result] = await pool.query(
      `UPDATE schedule_rules SET 
        max_daily_hours = ?,
        max_weekly_hours = ?,
        initial_temp = ?,
        min_temp = ?,
        cooling_rate = ?,
        iter_per_temp = ?,
        iterations = ?,
        understaff_penalty = ?,
        workday_violation = ?,
        time_pref_violation = ?,
        daily_hours_violation = ?,
        weekly_hours_violation = ?
      WHERE user_id = ?`,
      [
        max_daily_hours,
        max_weekly_hours,
        initial_temp,
        min_temp,
        cooling_rate,
        iter_per_temp,
        iterations,
        understaff_penalty,
        workday_violation,
        time_pref_violation,
        daily_hours_violation,
        weekly_hours_violation,
        userId
      ]
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
