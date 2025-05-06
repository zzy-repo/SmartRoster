import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'

const app = express()
const PORT = config.services.store.port

app.use(express.json())

/**
 * @api {get} /api/store 获取所有门店
 * @apiName GetStores
 * @apiGroup Store
 * @apiDescription 获取系统中所有门店的列表
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {object[]} data.stores 门店列表
 * @apiSuccess {number} data.stores.id 门店ID
 * @apiSuccess {string} data.stores.name 门店名称
 * @apiSuccess {string} data.stores.area 门店区域
 * @apiSuccess {string} data.stores.address 门店地址
 * @apiSuccess {string} data.stores.phone 联系电话
 * @apiSuccess {number} data.stores.manager_id 店长ID
 *
 * @apiError {string} error 错误信息
 */
app.get('/', async (req, res) => {
  try {
    // 从请求头中获取用户ID
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回空列表
    if (!userId) {
      return res.json({ data: [] })
    }

    // 联表查询，计算每个门店的员工数量，并根据用户ID过滤
    const [stores] = await pool.query(`
      SELECT 
        s.id, s.name, s.area, s.address, s.phone, s.manager_id, 
        COUNT(e.id) AS employeeCount
      FROM stores s
      LEFT JOIN employees e ON s.id = e.store_id
      WHERE s.manager_id = ? OR e.user_id = ?
      GROUP BY s.id
    `, [userId, userId])
    
    res.json({ data: stores })
  }
  catch (error) {
    console.error('获取门店列表失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {get} /api/store/:id 获取门店详情
 * @apiName GetStore
 * @apiGroup Store
 * @apiDescription 根据ID获取指定门店的详细信息
 *
 * @apiParam {number} id 门店ID
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {number} data.id 门店ID
 * @apiSuccess {string} data.name 门店名称
 * @apiSuccess {string} data.area 门店区域
 * @apiSuccess {string} data.address 门店地址
 * @apiSuccess {string} data.phone 联系电话
 * @apiSuccess {number} data.manager_id 店长ID
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 门店不存在:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "门店不存在"
 *     }
 */
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    // 联表查询，计算指定门店的员工数量，并验证用户权限
    const [stores] = await pool.query(`
      SELECT 
        s.id, s.name, s.area, s.address, s.phone, s.manager_id, 
        COUNT(e.id) AS employeeCount
      FROM stores s
      LEFT JOIN employees e ON s.id = e.store_id
      WHERE s.id = ? AND (s.manager_id = ? OR e.user_id = ?)
      GROUP BY s.id
    `, [id, userId, userId])

    if (stores.length === 0) {
      return res.status(404).json({ error: '门店不存在或无权访问' })
    }

    res.json({ data: stores[0] })
  }
  catch (error) {
    console.error('获取门店详情失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {post} /api/store 创建门店
 * @apiName CreateStore
 * @apiGroup Store
 * @apiDescription 创建新的门店
 *
 * @apiBody {string} name 门店名称
 * @apiBody {string} [area] 门店区域
 * @apiBody {string} [address] 门店地址
 * @apiBody {string} [phone] 联系电话
 * @apiBody {number} [manager_id] 店长ID
 *
 * @apiSuccess {string} message 成功消息
 * @apiSuccess {number} storeId 新创建的门店ID
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 请求无效:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "门店名称不能为空"
 *     }
 */
app.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    const { name, area, address, phone } = req.body

    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' })
    }

    const [result] = await pool.query(
      'INSERT INTO stores (name, area, address, phone, manager_id) VALUES (?, ?, ?, ?, ?)',
      [name, area, address, phone, userId],
    )

    res.status(201).json({
      message: '门店创建成功',
      data: {
        id: result.insertId,
      },
    })
  }
  catch (error) {
    console.error('创建门店失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {put} /api/store/:id 更新门店
 * @apiName UpdateStore
 * @apiGroup Store
 * @apiDescription 更新指定门店的信息
 *
 * @apiParam {number} id 门店ID
 *
 * @apiBody {string} name 门店名称
 * @apiBody {string} [area] 门店区域
 * @apiBody {string} [address] 门店地址
 * @apiBody {string} [phone] 联系电话
 * @apiBody {number} [manager_id] 店长ID
 *
 * @apiSuccess {string} message 成功消息
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 门店不存在:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "门店不存在"
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

    const { name, area, address, phone } = req.body

    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' })
    }

    // 检查用户是否有权限更新门店
    const [store] = await pool.query('SELECT manager_id FROM stores WHERE id = ?', [id])
    if (!store.length) {
      return res.status(404).json({ error: '门店不存在' })
    }

    // 只有管理员或店长可以更新门店信息
    const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [userId])
    if (user[0].role !== 'admin' && store[0].manager_id !== userId) {
      return res.status(403).json({ error: '无权更新门店信息' })
    }

    const [result] = await pool.query(
      'UPDATE stores SET name = ?, area = ?, address = ?, phone = ? WHERE id = ?',
      [name, area, address, phone, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '门店不存在' })
    }

    res.json({ message: '门店更新成功' })
  }
  catch (error) {
    console.error('更新门店失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {delete} /api/store/:id 删除门店
 * @apiName DeleteStore
 * @apiGroup Store
 * @apiDescription 删除指定的门店
 *
 * @apiParam {number} id 门店ID
 *
 * @apiSuccess {string} message 成功消息
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 门店不存在:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "门店不存在"
 *     }
 *
 * @apiErrorExample {json} 删除失败:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "无法删除有员工关联的门店"
 *     }
 */
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    // 检查用户是否有权限删除门店
    const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [userId])
    if (!user.length || user[0].role !== 'admin') {
      return res.status(403).json({ error: '无权删除门店' })
    }

    // 检查门店是否有关联的员工
    const [employees] = await pool.query('SELECT COUNT(*) as count FROM employees WHERE store_id = ?', [id])

    if (employees[0].count > 0) {
      return res.status(400).json({ error: '无法删除有员工关联的门店' })
    }

    const [result] = await pool.query('DELETE FROM stores WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '门店不存在' })
    }

    res.json({ message: '门店删除成功' })
  }
  catch (error) {
    console.error('删除门店失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {get} /api/store/:id/employees 获取门店员工
 * @apiName GetStoreEmployees
 * @apiGroup Store
 * @apiDescription 获取指定门店的所有员工列表
 *
 * @apiParam {number} id 门店ID
 *
 * @apiSuccess {object[]} employees 员工列表
 * @apiSuccess {number} employees.id 员工ID
 * @apiSuccess {string} employees.name 员工姓名
 * @apiSuccess {string} employees.position 职位
 * @apiSuccess {number} employees.store_id 所属门店ID
 *
 * @apiError {string} error 错误信息
 */
app.get('/:id/employees', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id']
    
    // 如果没有用户ID，返回未授权
    if (!userId) {
      return res.status(401).json({ error: '未授权访问' })
    }

    // 检查用户是否有权限查看门店员工
    const [store] = await pool.query('SELECT manager_id FROM stores WHERE id = ?', [id])
    if (!store.length) {
      return res.status(404).json({ error: '门店不存在' })
    }

    // 只有管理员、店长或该门店的员工可以查看员工列表
    const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [userId])
    const [employee] = await pool.query('SELECT id FROM employees WHERE store_id = ? AND user_id = ?', [id, userId])
    
    if (user[0].role !== 'admin' && store[0].manager_id !== userId && !employee.length) {
      return res.status(403).json({ error: '无权查看门店员工' })
    }

    const [employees] = await pool.query(
      'SELECT e.*, u.username FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE e.store_id = ?',
      [id],
    )

    res.json({ data: employees })
  }
  catch (error) {
    console.error('获取门店员工失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})


// 启动服务器
app.listen(PORT, () => {
  console.log(`门店服务运行在端口 ${PORT}`)
})

export default app
