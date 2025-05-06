import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'

const app = express()
const PORT = config.services.employee.port

app.use(express.json())

/**
 * @api {get} /api/employee 获取所有员工
 * @apiName GetEmployees
 * @apiGroup Employee
 * @apiDescription 获取当前用户创建的所有员工的列表，包括其所属门店信息
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {object[]} data.employees 员工列表
 * @apiSuccess {number} data.employees.id 员工ID
 * @apiSuccess {string} data.employees.name 员工姓名
 * @apiSuccess {string} data.employees.phone 联系电话
 * @apiSuccess {string} data.employees.email 电子邮箱
 * @apiSuccess {string} data.employees.position 职位
 * @apiSuccess {number} data.employees.store_id 所属门店ID
 * @apiSuccess {string} data.employees.store_name 门店名称
 *
 * @apiError {string} error 错误信息
 */
app.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    const [employees] = await pool.query(`
      SELECT e.*, 
             st.name as store_name
      FROM employees e
      LEFT JOIN stores st ON e.store_id = st.id
      WHERE e.user_id = ?
      GROUP BY e.id
    `, [userId])
    
    res.json({ data: employees })
  }
  catch (error) {
    console.error('获取员工列表失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {get} /api/employee/:id 获取员工详情
 * @apiName GetEmployee
 * @apiGroup Employee
 * @apiDescription 根据ID获取指定员工的详细信息
 *
 * @apiParam {number} id 员工ID
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {number} data.id 员工ID
 * @apiSuccess {string} data.name 员工姓名
 * @apiSuccess {string} data.phone 联系电话
 * @apiSuccess {string} data.email 电子邮箱
 * @apiSuccess {string} data.position 职位
 * @apiSuccess {number} data.store_id 所属门店ID
 * @apiSuccess {string} data.store_name 门店名称
 * @apiSuccess {number} data.max_daily_hours 每日最大工作时数
 * @apiSuccess {number} data.max_weekly_hours 每周最大工作时数
 * @apiSuccess {number} data.workday_pref_start 偏好工作日起始值
 * @apiSuccess {number} data.workday_pref_end 偏好工作日结束值
 * @apiSuccess {string} data.time_pref_start 偏好工作时间起始值
 * @apiSuccess {string} data.time_pref_end 偏好工作时间结束值
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 员工不存在:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "员工不存在"
 *     }
 */
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [employees] = await pool.query(`
      SELECT e.*, 
             st.name as store_name
      FROM employees e
      LEFT JOIN stores st ON e.store_id = st.id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id])

    if (employees.length === 0) {
      return res.status(404).json({ error: '员工不存在' })
    }

    const employee = employees[0]

    res.json({ data: employee }) // 修改为统一格式
  }
  catch (error) {
    console.error('获取员工详情失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {post} /api/employee 创建员工
 * @apiName CreateEmployee
 * @apiGroup Employee
 * @apiDescription 创建新的员工记录，包括基本信息
 *
 * @apiBody {string} name 员工姓名
 * @apiBody {string} [phone] 联系电话
 * @apiBody {string} [email] 电子邮箱
 * @apiBody {string} position 职位
 * @apiBody {number} [store_id] 所属门店ID
 * @apiBody {number} [user_id] 关联用户ID
 * @apiBody {number} [max_daily_hours=8] 每日最大工作时数
 * @apiBody {number} [max_weekly_hours=40] 每周最大工作时数
 * @apiBody {number} [workday_pref_start=0] 偏好工作日起始值
 * @apiBody {number} [workday_pref_end=6] 偏好工作日结束值
 * @apiBody {string} [time_pref_start="08:00:00"] 偏好工作时间起始值
 * @apiBody {string} [time_pref_end="20:00:00"] 偏好工作时间结束值
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {string} data.message 成功消息
 * @apiSuccess {number} data.employeeId 新创建的员工ID
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 请求无效:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "员工姓名和职位不能为空"
 *     }
 */
app.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    const {
      name,
      phone,
      email,
      position,
      store_id,
      max_daily_hours,
      max_weekly_hours,
      workday_pref_start,
      workday_pref_end,
      time_pref_start,
      time_pref_end,
    } = req.body

    if (!name || !position) {
      return res.status(400).json({ error: '员工姓名和职位不能为空' })
    }

    // 检查用户是否已经绑定为员工
    const [existingEmployee] = await pool.query(
      'SELECT id FROM employees WHERE user_id = ?',
      [userId],
    )

    if (existingEmployee.length > 0) {
      return res.status(400).json({ error: '该用户已经绑定为员工' })
    }

    // 插入员工基本信息，自动绑定当前用户
    const [result] = await pool.query(
      `INSERT INTO employees (
        name, phone, email, position, store_id, user_id,
        max_daily_hours, max_weekly_hours,
        workday_pref_start, workday_pref_end,
        time_pref_start, time_pref_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        email,
        position,
        store_id,
        userId,
        max_daily_hours || 8,
        max_weekly_hours || 40,
        workday_pref_start || 0,
        workday_pref_end || 6,
        time_pref_start || '08:00:00',
        time_pref_end || '20:00:00',
      ],
    )

    const employeeId = result.insertId

    res.status(201).json({
      data: {
        message: '员工创建成功',
        id: employeeId,
      },
    })
  }
  catch (error) {
    console.error('创建员工失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {put} /api/employee/:id 更新员工
 * @apiName UpdateEmployee
 * @apiGroup Employee
 * @apiDescription 更新指定员工的信息，包括基本信息
 *
 * @apiParam {number} id 员工ID
 *
 * @apiBody {string} name 员工姓名
 * @apiBody {string} [phone] 联系电话
 * @apiBody {string} [email] 电子邮箱
 * @apiBody {string} position 职位
 * @apiBody {number} [store_id] 所属门店ID
 * @apiBody {number} [user_id] 关联用户ID
 * @apiBody {number} [max_daily_hours] 每日最大工作时数
 * @apiBody {number} [max_weekly_hours] 每周最大工作时数
 * @apiBody {number} [workday_pref_start] 偏好工作日起始值
 * @apiBody {number} [workday_pref_end] 偏好工作日结束值
 * @apiBody {string} [time_pref_start] 偏好工作时间起始值
 * @apiBody {string} [time_pref_end] 偏好工作时间结束值
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {string} data.message 成功消息
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 员工不存在:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "员工不存在"
 *     }
 */
app.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    const {
      name,
      phone,
      email,
      position,
      store_id,
      max_daily_hours,
      max_weekly_hours,
      workday_pref_start,
      workday_pref_end,
      time_pref_start,
      time_pref_end,
    } = req.body

    if (!name || !position) {
      return res.status(400).json({ error: '员工姓名和职位不能为空' })
    }

    // 检查员工是否存在且属于当前用户
    const [employee] = await pool.query(
      'SELECT id FROM employees WHERE id = ? AND user_id = ?',
      [id, userId],
    )

    if (!employee.length) {
      return res.status(404).json({ error: '员工不存在或无权修改' })
    }

    // 更新员工基本信息
    const [result] = await pool.query(
      `UPDATE employees SET
        name = ?, phone = ?, email = ?, position = ?, 
        store_id = ?,
        max_daily_hours = ?, max_weekly_hours = ?,
        workday_pref_start = ?, workday_pref_end = ?,
        time_pref_start = ?, time_pref_end = ?
      WHERE id = ? AND user_id = ?`,
      [
        name,
        phone,
        email,
        position,
        store_id,
        max_daily_hours,
        max_weekly_hours,
        workday_pref_start,
        workday_pref_end,
        time_pref_start,
        time_pref_end,
        id,
        userId,
      ],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '员工不存在或无权修改' })
    }

    res.json({ data: { message: '员工更新成功' } })
  }
  catch (error) {
    console.error('更新员工失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 删除员工
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 删除员工
    const [result] = await pool.query(
      'DELETE FROM employees WHERE id = ?',
      [id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '员工不存在' })
    }

    res.json({ data: { message: '员工删除成功' } }) // 修改为统一格式
  }
  catch (error) {
    console.error('删除员工失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// TODO: 实现员工技能管理接口
// TODO: 实现员工绩效评估系统
// TODO: 实现员工培训记录管理
// TODO: 实现员工请假管理系统
// TODO: 实现员工排班偏好设置接口

// 启动服务器
app.listen(PORT, () => {
  console.log(`员工服务运行在端口 ${PORT}`)
})

export default app
