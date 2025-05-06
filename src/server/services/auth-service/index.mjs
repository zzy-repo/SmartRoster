import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'
import { comparePassword, generateToken, hashPassword } from '../../shared/utils/auth.mjs'

const app = express()
const PORT = config.services.auth.port

app.use(express.json())

/**
 * @api {get} /api/auth/health 健康检查
 * @apiName HealthCheck
 * @apiGroup Auth
 * @apiDescription 检查认证服务的运行状态
 *
 * @apiSuccess {string} status 服务状态
 * @apiSuccess {string} timestamp 当前时间戳
 *
 * @apiSuccessExample {json} 成功响应:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "UP",
 *       "timestamp": "2024-01-01T12:00:00.000Z"
 *     }
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  })
})

/**
 * @api {post} /api/auth/login 用户登录
 * @apiName Login
 * @apiGroup Auth
 * @apiDescription 用户登录接口，验证用户身份并返回访问令牌
 *
 * @apiBody {string} username 用户名
 * @apiBody {string} password 密码
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {string} data.token JWT访问令牌
 * @apiSuccess {object} data.user 用户信息
 * @apiSuccess {number} data.user.id 用户ID
 * @apiSuccess {string} data.user.username 用户名
 * @apiSuccess {string} data.user.role 用户角色
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 验证失败:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "用户名或密码错误"
 *     }
 *
 * @apiErrorExample {json} 请求无效:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "用户名和密码不能为空"
 *     }
 */
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
    console.error('登录失败')
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {post} /api/auth/register 用户注册
 * @apiName Register
 * @apiGroup Auth
 * @apiDescription 创建新用户账户
 *
 * @apiBody {string} username 用户名
 * @apiBody {string} password 密码
 * @apiBody {string} [role] 用户角色（可选）
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {string} data.token JWT访问令牌
 * @apiSuccess {object} data.user 用户信息
 * @apiSuccess {number} data.user.id 用户ID
 * @apiSuccess {string} data.user.username 用户名
 * @apiSuccess {string} data.user.role 用户角色
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 用户名已存在:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "用户名已存在"
 *     }
 *
 * @apiErrorExample {json} 请求无效:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "用户名和密码不能为空"
 *     }
 */
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

    // 验证角色
    const validRoles = ['admin', 'manager', 'staff']
    const userRole = role && validRoles.includes(role) ? role : 'staff'

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, userRole],
    )

    // 返回用户信息
    const [newUser] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [result.insertId])

    res.status(201).json({
      data: {
        message: '用户注册成功',
        userId: result.insertId,
        user: newUser[0],
      },
    })
  }
  catch (error) {
    console.error('注册失败')
    res.status(500).json({ error: '服务器错误' })
  }
})

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`认证服务运行在端口 ${PORT}`)
})

export default app
