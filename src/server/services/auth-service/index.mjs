import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'
import { comparePassword, generateToken, hashPassword } from '../../shared/utils/auth.mjs'

const app = express()
const PORT = config.services.auth.port

app.use(express.json())

// 用户登录
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 查询用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    )

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const user = users[0]

    // 验证密码
    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 生成令牌
    const token = generateToken(user)

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  }
  catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 用户注册
app.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 检查用户名是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role || 'user'],
    )

    res.status(201).json({
      message: '用户注册成功',
      userId: result.insertId,
    })
  }
  catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`认证服务运行在端口 ${PORT}`)
})

export default app
