import express from 'express'
import { config } from '../../config/index.mjs'
import scheduleRulesRouter from './schedule-rules.mjs'
import schedulesRouter from './schedules.mjs'
import shiftsRouter from './shifts.mjs'

const app = express()
const PORT = config.services.schedule.port

app.use(express.json())

// 注册排班规则路由
app.use('/rules', scheduleRulesRouter)
// 注册排班表路由
app.use('', schedulesRouter)
// 注册班次表路由
app.use('/shifts', shiftsRouter)

// TODO: 实现排班规则配置接口
// TODO: 实现自动排班算法
// TODO: 实现排班冲突检测
// TODO: 实现排班调整和审批流程
// TODO: 实现排班历史记录查询

// 启动服务器
app.listen(PORT, () => {
  console.log(`排班服务运行在端口 ${PORT}`)
})

export default app
