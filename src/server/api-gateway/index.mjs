import express from 'express'
import httpProxy from 'http-proxy'
import { config } from '../config/index.mjs'
import { verifyToken } from '../shared/utils/auth.mjs'

const app = express()
const PORT = config.gateway.port || 3000

// 调整请求日志中间件的位置
app.use((req, res, next) => {
  // 只记录非OPTIONS和非GET请求
  if (req.method !== 'OPTIONS' && req.method !== 'GET') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  }
  next()
})

// 解析JSON请求体 - 改进错误处理
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString()
    }
    catch (e) {
      console.error('请求体解析失败')
      res.status(400).json({ error: '无效的请求体' })
    }
  },
  limit: '10mb',
}))

// 添加连接错误处理中间件
app.use((req, res, next) => {
  req.on('error', (err) => {
    console.error('请求连接错误')
    if (!res.headersSent) {
      res.status(400).json({ error: '请求连接错误' })
    }
  })
  next()
})

// 跨域设置 - 移到前面处理
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// 添加请求超时中间件
app.use((req, res, next) => {
  req.setTimeout(5000, () => {
    console.error('请求超时')
    res.status(504).send('请求超时')
  })
  next()
})

// 认证中间件
app.use((req, res, next) => {
  // 放行认证相关路径
  if (['/api/auth/login', '/api/auth/register'].some(p => req.path.startsWith(p)))
    return next()

  // 验证令牌
  const token = req.headers.authorization?.split(' ')[1]
  if (!token)
    return res.status(401).json({ error: '未提供认证令牌' })

  try {
    req.user = verifyToken(token)
    // 如需角色验证可在此添加
    next()
  }
  catch {
    res.status(401).json({ error: '无效的认证令牌' })
  }
})

// 遍历配置中的服务，为每个服务创建代理中间件
Object.entries({
  ...config.services,
  schedule: config.services.schedule,
}).forEach(([name, service]) => {
  const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${service.port}`,
    timeout: 30000,
    xfwd: true,
  })

  proxy.on('proxyReq', (proxyReq, req, res) => {
    if (req.method !== 'GET') {
      const bodyData = JSON.stringify(req.body)
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
      proxyReq.write(bodyData)
    }
  })

  proxy.on('error', (err, req, res) => {
    console.error(`服务连接失败: ${name}`)
    if (!res.headersSent) {
      res.status(502).json({ error: '服务连接失败', message: err.message })
    }
  })

  app.use(`/api/${name}`, (req, res) => {
    req.url = req.url.replace(new RegExp(`^/api/${name}`), '')
    proxy.web(req, res)
  })
})

// 添加全局错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: '无效的JSON格式' })
  }
  if (err.message === 'request aborted' || err.type === 'request.aborted') {
    return res.status(408).json({ error: '请求处理中断' })
  }
  if (err.code === 'ECONNRESET') {
    return res.status(504).json({ error: '连接重置' })
  }

  if (!res.headersSent) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 在服务器启动前添加调试日志
app.listen(PORT, () => {
  console.log(`\nAPI网关运行在端口 ${PORT}`)
  console.log('服务路由配置:')
  Object.entries({
    ...config.services,
    schedules: config.services.schedule,
  }).forEach(([name, service]) => {
    console.log(`  /api/${name} -> localhost:${service.port}`)
  })
  console.log('\n按 Ctrl+C 停止服务\n')
})

export default app
