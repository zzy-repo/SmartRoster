from flask import Flask, request, jsonify
import logging
import json
from typing import Dict, List, Any, Optional

# 修改导入语句，使用正确的路径
from scheduler import (
    Employee, Shift, SchedulingAlgorithm, 
    format_schedule_output, analyze_violations
)

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("RosterAPI")

app = Flask(__name__)

@app.route('/api/roster/generate', methods=['POST'])
def generate_roster():
    """生成排班表API"""
    try:
        # 改进JSON数据获取方式
        if not request.is_json:
            return jsonify({'error': '请求必须是JSON格式'}), 400
            
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({'error': '无效的JSON数据'}), 400
        
        # 验证必要的数据是否存在
        if not data:
            return jsonify({'error': '请求数据为空'}), 400
        
        if 'employees' not in data or not data['employees']:
            return jsonify({'error': '缺少员工数据'}), 400
            
        if 'shifts' not in data or not data['shifts']:
            return jsonify({'error': '缺少班次数据'}), 400
        
        # 解析员工数据
        employees = [
            Employee(
                name=emp['name'],
                position=emp['position'],
                store=emp['store'],
                workday_pref=tuple(emp.get('workday_pref', (0, 6))),
                time_pref=tuple(emp.get('time_pref', ('00:00', '23:59'))),
                max_daily_hours=float(emp.get('max_daily_hours', 8.0)),
                max_weekly_hours=float(emp.get('max_weekly_hours', 40.0)),
                phone=emp.get('phone', ''),
                email=emp.get('email', '')
            )
            for emp in data.get('employees', [])
        ]
        
        # 解析班次数据
        shifts = [
            Shift(
                day=shift['day'],
                start_time=shift['start_time'],
                end_time=shift['end_time'],
                required_positions=shift['required_positions'],
                store=shift['store']
            )
            for shift in data.get('shifts', [])
        ]
        
        # 解析算法配置
        sa_config = data.get('sa_config', None)
        cost_params = data.get('cost_params', None)
        
        # 创建排班算法实例
        algorithm = SchedulingAlgorithm(
            employees=employees,
            shifts=shifts,
            sa_config=sa_config,
            cost_params=cost_params
        )
        
        # 运行模拟退火算法
        best_schedule, best_cost, convergence_data = algorithm.simulated_annealing()
        
        # 格式化输出
        formatted_schedule = format_schedule_output(best_schedule)
        
        # 分析违规情况
        violations = analyze_violations(best_schedule, employees)
        
        return jsonify({
            'schedule': formatted_schedule,
            'cost': best_cost,
            'convergence_data': convergence_data,
            'violations': violations
        })
    
    except Exception as e:
        logger.error(f"生成排班表失败: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/roster/validate', methods=['POST'])
def validate_roster():
    """验证排班表API"""
    try:
        # 改进JSON数据获取方式
        if not request.is_json:
            return jsonify({'error': '请求必须是JSON格式'}), 400
            
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({'error': '无效的JSON数据'}), 400
        
        # 验证必要的数据是否存在
        if not data:
            return jsonify({'error': '请求数据为空'}), 400
        
        if 'employees' not in data or not data['employees']:
            return jsonify({'error': '缺少员工数据'}), 400
            
        if 'schedule' not in data or not data['schedule']:
            return jsonify({'error': '缺少排班表数据'}), 400
        
        # 解析员工数据
        employees = [
            Employee(
                name=emp['name'],
                position=emp['position'],
                store=emp['store'],
                workday_pref=tuple(emp.get('workday_pref', (0, 6))),
                time_pref=tuple(emp.get('time_pref', ('00:00', '23:59'))),
                max_daily_hours=float(emp.get('max_daily_hours', 8.0)),
                max_weekly_hours=float(emp.get('max_weekly_hours', 40.0)),
                phone=emp.get('phone', ''),
                email=emp.get('email', '')
            )
            for emp in data.get('employees', [])
        ]
        
        # 解析排班表数据
        schedule_data = data.get('schedule', [])
        schedule = []
        
        for shift_data in schedule_data:
            shift = Shift(
                day=shift_data['day'],
                start_time=shift_data['start_time'],
                end_time=shift_data['end_time'],
                required_positions={pos: len(workers) for pos, workers in shift_data['assignments'].items()},
                store=shift_data['store']
            )
            
            assignments = {}
            for position, workers_data in shift_data['assignments'].items():
                workers = []
                for worker_data in workers_data:
                    # 查找对应的员工对象
                    employee = next((e for e in employees if e.name == worker_data['name']), None)
                    if employee:
                        workers.append(employee)
                assignments[position] = workers
            
            schedule.append((shift, assignments))
        
        # 分析违规情况
        violations = analyze_violations(schedule, employees)
        
        return jsonify({
            'is_valid': all(v == 0 for v in violations.values()),
            'violations': violations
        })
    
    except Exception as e:
        logger.error(f"验证排班表失败: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/roster/optimize', methods=['POST'])
def optimize_roster():
    """优化现有排班表API"""
    try:
        # 改进JSON数据获取方式
        if not request.is_json:
            return jsonify({'error': '请求必须是JSON格式'}), 400
            
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({'error': '无效的JSON数据'}), 400
        
        # 验证必要的数据是否存在
        if not data:
            return jsonify({'error': '请求数据为空'}), 400
        
        if 'employees' not in data or not data['employees']:
            return jsonify({'error': '缺少员工数据'}), 400
            
        if 'schedule' not in data or not data['schedule']:
            return jsonify({'error': '缺少排班表数据'}), 400
        
        # 解析员工数据
        employees = [
            Employee(
                name=emp['name'],
                position=emp['position'],
                store=emp['store'],
                workday_pref=tuple(emp.get('workday_pref', (0, 6))),
                time_pref=tuple(emp.get('time_pref', ('00:00', '23:59'))),
                max_daily_hours=float(emp.get('max_daily_hours', 8.0)),
                max_weekly_hours=float(emp.get('max_weekly_hours', 40.0)),
                phone=emp.get('phone', ''),
                email=emp.get('email', '')
            )
            for emp in data.get('employees', [])
        ]
        
        # 解析排班表数据
        schedule_data = data.get('schedule', [])
        initial_schedule = []
        
        # 同时提取所有班次信息
        shifts = []
        
        for shift_data in schedule_data:
            shift = Shift(
                day=shift_data['day'],
                start_time=shift_data['start_time'],
                end_time=shift_data['end_time'],
                required_positions={pos: len(workers) for pos, workers in shift_data['assignments'].items()},
                store=shift_data['store']
            )
            shifts.append(shift)
            
            assignments = {}
            for position, workers_data in shift_data['assignments'].items():
                workers = []
                for worker_data in workers_data:
                    # 查找对应的员工对象
                    employee = next((e for e in employees if e.name == worker_data['name']), None)
                    if employee:
                        workers.append(employee)
                assignments[position] = workers
            
            initial_schedule.append((shift, assignments))
        
        # 解析算法配置
        sa_config = data.get('sa_config', None)
        cost_params = data.get('cost_params', None)
        
        # 创建排班算法实例
        algorithm = SchedulingAlgorithm(
            employees=employees,
            shifts=shifts,
            sa_config=sa_config,
            cost_params=cost_params
        )
        
        # 计算初始解的成本
        initial_cost = algorithm.calculate_cost(initial_schedule)
        
        # 使用初始解作为起点运行模拟退火算法
        # 注意：这里需要修改SchedulingAlgorithm类，添加一个接受初始解的参数
        # 暂时使用默认的初始解生成方法
        best_schedule, best_cost, convergence_data = algorithm.simulated_annealing()
        
        # 格式化输出
        formatted_schedule = format_schedule_output(best_schedule)
        
        # 分析违规情况
        violations = analyze_violations(best_schedule, employees)
        
        return jsonify({
            'schedule': formatted_schedule,
            'initial_cost': initial_cost,
            'optimized_cost': best_cost,
            'improvement': initial_cost - best_cost,
            'convergence_data': convergence_data,
            'violations': violations
        })
    
    except Exception as e:
        logger.error(f"优化排班表失败: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)