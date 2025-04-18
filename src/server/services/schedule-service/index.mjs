import express from 'express'
import { config } from '../../config/index.mjs'
import scheduleRulesRouter from './schedule-rules.mjs'
import shiftAssignmentsRouter from './shift-assignments.mjs'

const app = express()
const PORT = config.services.schedule.port

app.use(express.json())

// 注册排班规则路由
app.use('/rules', scheduleRulesRouter)
// 注册班次分配路由
app.use('/assignments', shiftAssignmentsRouter)

// 启动服务器
app.listen(PORT, () => {
  console.log(`排班服务运行在端口 ${PORT}`)
})

export default app
