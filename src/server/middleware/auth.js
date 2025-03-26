import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  }
  catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' })
  }
}
