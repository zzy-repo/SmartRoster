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
 * @apiDescription 获取系统中所有员工的列表，包括其技能和所属门店信息
 * 
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {Object[]} data.employees 员工列表
 * @apiSuccess {Number} data.employees.id 员工ID
 * @apiSuccess {String} data.employees.name 员工姓名
 * @apiSuccess {String} data.employees.phone 联系电话
 * @apiSuccess {String} data.employees.email 电子邮箱
 * @apiSuccess {String} data.employees.position 职位
 * @apiSuccess {Number} data.employees.store_id 所属门店ID
 * @apiSuccess {String} data.employees.store_name 门店名称
 * @apiSuccess {String[]} data.employees.skills 技能列表
 * 
 * @apiError {String} error 错误信息
 */
app.get('/', async (req, res) => {
  try {
    const [employees] = await pool.query(`
      SELECT e.*, 
             GROUP_CONCAT(s.name) as skills,
             st.name as store_name
      FROM employees e
      LEFT JOIN employee_skills es ON e.id = es.employee_id
      LEFT JOIN skills s ON es.skill_id = s.id
      LEFT JOIN stores st ON e.store_id = st.id
      GROUP BY e.id
    `)
    res.json({ data: employees }) // 修改为统一格式
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
 * @apiParam {Number} id 员工ID
 * 
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {Number} data.id 员工ID
 * @apiSuccess {String} data.name 员工姓名
 * @apiSuccess {String} data.phone 联系电话
 * @apiSuccess {String} data.email 电子邮箱
 * @apiSuccess {String} data.position 职位
 * @apiSuccess {Number} data.store_id 所属门店ID
 * @apiSuccess {String} data.store_name 门店名称
 * @apiSuccess {String[]} data.skills 技能列表
 * @apiSuccess {Number} data.max_daily_hours 每日最大工作时数
 * @apiSuccess {Number} data.max_weekly_hours 每周最大工作时数
 * @apiSuccess {Number} data.workday_pref_start 偏好工作日起始值
 * @apiSuccess {Number} data.workday_pref_end 偏好工作日结束值
 * @apiSuccess {String} data.time_pref_start 偏好工作时间起始值
 * @apiSuccess {String} data.time_pref_end 偏好工作时间结束值
 * 
 * @apiError {String} error 错误信息
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
             GROUP_CONCAT(s.name) as skills,
             st.name as store_name
      FROM employees e
      LEFT JOIN employee_skills es ON e.id = es.employee_id
      LEFT JOIN skills s ON es.skill_id = s.id
      LEFT JOIN stores st ON e.store_id = st.id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id])

    if (employees.length === 0) {
      return res.status(404).json({ error: '员工不存在' })
    }

    // 处理技能列表
    const employee = employees[0]
    employee.skills = employee.skills ? employee.skills.split(',') : []

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
 * @apiDescription 创建新的员工记录，包括基本信息和技能设置
 * 
 * @apiBody {String} name 员工姓名
 * @apiBody {String} [phone] 联系电话
 * @apiBody {String} [email] 电子邮箱
 * @apiBody {String} position 职位
 * @apiBody {Number} [store_id] 所属门店ID
 * @apiBody {Number} [user_id] 关联用户ID
 * @apiBody {Number} [max_daily_hours=8] 每日最大工作时数
 * @apiBody {Number} [max_weekly_hours=40] 每周最大工作时数
 * @apiBody {Number} [workday_pref_start=0] 偏好工作日起始值
 * @apiBody {Number} [workday_pref_end=6] 偏好工作日结束值
 * @apiBody {String} [time_pref_start="08:00:00"] 偏好工作时间起始值
 * @apiBody {String} [time_pref_end="20:00:00"] 偏好工作时间结束值
 * @apiBody {String[]} [skills] 技能列表
 * 
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {String} data.message 成功消息
 * @apiSuccess {Number} data.employeeId 新创建的员工ID
 * 
 * @apiError {String} error 错误信息
 * 
 * @apiErrorExample {json} 请求无效:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "员工姓名和职位不能为空"
 *     }
 */
app.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      position,
      store_id,
      user_id,
      max_daily_hours,
      max_weekly_hours,
      workday_pref_start,
      workday_pref_end,
      time_pref_start,
      time_pref_end,
      skills,
    } = req.body

    if (!name || !position) {
      return res.status(400).json({ error: '员工姓名和职位不能为空' })
    }

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 插入员工基本信息
      const [result] = await connection.query(
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
          user_id,
          max_daily_hours || 8,
          max_weekly_hours || 40,
          workday_pref_start || 0,
          workday_pref_end || 6,
          time_pref_start || '08:00:00',
          time_pref_end || '20:00:00',
        ],
      )

      const employeeId = result.insertId

      // 如果有技能，添加员工技能关联
      if (skills && skills.length > 0) {
        // 获取所有技能ID
        const [skillRows] = await connection.query(
          'SELECT id, name FROM skills WHERE name IN (?)',
          [skills],
        )

        const skillMap = skillRows.reduce((map, skill) => {
          map[skill.name] = skill.id
          return map
        }, {})

        // 添加员工技能关联
        for (const skillName of skills) {
          const skillId = skillMap[skillName]
          if (skillId) {
            await connection.query(
              'INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)',
              [employeeId, skillId],
            )
          }
        }
      }

      // 提交事务
      await connection.commit()

      res.status(201).json({
        data: {
          message: '员工创建成功',
          employeeId,
        },
      }) // 修改为统一格式
    }
    catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }
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
 * @apiDescription 更新指定员工的信息，包括基本信息和技能设置
 * 
 * @apiParam {Number} id 员工ID
 * 
 * @apiBody {String} name 员工姓名
 * @apiBody {String} [phone] 联系电话
 * @apiBody {String} [email] 电子邮箱
 * @apiBody {String} position 职位
 * @apiBody {Number} [store_id] 所属门店ID
 * @apiBody {Number} [user_id] 关联用户ID
 * @apiBody {Number} [max_daily_hours] 每日最大工作时数
 * @apiBody {Number} [max_weekly_hours] 每周最大工作时数
 * @apiBody {Number} [workday_pref_start] 偏好工作日起始值
 * @apiBody {Number} [workday_pref_end] 偏好工作日结束值
 * @apiBody {String} [time_pref_start] 偏好工作时间起始值
 * @apiBody {String} [time_pref_end] 偏好工作时间结束值
 * @apiBody {String[]} [skills] 技能列表
 * 
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {String} data.message 成功消息
 * 
 * @apiError {String} error 错误信息
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
    const {
      name,
      phone,
      email,
      position,
      store_id,
      user_id,
      max_daily_hours,
      max_weekly_hours,
      workday_pref_start,
      workday_pref_end,
      time_pref_start,
      time_pref_end,
      skills,
    } = req.body

    if (!name || !position) {
      return res.status(400).json({ error: '员工姓名和职位不能为空' })
    }

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 更新员工基本信息
      const [result] = await connection.query(
        `UPDATE employees SET
          name = ?, phone = ?, email = ?, position = ?, 
          store_id = ?, user_id = ?,
          max_daily_hours = ?, max_weekly_hours = ?,
          workday_pref_start = ?, workday_pref_end = ?,
          time_pref_start = ?, time_pref_end = ?
        WHERE id = ?`,
        [
          name,
          phone,
          email,
          position,
          store_id,
          user_id,
          max_daily_hours,
          max_weekly_hours,
          workday_pref_start,
          workday_pref_end,
          time_pref_start,
          time_pref_end,
          id,
        ],
      )

      if (result.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({ error: '员工不存在' })
      }

      // 如果提供了技能，更新员工技能关联
      if (skills) {
        // 删除现有技能关联
        await connection.query(
          'DELETE FROM employee_skills WHERE employee_id = ?',
          [id],
        )

        if (skills.length > 0) {
          // 获取所有技能ID
          const [skillRows] = await connection.query(
            'SELECT id, name FROM skills WHERE name IN (?)',
            [skills],
          )

          const skillMap = skillRows.reduce((map, skill) => {
            map[skill.name] = skill.id
            return map
          }, {})

          // 添加新的员工技能关联
          for (const skillName of skills) {
            const skillId = skillMap[skillName]
            if (skillId) {
              await connection.query(
                'INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)',
                [id, skillId],
              )
            }
          }
        }
      }

      // 提交事务
      await connection.commit()

      res.json({ message: '员工更新成功' })
    }
    catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }
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

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 删除员工技能关联
      await connection.query(
        'DELETE FROM employee_skills WHERE employee_id = ?',
        [id],
      )

      // 删除员工
      const [result] = await connection.query(
        'DELETE FROM employees WHERE id = ?',
        [id],
      )

      if (result.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({ error: '员工不存在' })
      }

      // 提交事务
      await connection.commit()

      res.json({ message: '员工删除成功' })
    }
    catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }
  }
  catch (error) {
    console.error('删除员工失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取所有技能
app.get('/skills/all', async (req, res) => {
  try {
    const [skills] = await pool.query('SELECT * FROM skills')
    res.json(skills)
  }
  catch (error) {
    console.error('获取技能列表失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 添加技能
app.post('/skills', async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: '技能名称不能为空' })
    }

    const [result] = await pool.query(
      'INSERT INTO skills (name) VALUES (?)',
      [name],
    )

    res.status(201).json({
      message: '技能添加成功',
      skillId: result.insertId,
    })
  }
  catch (error) {
    console.error('添加技能失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`员工服务运行在端口 ${PORT}`)
})

export default app
