import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../../../shared/database/index.mjs';
import { config } from '../../../config/index.mjs';

// 用户登录
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    // 从数据库获取用户
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    const user = rows[0];
    
    // 验证用户存在和密码正确
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

// 用户注册
async function register(req, res) {
  try {
    const { username, password, role } = req.body;
    
    // 检查用户是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // 创建新用户
    await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    
    res.status(201).json({ message: '用户注册成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

// 验证令牌
function verifyToken(req, res) {
  const token = req.body.token;
  
  if (!token) {
    return res.status(401).json({ valid: false, message: '未提供令牌' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: '无效的令牌' });
  }
}

export default { login, register, verifyToken };