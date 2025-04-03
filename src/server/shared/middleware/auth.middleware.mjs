import jwt from 'jsonwebtoken';
import { config } from '../../config/index.mjs';

/**
 * 认证中间件
 * 验证请求头中的JWT令牌
 */
const authMiddleware = (req, res, next) => {
  // 获取请求头中的token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '无效的令牌' });
  }
};

export default authMiddleware;