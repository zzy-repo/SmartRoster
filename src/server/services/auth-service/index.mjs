import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'
import { comparePassword, generateToken, hashPassword } from '../../shared/utils/auth.mjs'

const app = express()
const PORT = config.services.auth.port

app.use(express.json())

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  })
})

// 用户登录
// 修改登录接口
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    console.log(`登录请求 - 用户名: ${username}`)

    if (!username || !password) {
      console.warn('登录失败: 用户名或密码为空')
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 查询用户
    console.log(`正在查询用户: ${username}`)
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    )

    if (users.length === 0) {
      console.warn(`用户不存在: ${username}`)
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const user = users[0]
    console.log(`找到用户: ${user.username}, 角色: ${user.role}`)

    // 验证密码
    console.log('正在验证密码')
    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      console.warn('密码验证失败')
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 生成令牌
    console.log('正在生成令牌')
    const token = generateToken(user)
    console.log('登录成功')

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    }) 
  }
  catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 修改注册接口
app.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body
    console.log(`注册请求 - 用户名: ${username}, 角色: ${role || '默认用户'}`)

    if (!username || !password) {
      console.warn('注册失败: 用户名或密码为空')
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 检查用户名是否已存在
    console.log(`正在检查用户名是否存在: ${username}`)
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    )

    if (existingUsers.length > 0) {
      console.warn(`用户名已存在: ${username}`)
      return res.status(400).json({ error: '用户名已存在' })
    }

    // 加密密码
    console.log('正在加密密码')
    const hashedPassword = await hashPassword(password)

    // 创建新用户
    console.log('正在创建新用户')
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role || 'user'],
    )

    console.log(`用户注册成功 - 用户ID: ${result.insertId}`)
    res.status(201).json({
      data: {
        message: '用户注册成功',
        userId: result.insertId,
      },
    }) 
  }
  catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 启动服务器
app.listen(PORT, '0.0.0.0', () => { // 明确指定监听所有网络接口
  console.log(`认证服务运行在端口 ${PORT}`)
  console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`) // 添加环境信息
})

export default app
