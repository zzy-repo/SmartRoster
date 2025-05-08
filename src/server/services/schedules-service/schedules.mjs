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
    console.log('格式化后的班次数据:', JSON.stringify(shiftPositions, null, 2))

    // 3. 查询员工信息
    const [employees] = await pool.query('SELECT * FROM employees WHERE store_id = ?', [schedule.store_id])
    console.log('原始员工数据:', JSON.stringify(employees, null, 2))
    
    // 转换员工数据格式，严格按照Employee类的定义
    const formattedEmployees = employees.map(emp => ({
      name: String(emp.name || ''),
      position: String(emp.position || ''),
      store: String(schedule.store_id),
      workday_pref: [
        Number(emp.workday_pref_start || 0),
        Number(emp.workday_pref_end || 6)
      ],
      time_pref: [
        String(emp.time_pref_start || '08:00').split(':').slice(0, 2).join(':'),
        String(emp.time_pref_end || '20:00').split(':').slice(0, 2).join(':')
      ],
      max_daily_hours: Number(emp.max_daily_hours || 8),
      max_weekly_hours: Number(emp.max_weekly_hours || 40),
      phone: String(emp.phone || ''),
      email: String(emp.email || '')
    }))
    console.log('格式化后的员工数据:', JSON.stringify(formattedEmployees, null, 2))

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
    console.log('当前目录:', __dirname)
    console.log('Python脚本绝对路径:', pythonScriptPath)
    console.log('文件是否存在:', fs.existsSync(pythonScriptPath))

    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({ 
        success: false, 
        error: `Python脚本不存在: ${pythonScriptPath}，请确保文件位于正确位置` 
      })
    }

    console.log('请求数据:', JSON.stringify(requestData, null, 2))

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
        console.log('Python日志:', output)
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
        console.log('Python日志:', error)
      }
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('排班运行失败:', errorData)
        return res.status(500).json({ 
          success: false, 
          error: `排班算法执行失败: ${errorData}` 
        })
      }

      try {
        const result = JSON.parse(outputData)
        // 添加日志信息到返回结果
        result.logs = logData.split('\n').filter(line => line.trim())
        res.json({ success: true, data: result })
      } catch (error) {
        console.error('解析排班结果失败:', error)
        res.status(500).json({ 
          success: false, 
          error: `解析排班结果失败: ${error.message}` 
        })
      }
    })

    pythonProcess.stdin.write(JSON.stringify(requestData))
    pythonProcess.stdin.end()

  } catch (error) {
    console.error('排班运行失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
