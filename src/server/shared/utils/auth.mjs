import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../../config/index.mjs'

// 生成JWT令牌
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  )
}

// 验证JWT令牌
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret)
}

// 密码加密
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// 密码验证
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export { comparePassword, generateToken, hashPassword, verifyToken }
