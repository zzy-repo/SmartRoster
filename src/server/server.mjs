import process from 'node:process'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { verifyToken } from './middleware/auth.js'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 认证路由
app.use('/api/auth', authRoutes)

// 受保护的路由示例
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: '这是受保护的路由', user: req.user })
})

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
})
