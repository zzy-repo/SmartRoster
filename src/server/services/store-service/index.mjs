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
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {Object[]} data.stores 门店列表
 * @apiSuccess {Number} data.stores.id 门店ID
 * @apiSuccess {String} data.stores.name 门店名称
 * @apiSuccess {String} data.stores.area 门店区域
 * @apiSuccess {String} data.stores.address 门店地址
 * @apiSuccess {String} data.stores.phone 联系电话
 * @apiSuccess {Number} data.stores.manager_id 店长ID
 * 
 * @apiError {String} error 错误信息
 */
app.get('/', async (req, res) => {
  try {
    // 联表查询，计算每个门店的员工数量
    const [stores] = await pool.query(`
      SELECT 
        s.id, s.name, s.area, s.address, s.phone, s.manager_id, 
        COUNT(e.id) AS employeeCount
      FROM stores s
      LEFT JOIN employees e ON s.id = e.store_id
      GROUP BY s.id
    `)
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
 * @apiParam {Number} id 门店ID
 * 
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {Number} data.id 门店ID
 * @apiSuccess {String} data.name 门店名称
 * @apiSuccess {String} data.area 门店区域
 * @apiSuccess {String} data.address 门店地址
 * @apiSuccess {String} data.phone 联系电话
 * @apiSuccess {Number} data.manager_id 店长ID
 * 
 * @apiError {String} error 错误信息
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
    // 联表查询，计算指定门店的员工数量
    const [stores] = await pool.query(`
      SELECT 
        s.id, s.name, s.area, s.address, s.phone, s.manager_id, 
        COUNT(e.id) AS employeeCount
      FROM stores s
      LEFT JOIN employees e ON s.id = e.store_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [id])

    if (stores.length === 0) {
      return res.status(404).json({ error: '门店不存在' })
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
 * @apiBody {String} name 门店名称
 * @apiBody {String} [area] 门店区域
 * @apiBody {String} [address] 门店地址
 * @apiBody {String} [phone] 联系电话
 * @apiBody {Number} [manager_id] 店长ID
 * 
 * @apiSuccess {String} message 成功消息
 * @apiSuccess {Number} storeId 新创建的门店ID
 * 
 * @apiError {String} error 错误信息
 * 
 * @apiErrorExample {json} 请求无效:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "门店名称不能为空"
 *     }
 */
app.post('/', async (req, res) => {
  try {
    const { name, area, address, phone, manager_id } = req.body

    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' })
    }

    const [result] = await pool.query(
      'INSERT INTO stores (name, area, address, phone, manager_id) VALUES (?, ?, ?, ?, ?)',
      [name, area, address, phone, manager_id],
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
 * @apiParam {Number} id 门店ID
 * 
 * @apiBody {String} name 门店名称
 * @apiBody {String} [area] 门店区域
 * @apiBody {String} [address] 门店地址
 * @apiBody {String} [phone] 联系电话
 * @apiBody {Number} [manager_id] 店长ID
 * 
 * @apiSuccess {String} message 成功消息
 * 
 * @apiError {String} error 错误信息
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
    const { name, area, address, phone, manager_id } = req.body

    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' })
    }

    const [result] = await pool.query(
      'UPDATE stores SET name = ?, area = ?, address = ?, phone = ?, manager_id = ? WHERE id = ?',
      [name, area, address, phone, manager_id, id],
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
 * @apiParam {Number} id 门店ID
 * 
 * @apiSuccess {String} message 成功消息
 * 
 * @apiError {String} error 错误信息
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
 * @apiParam {Number} id 门店ID
 * 
 * @apiSuccess {Object[]} employees 员工列表
 * @apiSuccess {Number} employees.id 员工ID
 * @apiSuccess {String} employees.name 员工姓名
 * @apiSuccess {String} employees.position 职位
 * @apiSuccess {Number} employees.store_id 所属门店ID
 * 
 * @apiError {String} error 错误信息
 */
app.get('/:id/employees', async (req, res) => {
  try {
    const { id } = req.params

    const [employees] = await pool.query(
      'SELECT * FROM employees WHERE store_id = ?',
      [id],
    )

    res.json(employees)
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
