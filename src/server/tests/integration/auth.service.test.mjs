import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../services/auth-service/index.mjs'
import { setupTestEnv } from '../setup.mjs'
import { clearDatabase, closeDatabase } from '../utils/db.mjs'

// 设置测试环境
setupTestEnv()

describe('Auth Service API', () => {
  beforeAll(async () => {
    // 清空测试数据库
    await clearDatabase()
  })

  afterAll(async () => {
    // 关闭数据库连接
    await closeDatabase()
  })

  describe('POST /register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'employee'
        })
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('message', '用户注册成功')
    })

    it('应该拒绝重复的用户名', async () => {
      // 先注册一个用户
      await request(app)
        .post('/register')
        .send({
          username: 'duplicateuser',
          password: 'password123',
          role: 'employee'
        })
      
      // 尝试注册相同用户名
      const response = await request(app)
        .post('/register')
        .send({
          username: 'duplicateuser',
          password: 'password456',
          role: 'employee'
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', '用户名已存在')
    })
  })

  describe('POST /login', () => {
    it('应该成功登录并返回token', async () => {
      // 先注册一个用户
      await request(app)
        .post('/register')
        .send({
          username: 'loginuser',
          password: 'password123',
          role: 'employee'
        })
      
      // 尝试登录
      const response = await request(app)
        .post('/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
    })

    it('应该拒绝错误的凭据', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        })
      
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message', '用户名或密码错误')
    })
  })

  // 可以添加更多测试...
})