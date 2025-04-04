import { spawn } from 'node:child_process'
import process from 'node:process'
import dotenv from 'dotenv'
import { config } from './config/index.mjs'
import { testConnection } from './shared/database/index.mjs'
import { setupDatabase } from './shared/database/init.mjs'

// 加载环境变量
dotenv.config()

// 测试数据库连接并初始化
console.log('正在测试数据库连接...')
await testConnection()
console.log('正在初始化数据库...')
await setupDatabase()

// 启动API网关
console.log('正在启动API网关...')
const gatewayProcess = spawn('node', ['./api-gateway/index.mjs'], {
  stdio: 'inherit',
  cwd: import.meta.url.replace('file://', '').replace('server.mjs', ''),
})

// 启动各个微服务
const services = Object.values(config.services)
console.log(`准备启动 ${services.length} 个微服务...`)

const serviceProcesses = services.map((service) => {
  console.log(`启动服务: ${service.name} 在端口 ${service.port}`)

  const process = spawn('node', [`./services/${service.name}/index.mjs`], {
    stdio: 'inherit',
    cwd: import.meta.url.replace('file://', '').replace('server.mjs', ''),
  })

  return process
})

// 处理进程退出
process.on('SIGINT', () => {
  console.log('正在关闭所有服务...')

  gatewayProcess.kill()
  serviceProcesses.forEach(process => process.kill())

  process.exit(0)
})

console.log('所有服务已启动，按 Ctrl+C 停止')
