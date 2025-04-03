import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from './index.mjs';
import { pool } from '../../shared/database/index.mjs';

// 模拟数据库连接
vi.mock('../../shared/database/index.mjs', () => {
  const mockQuery = vi.fn();
  const mockGetConnection = vi.fn().mockReturnValue({
    query: mockQuery,
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn()
  });
  
  return {
    pool: {
      query: mockQuery,
      getConnection: mockGetConnection
    }
  };
});

// 模拟Python算法调用
vi.mock('child_process', () => {
  const mockEventEmitter = {
    on: vi.fn().mockImplementation(function(event, callback) {
      if (event === 'close') {
        setTimeout(() => callback(0), 100);
      }
      return this;
    }),
    stdout: {
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(JSON.stringify({
            assignments: [
              {
                employee_id: 1,
                shift_id: 1,
                date: '2023-06-01',
                start_time: '09:00',
                end_time: '17:00'
              }
            ],
            cost: 100,
            violations: []
          }))), 50);
        }
      })
    },
    stderr: {
      on: vi.fn()
    }
  };
  
  return {
    spawn: vi.fn().mockReturnValue(mockEventEmitter)
  };
});

describe('排班服务集成测试', () => {
  let server;
  
  beforeAll(() => {
    server = app.listen(0); // 使用随机端口启动服务器
  });
  
  afterAll(() => {
    server.close();
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('生成排班表 POST /generate', () => {
    it('应该成功生成排班表', async () => {
      // 模拟数据库返回员工数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            name: '张三',
            position: '店员',
            store_id: 1,
            workday_pref_start: 1,
            workday_pref_end: 5,
            time_pref_start: '09:00:00',
            time_pref_end: '18:00:00',
            max_daily_hours: 8,
            max_weekly_hours: 40,
            skills: '收银,理货'
          }
        ]
      ]);
      
      // 模拟数据库返回班次需求数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            date: '2023-06-01',
            start_time: '09:00:00',
            end_time: '17:00:00',
            required_positions: JSON.stringify({ '店员': 1 })
          }
        ]
      ]);
      
      // 模拟数据库插入排班表
      pool.query.mockImplementationOnce(() => [{ insertId: 1 }]);
      
      // 模拟数据库插入排班分配
      pool.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
      
      const response = await request(app)
        .post('/generate')
        .send({
          storeId: 1,
          startDate: '2023-06-01',
          endDate: '2023-06-07'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('scheduleId');
      expect(response.body).toHaveProperty('assignments');
      expect(pool.query).toHaveBeenCalledTimes(4);
    });
    
    it('缺少必要参数时应返回400错误', async () => {
      const response = await request(app)
        .post('/generate')
        .send({
          storeId: 1
          // 缺少startDate和endDate
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '缺少必要参数');
    });
    
    it('未找到员工数据时应返回404错误', async () => {
      // 模拟数据库返回空员工数据
      pool.query.mockImplementationOnce(() => [[]]);
      
      const response = await request(app)
        .post('/generate')
        .send({
          storeId: 1,
          startDate: '2023-06-01',
          endDate: '2023-06-07'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', '未找到员工数据');
    });
  });
  
  describe('优化排班表 POST /optimize', () => {
    it('应该成功优化排班表', async () => {
      // 模拟数据库返回排班表数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            start_date: '2023-06-01',
            end_date: '2023-06-07',
            created_at: '2023-05-30 10:00:00',
            updated_at: null
          }
        ]
      ]);
      
      // 模拟数据库返回排班分配数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            schedule_id: 1,
            employee_id: 1,
            shift_id: 1,
            date: '2023-06-01',
            start_time: '09:00:00',
            end_time: '17:00:00',
            employee_name: '张三',
            position: '店员'
          }
        ]
      ]);
      
      // 模拟数据库返回员工数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            name: '张三',
            position: '店员',
            store_id: 1,
            workday_pref_start: 1,
            workday_pref_end: 5,
            time_pref_start: '09:00:00',
            time_pref_end: '18:00:00',
            max_daily_hours: 8,
            max_weekly_hours: 40,
            skills: '收银,理货'
          }
        ]
      ]);
      
      // 模拟数据库返回班次需求数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            date: '2023-06-01',
            start_time: '09:00:00',
            end_time: '17:00:00',
            required_positions: JSON.stringify({ '店员': 1 })
          }
        ]
      ]);
      
      const mockConnection = pool.getConnection();
      
      const response = await request(app)
        .post('/optimize')
        .send({
          scheduleId: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('scheduleId');
      expect(response.body).toHaveProperty('assignments');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });
    
    it('缺少排班表ID时应返回400错误', async () => {
      const response = await request(app)
        .post('/optimize')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '缺少排班表ID');
    });
  });
  
  describe('手动分配班次 POST /assign', () => {
    it('应该成功分配班次', async () => {
      // 模拟数据库返回排班表数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            start_date: '2023-06-01',
            end_date: '2023-06-07'
          }
        ]
      ]);
      
      // 模拟数据库返回员工数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            name: '张三',
            position: '店员'
          }
        ]
      ]);
      
      // 模拟数据库返回班次数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            date: '2023-06-01',
            start_time: '09:00:00',
            end_time: '17:00:00'
          }
        ]
      ]);
      
      // 模拟数据库检查冲突
      pool.query.mockImplementationOnce(() => [[]]);
      
      // 模拟数据库插入分配
      pool.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
      
      // 模拟数据库更新排班表
      pool.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
      
      const response = await request(app)
        .post('/assign')
        .send({
          scheduleId: 1,
          shiftId: 1,
          employeeId: 1,
          date: '2023-06-01',
          startTime: '09:00:00',
          endTime: '17:00:00'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '班次分配成功');
    });
    
    it('缺少必要参数时应返回400错误', async () => {
      const response = await request(app)
        .post('/assign')
        .send({
          scheduleId: 1,
          shiftId: 1
          // 缺少其他参数
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '缺少必要参数');
    });
  });
  
  describe('获取排班表 GET /:storeId', () => {
    it('应该成功获取排班表', async () => {
      // 模拟数据库返回排班表列表
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            start_date: '2023-06-01',
            end_date: '2023-06-07',
            created_at: '2023-05-30 10:00:00',
            updated_at: null
          }
        ]
      ]);
      
      // 模拟数据库返回排班表详情
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            start_date: '2023-06-01',
            end_date: '2023-06-07',
            created_at: '2023-05-30 10:00:00',
            updated_at: null
          }
        ]
      ]);
      
      // 模拟数据库返回排班分配
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            schedule_id: 1,
            employee_id: 1,
            shift_id: 1,
            date: '2023-06-01',
            start_time: '09:00:00',
            end_time: '17:00:00',
            employee_name: '张三',
            position: '店员'
          }
        ]
      ]);
      
      const response = await request(app)
        .get('/1')
        .query({
          startDate: '2023-06-01',
          endDate: '2023-06-07',
          view: 'employee'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('schedule');
      expect(response.body.schedule).toHaveProperty('employees');
    });
    
    it('缺少必要参数时应返回400错误', async () => {
      const response = await request(app)
        .get('/1')
        .query({
          startDate: '2023-06-01'
          // 缺少endDate
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '缺少必要参数');
    });
  });
  
  describe('删除排班表 DELETE /:scheduleId', () => {
    it('应该成功删除排班表', async () => {
      // 模拟数据库返回排班表数据
      pool.query.mockImplementationOnce(() => [
        [
          {
            id: 1,
            store_id: 1,
            start_date: '2023-06-01',
            end_date: '2023-06-07'
          }
        ]
      ]);
      
      const mockConnection = pool.getConnection();
      
      const response = await request(app)
        .delete('/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '排班表删除成功');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });
    
    it('排班表不存在时应返回404错误', async () => {
      // 模拟数据库返回空数据
      pool.query.mockImplementationOnce(() => [[]]);
      
      const response = await request(app)
        .delete('/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', '排班表不存在');
    });
  });
});