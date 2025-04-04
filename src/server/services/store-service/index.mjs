import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'

const app = express()
const PORT = config.services.store.port

app.use(express.json())

// 获取所有门店
app.get('/', async (req, res) => {
  try {
    const [stores] = await pool.query('SELECT * FROM stores')
    res.json({ data: stores }) // 修改为统一格式
  }
  catch (error) {
    console.error('获取门店列表失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取单个门店
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [stores] = await pool.query('SELECT * FROM stores WHERE id = ?', [id])

    if (stores.length === 0) {
      return res.status(404).json({ error: '门店不存在' })
    }

    res.json({ data: stores[0] }) // 修改为统一格式
  }
  catch (error) {
    console.error('获取门店详情失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 创建门店
app.post('/', async (req, res) => {
  try {
    const { name, address, phone, manager_id } = req.body

    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' })
    }

    const [result] = await pool.query(
      'INSERT INTO stores (name, address, phone, manager_id) VALUES (?, ?, ?, ?)',
      [name, address, phone, manager_id],
    )

    res.status(201).json({
      message: '门店创建成功',
      storeId: result.insertId,
    })
  }
  catch (error) {
    console.error('创建门店失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 更新门店
app.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, address, phone, manager_id } = req.body

    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' })
    }

    const [result] = await pool.query(
      'UPDATE stores SET name = ?, address = ?, phone = ?, manager_id = ? WHERE id = ?',
      [name, address, phone, manager_id, id],
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

// 删除门店
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

// 获取门店员工
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
