import express from 'express'
import httpProxy from 'http-proxy'
import { config } from '../config/index.mjs'
import { verifyToken } from '../shared/utils/auth.mjs'

const app = express()
const PORT = config.gateway.port || 3000

// 调整请求日志中间件的位置
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  next()
})

// 解析JSON请求体 - 改进错误处理
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString()
      console.log(`[API Gateway] 请求体解析成功:`, req.rawBody) // 新增调试信息
    }
    catch (e) {
      console.error('无法读取请求体:', e)
      res.status(400).json({ error: '无效的请求体' })
    }
  },
  limit: '10mb',
}))

// 添加连接错误处理中间件
app.use((req, res, next) => {
  req.on('error', (err) => {
    console.error('[API Gateway] 请求连接错误:', err)
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
    console.error(`请求超时: ${req.method} ${req.originalUrl}`)
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
  schedules: config.services.schedule,
}).forEach(([name, service]) => {
  console.log(`正在配置服务代理: ${name} -> localhost:${service.port}`)
  console.log(`[配置详情] 服务名称: ${service.name} 路径前缀: /api/${name}`)

  const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${service.port}`,
    timeout: 30000,
    xfwd: true,
  })

  proxy.on('proxyReq', (proxyReq, req, res) => {
    console.log(`[API Gateway] 转发请求: ${req.method} ${req.originalUrl} -> ${service.name}(${service.port})`)
    console.log(`[API Gateway] 请求头:`, req.headers)

    if (req.body && req.method !== 'GET') {
      const bodyData = JSON.stringify(req.body)
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
      proxyReq.write(bodyData)
      console.log(`[API Gateway] 请求体:`, req.body)
    }
  })

  proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log(`[API Gateway] 收到响应: ${req.method} ${req.originalUrl}`)
    console.log(`[API Gateway] 响应状态码: ${proxyRes.statusCode}`)
    console.log(`[API Gateway] 响应头:`, proxyRes.headers)
  })

  proxy.on('error', (err, req, res) => {
    console.error(`[API Gateway Error] ${req.method} ${req.path}`)
    console.error('错误详情:', err)

    if (!res.headersSent) {
      res.status(502).json({ error: '服务连接失败', message: err.message })
    }
  })

  app.use(`/api/${name}`, (req, res) => {
    console.log(`[路由匹配] 请求路径: ${req.path} 匹配服务: ${name}`)
    // 处理路径重写
    req.url = req.url.replace(new RegExp(`^/api/${name}`), '')
    proxy.web(req, res)
  })

  console.log(`成功配置服务代理: ${name} -> localhost:${service.port}`)
})

// 添加全局错误处理中间件 - 改进错误处理
app.use((err, req, res, next) => {
  console.error('未处理的错误:', err)

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
  console.log(`API网关运行在端口 ${PORT}`)
  // 验证服务配置
  console.log('当前路由配置:')
  Object.entries({
    ...config.services,
    schedules: config.services.schedule,
  }).forEach(([name, service]) => {
    console.log(`/api/${name} -> localhost:${service.port}`)
  })
})

export default app
