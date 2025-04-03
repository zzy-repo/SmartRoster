#!/usr/bin/env python3
import unittest
import json
import random
from roster_api import app
from scheduler import Employee, Shift

class TestRosterAPI(unittest.TestCase):
    """排班系统API接口的单元测试"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.app = app.test_client()
        self.app.testing = True
        
        # 设置随机种子以确保测试结果可重现
        random.seed(42)
        
        # 动态生成测试数据
        self.test_employees = self._generate_test_employees(10)  # 生成10个员工
        self.test_shifts = self._generate_test_shifts(7)  # 生成一周的班次
        
        self.test_sa_config = {
            "initial_temp": 50.0,
            "min_temp": 0.5,
            "cooling_rate": 0.9,
            "iter_per_temp": 5,
            "iterations": 3
        }
        
        self.test_cost_params = {
            "understaff_penalty": 100,
            "workday_violation": 10,
            "time_pref_violation": 5,
            "daily_hours_violation": 20,
            "weekly_hours_violation": 50
        }
    
    def _generate_test_employees(self, count):
        """动态生成测试员工数据"""
        positions = ["收银员", "服务员", "厨师", "保安", "清洁工"]
        stores = ["门店A", "门店B", "门店C"]
        
        employees = []
        for i in range(count):
            # 随机选择职位和门店
            position = random.choice(positions)
            store = random.choice(stores)
            
            # 随机生成工作日偏好
            start_day = random.randint(0, 3)
            end_day = random.randint(start_day + 1, 6)
            
            # 随机生成时间偏好
            start_hour = random.randint(8, 14)
            end_hour = random.randint(start_hour + 4, 22)
            start_time = f"{start_hour:02d}:00"
            end_time = f"{end_hour:02d}:00"
            
            employees.append({
                "name": f"测试员工{i+1}",
                "position": position,
                "store": store,
                "workday_pref": [start_day, end_day],
                "time_pref": [start_time, end_time],
                "max_daily_hours": 8.0,
                "max_weekly_hours": 40.0,
                "phone": f"1380000{i+1:04d}",
                "email": f"test{i+1}@example.com"
            })
        
        return employees
    
    def _generate_test_shifts(self, days):
        """动态生成测试班次数据"""
        stores = ["门店A", "门店B", "门店C"]
        shift_types = [
            {"start": "09:00", "end": "17:00"},  # 早班
            {"start": "12:00", "end": "20:00"},  # 中班
            {"start": "16:00", "end": "00:00"}   # 晚班
        ]
        
        shifts = []
        for day in range(days):
            for store in stores:
                for shift_type in shift_types:
                    # 随机决定是否包含这个班次
                    if random.random() > 0.3:  # 70%的概率包含
                        shifts.append({
                            "day": day,
                            "start_time": shift_type["start"],
                            "end_time": shift_type["end"],
                            "required_positions": {
                                "收银员": random.randint(1, 2),
                                "服务员": random.randint(1, 3),
                                "厨师": random.randint(1, 2),
                                "保安": random.randint(0, 1),
                                "清洁工": random.randint(0, 1)
                            },
                            "store": store
                        })
        
        return shifts
    
    def test_generate_roster_api(self):
        """测试生成排班表API"""
        # 准备请求数据
        request_data = {
            "employees": self.test_employees,
            "shifts": self.test_shifts,
            "sa_config": self.test_sa_config,
            "cost_params": self.test_cost_params
        }
        
        # 发送POST请求
        response = self.app.post(
            '/api/roster/generate',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        # 检查响应状态码
        self.assertEqual(response.status_code, 200)
        
        # 解析响应数据
        response_data = json.loads(response.data)
        
        # 检查响应数据结构
        self.assertIn('schedule', response_data)
        self.assertIn('cost', response_data)
        self.assertIn('convergence_data', response_data)
        self.assertIn('violations', response_data)
        
        # 检查排班表结构
        schedule = response_data['schedule']
        self.assertIsInstance(schedule, list)
        self.assertEqual(len(schedule), len(self.test_shifts))
        
        # 检查第一个班次的结构
        first_shift = schedule[0]
        self.assertIn('day', first_shift)
        self.assertIn('start_time', first_shift)
        self.assertIn('end_time', first_shift)
        self.assertIn('store', first_shift)
        self.assertIn('assignments', first_shift)
    
    def test_validate_roster_api(self):
        """测试验证排班表API"""
        # 首先生成一个排班表
        generate_request = {
            "employees": self.test_employees,
            "shifts": self.test_shifts,
            "sa_config": self.test_sa_config,
            "cost_params": self.test_cost_params
        }
        
        generate_response = self.app.post(
            '/api/roster/generate',
            data=json.dumps(generate_request),
            content_type='application/json'
        )
        
        generate_data = json.loads(generate_response.data)
        schedule = generate_data['schedule']
        
        # 准备验证请求数据
        validate_request = {
            "employees": self.test_employees,
            "schedule": schedule
        }
        
        # 发送POST请求
        response = self.app.post(
            '/api/roster/validate',
            data=json.dumps(validate_request),
            content_type='application/json'
        )
        
        # 检查响应状态码
        self.assertEqual(response.status_code, 200)
        
        # 解析响应数据
        response_data = json.loads(response.data)
        
        # 检查响应数据结构
        self.assertIn('is_valid', response_data)
        self.assertIn('violations', response_data)
        
        # 检查违规情况
        violations = response_data['violations']
        self.assertIsInstance(violations, dict)
        self.assertIn('understaff', violations)
        self.assertIn('workday_pref', violations)
        self.assertIn('time_pref', violations)
        self.assertIn('daily_hours', violations)
        self.assertIn('weekly_hours', violations)
    
    def test_optimize_roster_api(self):
        """测试优化排班表API"""
        # 首先生成一个排班表
        generate_request = {
            "employees": self.test_employees,
            "shifts": self.test_shifts,
            "sa_config": self.test_sa_config,
            "cost_params": self.test_cost_params
        }
        
        generate_response = self.app.post(
            '/api/roster/generate',
            data=json.dumps(generate_request),
            content_type='application/json'
        )
        
        generate_data = json.loads(generate_response.data)
        schedule = generate_data['schedule']
        
        # 准备优化请求数据
        optimize_request = {
            "employees": self.test_employees,
            "schedule": schedule,
            "sa_config": self.test_sa_config,
            "cost_params": self.test_cost_params
        }
        
        # 发送POST请求
        response = self.app.post(
            '/api/roster/optimize',
            data=json.dumps(optimize_request),
            content_type='application/json'
        )
        
        # 检查响应状态码
        self.assertEqual(response.status_code, 200)
        
        # 解析响应数据
        response_data = json.loads(response.data)
        
        # 检查响应数据结构
        self.assertIn('schedule', response_data)
        self.assertIn('initial_cost', response_data)
        self.assertIn('optimized_cost', response_data)
        self.assertIn('improvement', response_data)
        self.assertIn('convergence_data', response_data)
        self.assertIn('violations', response_data)
    
    def test_invalid_request_format(self):
        """测试无效的请求格式"""
        # 发送非JSON格式的请求
        response = self.app.post(
            '/api/roster/generate',
            data="这不是JSON格式",
            content_type='text/plain'
        )
        
        # 检查响应状态码
        self.assertEqual(response.status_code, 400)
        
        # 解析响应数据
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
        self.assertEqual(response_data['error'], '请求必须是JSON格式')
    
    def test_missing_required_data(self):
        """测试缺少必要数据的请求"""
        # 缺少员工数据
        missing_employees = {
            "shifts": self.test_shifts
        }
        
        response = self.app.post(
            '/api/roster/generate',
            data=json.dumps(missing_employees),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
        self.assertEqual(response_data['error'], '缺少员工数据')
        
        # 缺少班次数据
        missing_shifts = {
            "employees": self.test_employees
        }
        
        response = self.app.post(
            '/api/roster/generate',
            data=json.dumps(missing_shifts),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
        self.assertEqual(response_data['error'], '缺少班次数据')
    
    def test_large_data_performance(self):
        """测试大数据量下的API性能"""
        # 生成更多的测试数据
        large_employees = self._generate_test_employees(30)  # 30个员工
        large_shifts = self._generate_test_shifts(14)  # 两周的班次
        
        # 准备请求数据
        request_data = {
            "employees": large_employees,
            "shifts": large_shifts[:20],  # 限制班次数量，避免测试时间过长
            "sa_config": {
                "initial_temp": 50.0,
                "min_temp": 0.5,
                "cooling_rate": 0.95,
                "iter_per_temp": 3,
                "iterations": 2
            },
            "cost_params": self.test_cost_params
        }
        
        # 发送POST请求
        response = self.app.post(
            '/api/roster/generate',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        # 检查响应状态码
        self.assertEqual(response.status_code, 200)
        
        # 解析响应数据
        response_data = json.loads(response.data)
        
        # 检查响应数据结构
        self.assertIn('schedule', response_data)
        self.assertIn('cost', response_data)

if __name__ == '__main__':
    unittest.main()