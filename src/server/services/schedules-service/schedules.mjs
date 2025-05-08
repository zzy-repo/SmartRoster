import express from 'express'
import { pool } from '../../shared/database/index.mjs'
import { spawn } from 'child_process'

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

/**
 * 运行排班算法（根据排班ID）
 */
router.post('/run/:id', async (req, res) => {
  const { id } = req.params
  try {
    // 1. 查询排班表信息
    const [schedules] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id])
    if (schedules.length === 0) {
      return res.status(404).json({ success: false, error: '排班不存在' })
    }
    const schedule = schedules[0]

    // 2. 查询班次信息
    const [shifts] = await pool.query('SELECT * FROM shifts WHERE schedule_id = ?', [id])
    // 2.1 查询每个班次的职位需求
    const shiftPositions = await Promise.all(
      shifts.map(async (shift) => {
        const [positions] = await pool.query('SELECT * FROM shift_positions WHERE shift_id = ?', [shift.id])
        // 转换为算法需要的格式
        const required_positions = {}
        positions.forEach(pos => {
          required_positions[pos.position] = pos.count
        })
        return { ...shift, required_positions }
      })
    )

    // 3. 查询员工信息
    const [employees] = await pool.query('SELECT * FROM employees WHERE store_id = ?', [schedule.store_id])

    // 3.1 查询排班规则参数
    // user_id优先从schedule.created_by获取，否则从header获取
    let userId = schedule.created_by || req.headers['x-user-id']
    if (!userId) {
      return res.status(400).json({ success: false, error: '无法确定用户ID' })
    }
    const [rulesRows] = await pool.query('SELECT * FROM schedule_rules WHERE user_id = ?', [userId])
    if (!rulesRows.length) {
      return res.status(400).json({ success: false, error: '未找到排班规则' })
    }
    const rules = rulesRows[0]
    // 组装参数
    const sa_config = {
      initial_temp: rules.initial_temp,
      min_temp: rules.min_temp,
      cooling_rate: rules.cooling_rate,
      iter_per_temp: rules.iter_per_temp,
      iterations: rules.iterations
    }
    const cost_params = {
      understaff_penalty: rules.understaff_penalty,
      workday_violation: rules.workday_violation,
      time_pref_violation: rules.time_pref_violation,
      daily_hours_violation: rules.daily_hours_violation,
      weekly_hours_violation: rules.weekly_hours_violation
    }

    // 4. 组装数据，调用Python脚本
    const pyInput = JSON.stringify({
      employees,
      shifts: shiftPositions,
      sa_config,
      cost_params
    })

    const result = await new Promise((resolve, reject) => {
      const py = spawn('python3', ['alg/scheduler_api.py'])
      let stdout = ''
      let stderr = ''
      py.stdout.on('data', data => { stdout += data })
      py.stderr.on('data', data => { stderr += data })
      py.on('close', code => {
        if (code === 0) {
          try {
            resolve(JSON.parse(stdout))
          } catch (e) {
            reject('Python输出解析失败: ' + e)
          }
        } else {
          reject(stderr || 'Python脚本执行失败')
        }
      })
      py.stdin.write(pyInput)
      py.stdin.end()
    })

    // 6. 写入排班分配结果到数据库
    // 解析result.schedule，将分配写入数据库（如shift_assignments表）
    if (result.schedule && Array.isArray(result.schedule)) {
      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()
        // 删除旧分配
        await conn.query('DELETE FROM shift_assignments WHERE schedule_id = ?', [id])
        // 批量插入新分配
        for (const shift of result.schedule) {
          const { day, start_time, end_time, store, assignments } = shift
          for (const position in assignments) {
            for (const worker of assignments[position]) {
              // worker: { name, position, store, ... }
              // 需要查找employee_id和store_id
              const [empRows] = await conn.query('SELECT id, store_id FROM employees WHERE name = ? AND store_id = ?', [worker.name, schedule.store_id])
              if (empRows.length === 0) continue // 未找到员工
              const employee_id = empRows[0].id
              const store_id = empRows[0].store_id
              // 找到shift_id
              const [shiftRows] = await conn.query('SELECT id FROM shifts WHERE schedule_id = ? AND day = ? AND start_time = ? AND end_time = ? AND store_id = ?', [id, shift.day, shift.start_time, shift.end_time, schedule.store_id])
              if (shiftRows.length === 0) continue // 未找到班次
              const shift_id = shiftRows[0].id
              await conn.query(
                'INSERT INTO shift_assignments (position, schedule_id, shift_id, employee_id, store_id, assigned_by) VALUES (?, ?, ?, ?, ?, ?)',
                [position, id, shift_id, employee_id, store_id, schedule.created_by || null]
              )
            }
          }
        }
        await conn.commit()
      } catch (err) {
        await conn.rollback()
        throw err
      } finally {
        conn.release()
      }
    }

    // 7. 返回排班任务状态/结果
    res.json({
      success: true,
      message: '排班成功',
      schedule_id: id,
      result
    })
  } catch (error) {
    console.error('排班运行失败:', error)
    res.status(500).json({ success: false, error: '服务器错误', detail: error?.toString?.() })
  }
})

export default router
