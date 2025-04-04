import { spawn } from 'node:child_process'
import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'

const app = express()
const PORT = config.services.schedule.port

app.use(express.json())

// 调用Python排班算法
function callPythonAlgorithm(endpoint, data) {
  return new Promise((resolve, reject) => {
    // 创建Python进程
    const pythonProcess = spawn('python3', [
      `${process.cwd()}/roster/run_api.py`,
      endpoint,
      JSON.stringify(data),
    ])

    let result = ''
    let error = ''

    // 收集标准输出
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString()
    })

    // 收集错误输出
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
    })

    // 进程结束
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python进程退出，错误码: ${code}, 错误: ${error}`))
      }
      else {
        try {
          resolve(JSON.parse(result))
        }
        catch (e) {
          reject(new Error(`解析Python输出失败: ${e.message}, 输出: ${result}`))
        }
      }
    })
  })
}

// 获取员工数据
async function getEmployees(storeId) {
  const [employees] = await pool.query(`
    SELECT e.*, 
           GROUP_CONCAT(s.name) as skills
    FROM employees e
    LEFT JOIN employee_skills es ON e.id = es.employee_id
    LEFT JOIN skills s ON es.skill_id = s.id
    WHERE e.store_id = ?
    GROUP BY e.id
  `, [storeId])

  // 转换为算法需要的格式
  return employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    position: emp.position,
    store: emp.store_id,
    workday_pref: [emp.workday_pref_start, emp.workday_pref_end],
    time_pref: [
      emp.time_pref_start.substring(0, 5),
      emp.time_pref_end.substring(0, 5),
    ],
    max_daily_hours: emp.max_daily_hours,
    max_weekly_hours: emp.max_weekly_hours,
    skills: emp.skills ? emp.skills.split(',') : [],
  }))
}

// 获取班次需求数据
async function getShifts(storeId, startDate, endDate) {
  // 从数据库获取预先定义的班次需求
  const [shifts] = await pool.query(`
    SELECT * FROM shift_requirements
    WHERE store_id = ? AND date BETWEEN ? AND ?
    ORDER BY date, start_time
  `, [storeId, startDate, endDate])

  // 如果没有预定义的班次需求，则从预测服务获取
  if (shifts.length === 0) {
    try {
      // 调用预测服务的API获取班次需求
      const response = await fetch(`http://localhost:${config.services.forecast.port}/shifts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          startDate,
          endDate,
        }),
      })

      if (!response.ok) {
        throw new Error(`预测服务返回错误: ${response.status}`)
      }

      const data = await response.json()
      return data.shifts
    }
    catch (error) {
      console.error('获取预测班次需求失败:', error)
      // 返回空数组，或者可以生成一些默认的班次需求
      return []
    }
  }

  // 转换为算法需要的格式
  return shifts.map(shift => ({
    id: shift.id,
    day: new Date(shift.date).getDay(),
    date: shift.date,
    start_time: shift.start_time.substring(0, 5),
    end_time: shift.end_time.substring(0, 5),
    required_positions: JSON.parse(shift.required_positions),
    store: shift.store_id,
  }))
}

// 保存排班结果到数据库
async function saveSchedule(storeId, startDate, endDate, assignments) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // 创建排班表记录
    const [scheduleResult] = await connection.query(
      'INSERT INTO schedules (store_id, start_date, end_date, created_at) VALUES (?, ?, ?, NOW())',
      [storeId, startDate, endDate],
    )

    const scheduleId = scheduleResult.insertId

    // 保存排班分配
    for (const assignment of assignments) {
      await connection.query(
        'INSERT INTO schedule_assignments (schedule_id, employee_id, shift_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
        [
          scheduleId,
          assignment.employee_id,
          assignment.shift_id,
          assignment.date,
          assignment.start_time,
          assignment.end_time,
        ],
      )
    }

    await connection.commit()
    return scheduleId
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

// 修改生成排班表接口
app.post('/generate', async (req, res) => {
  try {
    const { storeId, startDate, endDate, saConfig, costParams } = req.body

    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 获取员工数据
    const employees = await getEmployees(storeId)

    if (employees.length === 0) {
      return res.status(404).json({ error: '未找到员工数据' })
    }

    // 获取班次需求数据
    const shifts = await getShifts(storeId, startDate, endDate)

    if (shifts.length === 0) {
      return res.status(404).json({ error: '未找到班次需求数据' })
    }

    // 调用Python算法
    const algorithmData = {
      employees,
      shifts,
      sa_config: saConfig || {
        initial_temp: 50.0,
        min_temp: 0.5,
        cooling_rate: 0.9,
        iter_per_temp: 10,
        iterations: 100,
      },
      cost_params: costParams || {
        understaff_penalty: 100,
        workday_violation: 10,
        time_pref_violation: 5,
        daily_hours_violation: 20,
        weekly_hours_violation: 50,
      },
    }

    const result = await callPythonAlgorithm('generate', algorithmData)

    // 保存排班结果到数据库
    const scheduleId = await saveSchedule(storeId, startDate, endDate, result.assignments)

    res.json({
      scheduleId,
      ...result,
    })
  }
  catch (error) {
    console.error('生成排班表失败:', error)
    res.status(500).json({ error: '服务器错误', message: error.message })
  }
})

// 获取排班表详情
async function getScheduleDetails(scheduleId) {
  // 获取排班表基本信息
  const [schedules] = await pool.query(
    'SELECT * FROM schedules WHERE id = ?',
    [scheduleId],
  )

  if (schedules.length === 0) {
    throw new Error('排班表不存在')
  }

  const schedule = schedules[0]

  // 获取排班分配
  const [assignments] = await pool.query(`
    SELECT sa.*, e.name as employee_name, e.position
    FROM schedule_assignments sa
    JOIN employees e ON sa.employee_id = e.id
    WHERE sa.schedule_id = ?
    ORDER BY sa.date, sa.start_time
  `, [scheduleId])

  return {
    ...schedule,
    assignments,
  }
}

// 优化排班表
app.post('/optimize', async (req, res) => {
  try {
    const { scheduleId, saConfig, costParams } = req.body

    if (!scheduleId) {
      return res.status(400).json({ error: '缺少排班表ID' })
    }

    // 从数据库获取现有排班表
    const schedule = await getScheduleDetails(scheduleId)

    // 获取员工数据
    const employees = await getEmployees(schedule.store_id)

    // 获取班次需求
    const shifts = await getShifts(
      schedule.store_id,
      schedule.start_date,
      schedule.end_date,
    )

    // 转换排班分配为算法需要的格式
    const currentAssignments = schedule.assignments.map(assignment => ({
      employee_id: assignment.employee_id,
      shift_id: assignment.shift_id,
      date: assignment.date,
      start_time: assignment.start_time.substring(0, 5),
      end_time: assignment.end_time.substring(0, 5),
    }))

    // 调用Python算法
    const algorithmData = {
      employees,
      shifts,
      current_assignments: currentAssignments,
      sa_config: saConfig || {
        initial_temp: 50.0,
        min_temp: 0.5,
        cooling_rate: 0.9,
        iter_per_temp: 10,
        iterations: 100,
      },
      cost_params: costParams || {
        understaff_penalty: 100,
        workday_violation: 10,
        time_pref_violation: 5,
        daily_hours_violation: 20,
        weekly_hours_violation: 50,
      },
    }

    const result = await callPythonAlgorithm('optimize', algorithmData)

    // 更新数据库中的排班表
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // 删除原有分配
      await connection.query(
        'DELETE FROM schedule_assignments WHERE schedule_id = ?',
        [scheduleId],
      )

      // 保存新的分配
      for (const assignment of result.assignments) {
        await connection.query(
          'INSERT INTO schedule_assignments (schedule_id, employee_id, shift_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
          [
            scheduleId,
            assignment.employee_id,
            assignment.shift_id,
            assignment.date,
            assignment.start_time,
            assignment.end_time,
          ],
        )
      }

      // 更新排班表的修改时间
      await connection.query(
        'UPDATE schedules SET updated_at = NOW() WHERE id = ?',
        [scheduleId],
      )

      await connection.commit()
    }
    catch (error) {
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }

    res.json({
      scheduleId,
      ...result,
    })
  }
  catch (error) {
    console.error('优化排班表失败:', error)
    res.status(500).json({ error: '服务器错误', message: error.message })
  }
})

// 手动分配班次
app.post('/assign', async (req, res) => {
  try {
    const { scheduleId, shiftId, employeeId, date, startTime, endTime } = req.body

    if (!scheduleId || !shiftId || !employeeId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 验证排班表是否存在
    const [schedules] = await pool.query(
      'SELECT * FROM schedules WHERE id = ?',
      [scheduleId],
    )

    if (schedules.length === 0) {
      return res.status(404).json({ error: '排班表不存在' })
    }

    // 验证员工是否存在
    const [employees] = await pool.query(
      'SELECT * FROM employees WHERE id = ?',
      [employeeId],
    )

    if (employees.length === 0) {
      return res.status(404).json({ error: '员工不存在' })
    }

    // 验证班次是否存在
    const [shifts] = await pool.query(
      'SELECT * FROM shift_requirements WHERE id = ?',
      [shiftId],
    )

    if (shifts.length === 0) {
      return res.status(404).json({ error: '班次不存在' })
    }

    // 检查是否有冲突的排班
    const [conflicts] = await pool.query(`
      SELECT * FROM schedule_assignments
      WHERE schedule_id = ? AND employee_id = ? AND date = ?
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `, [scheduleId, employeeId, date, startTime, startTime, endTime, endTime, startTime, endTime])

    if (conflicts.length > 0) {
      return res.status(400).json({ error: '该员工在所选时间段已有排班' })
    }

    // 更新数据库中的排班分配
    await pool.query(
      'INSERT INTO schedule_assignments (schedule_id, employee_id, shift_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [scheduleId, employeeId, shiftId, date, startTime, endTime],
    )

    // 更新排班表的修改时间
    await pool.query(
      'UPDATE schedules SET updated_at = NOW() WHERE id = ?',
      [scheduleId],
    )

    // 验证分配是否合理（可以调用Python算法验证）
    // 这里简化处理，实际应用中可以调用Python算法验证

    res.json({ message: '班次分配成功' })
  }
  catch (error) {
    console.error('分配班次失败:', error)
    res.status(500).json({ error: '服务器错误', message: error.message })
  }
})

// 获取排班表
app.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params
    const { startDate, endDate, view } = req.query

    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 从数据库获取排班表
    const [schedules] = await pool.query(`
      SELECT * FROM schedules
      WHERE store_id = ? AND 
      ((start_date BETWEEN ? AND ?) OR
       (end_date BETWEEN ? AND ?) OR
       (start_date <= ? AND end_date >= ?))
      ORDER BY created_at DESC
    `, [storeId, startDate, endDate, startDate, endDate, startDate, endDate])

    if (schedules.length === 0) {
      return res.json({ schedules: [] })
    }

    // 获取最新的排班表详情
    const latestSchedule = schedules[0]
    const scheduleDetails = await getScheduleDetails(latestSchedule.id)

    // 根据视图类型格式化数据
    let formattedSchedule

    if (view === 'employee') {
      // 按员工分组
      const employeeMap = new Map()

      for (const assignment of scheduleDetails.assignments) {
        if (!employeeMap.has(assignment.employee_id)) {
          employeeMap.set(assignment.employee_id, {
            id: assignment.employee_id,
            name: assignment.employee_name,
            position: assignment.position,
            shifts: [],
          })
        }

        employeeMap.get(assignment.employee_id).shifts.push({
          date: assignment.date,
          start_time: assignment.start_time,
          end_time: assignment.end_time,
          shift_id: assignment.shift_id,
        })
      }

      formattedSchedule = {
        id: scheduleDetails.id,
        store_id: scheduleDetails.store_id,
        start_date: scheduleDetails.start_date,
        end_date: scheduleDetails.end_date,
        employees: Array.from(employeeMap.values()),
      }
    }
    else if (view === 'day') {
      // 按日期分组
      const dayMap = new Map()

      for (const assignment of scheduleDetails.assignments) {
        if (!dayMap.has(assignment.date)) {
          dayMap.set(assignment.date, [])
        }

        dayMap.get(assignment.date).push({
          employee_id: assignment.employee_id,
          employee_name: assignment.employee_name,
          position: assignment.position,
          start_time: assignment.start_time,
          end_time: assignment.end_time,
          shift_id: assignment.shift_id,
        })
      }

      formattedSchedule = {
        id: scheduleDetails.id,
        store_id: scheduleDetails.store_id,
        start_date: scheduleDetails.start_date,
        end_date: scheduleDetails.end_date,
        days: Array.from(dayMap.entries()).map(([date, shifts]) => ({
          date,
          shifts,
        })),
      }
    }
    else {
      // 默认视图，返回原始数据
      formattedSchedule = scheduleDetails
    }

    res.json({ schedule: formattedSchedule })
  }
  catch (error) {
    console.error('获取排班表失败:', error)
    res.status(500).json({ error: '服务器错误', message: error.message })
  }
})

// 删除排班表
app.delete('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params

    // 验证排班表是否存在
    const [schedules] = await pool.query(
      'SELECT * FROM schedules WHERE id = ?',
      [scheduleId],
    )

    if (schedules.length === 0) {
      return res.status(404).json({ error: '排班表不存在' })
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // 删除排班分配
      await connection.query(
        'DELETE FROM schedule_assignments WHERE schedule_id = ?',
        [scheduleId],
      )

      // 删除排班表
      await connection.query(
        'DELETE FROM schedules WHERE id = ?',
        [scheduleId],
      )

      await connection.commit()
    }
    catch (error) {
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }

    res.json({ message: '排班表删除成功' })
  }
  catch (error) {
    console.error('删除排班表失败:', error)
    res.status(500).json({ error: '服务器错误', message: error.message })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`排班服务运行在端口 ${PORT}`)
})

export default app
