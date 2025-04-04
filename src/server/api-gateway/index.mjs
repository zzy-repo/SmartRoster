import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/index.mjs'
import { verifyToken } from '../shared/utils/auth.mjs'

const app = express()
const PORT = config.gateway.port || 3000

// 解析JSON请求体
app.use(express.json())

// 跨域设置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// 认证中间件 - 除了登录和注册接口外都需要验证token
app.use((req, res, next) => {
  // 不需要验证token的路径
  const publicPaths = ['/api/auth/login', '/api/auth/register']

  if (publicPaths.includes(req.path)) {
    return next()
  }

  // 验证token
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  }
  catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' })
  }
})

// 路由到各个微服务
Object.entries(config.services).forEach(([name, service]) => {
  app.use(
    `/api/${name}`,
    createProxyMiddleware({
      target: `http://localhost:${service.port}`,
      pathRewrite: { [`^/api/${name}`]: '' },
      changeOrigin: true,
    }),
  )
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`API网关运行在端口 ${PORT}`)
})

export default app
