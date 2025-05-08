import express from 'express'
import { pool } from '../../shared/database/index.mjs'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
        // 转换为算法需要的格式，严格按照Shift类的定义
        const required_positions = {}
        positions.forEach(pos => {
          required_positions[String(pos.position)] = Number(pos.count)
        })
        return { 
          day: Number(shift.day),
          start_time: String(shift.start_time).split(':').slice(0, 2).join(':'),
          end_time: String(shift.end_time).split(':').slice(0, 2).join(':'),
          required_positions,
          store: String(schedule.store_id)
        }
      })
    )

    // 3. 查询员工信息
    const [employees] = await pool.query('SELECT * FROM employees WHERE store_id = ?', [schedule.store_id])
    
    // 转换员工数据格式，严格按照Employee类的定义
    const formattedEmployees = employees.map(emp => {
      // 验证并格式化工作日偏好
      const workday_pref_start = Number(emp.workday_pref_start ?? 0)
      const workday_pref_end = Number(emp.workday_pref_end ?? 6)
      if (workday_pref_start < 0 || workday_pref_start > 6 || workday_pref_end < 0 || workday_pref_end > 6) {
        throw new Error(`员工 ${emp.name} 的工作日偏好超出范围(0-6)`)
      }

      // 验证并格式化时间偏好
      const time_pref_start = String(emp.time_pref_start ?? '08:00').split(':').slice(0, 2).join(':')
      const time_pref_end = String(emp.time_pref_end ?? '20:00').split(':').slice(0, 2).join(':')
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time_pref_start) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time_pref_end)) {
        throw new Error(`员工 ${emp.name} 的时间偏好格式错误`)
      }

      // 验证工作时长
      const max_daily_hours = Number(emp.max_daily_hours ?? 8)
      const max_weekly_hours = Number(emp.max_weekly_hours ?? 40)
      if (max_daily_hours <= 0 || max_daily_hours > 24 || max_weekly_hours <= 0 || max_weekly_hours > 168) {
        throw new Error(`员工 ${emp.name} 的工作时长超出合理范围`)
      }

      return {
        name: String(emp.name || ''),
        position: String(emp.position || ''),
        store: String(schedule.store_id),
        workday_pref: [workday_pref_start, workday_pref_end],
        time_pref: [time_pref_start, time_pref_end],
        max_daily_hours,
        max_weekly_hours,
        phone: String(emp.phone || ''),
        email: String(emp.email || '')
      }
    })

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

    // 4. 准备请求数据，确保所有数值都是数字类型
    const requestData = {
      employees: formattedEmployees,
      shifts: shiftPositions,
      sa_config: {
        initial_temp: Number(rulesRows[0].initial_temp),
        min_temp: Number(rulesRows[0].min_temp),
        cooling_rate: Number(rulesRows[0].cooling_rate),
        iter_per_temp: Number(rulesRows[0].iter_per_temp),
        iterations: Number(rulesRows[0].iterations)
      },
      cost_params: {
        understaff_penalty: Number(rulesRows[0].understaff_penalty),
        workday_violation: Number(rulesRows[0].workday_violation),
        time_pref_violation: Number(rulesRows[0].time_pref_violation),
        daily_hours_violation: Number(rulesRows[0].daily_hours_violation),
        weekly_hours_violation: Number(rulesRows[0].weekly_hours_violation)
      }
    }

    // 4. 调用排班算法
    const pythonScriptPath = path.resolve(__dirname, '../../scheduler/scheduler_api.py')
    console.log('开始运行排班算法...')

    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({ 
        success: false, 
        error: `Python脚本不存在: ${pythonScriptPath}，请确保文件位于正确位置` 
      })
    }

    const pythonProcess = spawn('python3', [pythonScriptPath])
    let outputData = ''
    let errorData = ''
    let logData = ''

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      // 检查是否是JSON格式的输出
      if (output.trim().startsWith('{')) {
        outputData += output
      } else {
        // 非JSON输出作为日志处理
        logData += output
        // 只输出关键流程信息
        if (output.includes('初始化排班算法') || 
            output.includes('开始生成初始解') || 
            output.includes('初始解生成完成') || 
            output.includes('模拟退火完成')) {
          console.log('排班进度:', output.trim())
        }
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString()
      // 检查是否包含"Python错误:"前缀
      if (error.includes('Python错误:')) {
        errorData += error
        console.error('Python错误:', error)
      } else {
        // 其他stderr输出作为日志处理
        logData += error
        // 只输出关键流程信息
        if (error.includes('初始化排班算法') || 
            error.includes('开始生成初始解') || 
            error.includes('初始解生成完成') || 
            error.includes('模拟退火完成')) {
          console.log('排班进度:', error.trim())
        }
      }
    })

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        // 更新排班状态为失败
        try {
          await pool.query(
            'UPDATE schedules SET status = ? WHERE id = ?',
            ['failed', id]
          )
        } catch (error) {
          console.error('更新排班状态失败:', error)
        }
        return res.status(500).json({ 
          success: false, 
          error: `排班算法执行失败: ${errorData}` 
        })
      }

      try {
        const result = JSON.parse(outputData)
        // 添加日志信息到返回结果
        result.logs = logData.split('\n')
          .filter(line => line.trim())
          .filter(line => line.includes('初始化排班算法') || 
                         line.includes('开始生成初始解') || 
                         line.includes('初始解生成完成') || 
                         line.includes('模拟退火完成'))

        // 5. 更新排班状态
        await pool.query(
          'UPDATE schedules SET status = ? WHERE id = ?',
          ['completed', id]
        )

        // 6. 存储排班结果
        if (result.schedule) {
          // 6.1 删除旧的排班结果
          await pool.query('DELETE FROM schedule_results WHERE schedule_id = ?', [id])
          
          // 6.2 插入新的排班结果
          const scheduleResults = result.schedule.map(assignment => ({
            schedule_id: id,
            employee_id: assignment.employee_id,
            shift_id: assignment.shift_id,
            position: assignment.position
          }))

          if (scheduleResults.length > 0) {
            const values = scheduleResults.map(result => 
              `(${result.schedule_id}, ${result.employee_id}, ${result.shift_id}, '${result.position}')`
            ).join(',')

            await pool.query(`
              INSERT INTO schedule_results 
              (schedule_id, employee_id, shift_id, position) 
              VALUES ${values}
            `)
          }
        }

        res.json({ 
          success: true, 
          data: {
            ...result,
            schedule_id: id,
            status: 'completed'
          }
        })
      } catch (error) {
        console.error('处理排班结果失败:', error)
        // 更新排班状态为失败
        try {
          await pool.query(
            'UPDATE schedules SET status = ? WHERE id = ?',
            ['failed', id]
          )
        } catch (dbError) {
          console.error('更新排班状态失败:', dbError)
        }
        res.status(500).json({ 
          success: false, 
          error: `处理排班结果失败: ${error.message}` 
        })
      }
    })

    // 发送请求数据到Python进程
    pythonProcess.stdin.write(JSON.stringify(requestData))
    pythonProcess.stdin.end()

  } catch (error) {
    console.error('排班运行失败:', error)
    // 更新排班状态为失败
    try {
      await pool.query(
        'UPDATE schedules SET status = ? WHERE id = ?',
        ['failed', id]
      )
    } catch (dbError) {
      console.error('更新排班状态失败:', dbError)
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
