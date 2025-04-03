import process from 'node:process'
import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await User.findByUsername(username)
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    )

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
    console.error('登录错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body

    // 验证角色是否有效
    const validRoles = ['employee', 'scheduler']
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: '无效的角色' })
    }

    const existingUser = await User.findByUsername(username)
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 使用默认角色 'employee' 如果未提供
    const userRole = role || 'employee'
    const userId = await User.create(username, password, userRole)
    res.status(201).json({ message: '注册成功', userId })
  }
  catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 添加验证token的路由
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({ message: 'Token不能为空' })
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 返回解析后的用户信息
    res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    })
  }
  catch (error) {
    console.error('Token验证错误:', error)
    // 如果token无效或过期
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ valid: false, message: 'Token无效或已过期' })
    }
    res.status(500).json({ valid: false, message: '服务器错误' })
  }
})

export default router
