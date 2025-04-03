import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import authController from '../../services/auth-service/controllers/auth.controller.mjs'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { pool } from '../../shared/database/index.mjs'

// 修复模拟依赖
vi.mock('../../shared/database/index.mjs', () => ({
  pool: {
    execute: vi.fn()
  }
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn()
  },
  sign: vi.fn(),
  verify: vi.fn()
}))

vi.mock('bcryptjs', () => ({
  default: {
    compareSync: vi.fn(),
    hashSync: vi.fn()
  },
  compareSync: vi.fn(),
  hashSync: vi.fn()
}))

describe('Auth Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {}
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('应该在用户名和密码正确时返回token', async () => {
      // 准备测试数据
      req.body = { username: 'testuser', password: 'password123' }
      
      // 模拟数据库返回
      pool.execute.mockResolvedValueOnce([[{ id: 1, username: 'testuser', password: 'hashedpassword', role: 'admin' }]])
      
      // 模拟密码比较
      bcrypt.compareSync.mockReturnValueOnce(true)
      
      // 模拟JWT签名
      jwt.sign.mockReturnValueOnce('fake-token')
      
      // 执行测试
      await authController.login(req, res)
      
      // 验证结果
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-token',
        user: { id: 1, username: 'testuser', role: 'admin' }
      })
    })

    it('应该在用户名或密码错误时返回401错误', async () => {
      // 准备测试数据
      req.body = { username: 'wronguser', password: 'wrongpassword' }
      
      // 模拟数据库返回空结果
      pool.execute.mockResolvedValueOnce([[]])
      
      // 执行测试
      await authController.login(req, res)
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: '用户名或密码错误' })
    })
  })

  // 可以添加更多测试...
})