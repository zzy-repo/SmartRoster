import sys
import os
import json
import logging
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from scheduler import Employee, Shift, SchedulingAlgorithm, format_schedule_output, analyze_violations

# 设置日志
logging.basicConfig(
    level=logging.DEBUG,  # 改为DEBUG级别以显示所有日志
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SchedulerAPI")

@dataclass
class ScheduleRequest:
    """排班请求数据类"""
    employees: List[Dict[str, Any]]  # 员工列表
    shifts: List[Dict[str, Any]]     # 班次列表
    sa_config: Optional[Dict[str, Any]] = None  # 模拟退火算法配置
    cost_params: Optional[Dict[str, Any]] = None  # 成本参数配置

@dataclass
class ScheduleResponse:
    """排班响应数据类"""
    schedule: List[Dict[str, Any]]  # 排班结果
    cost: float                     # 总成本
    violations: Dict[str, int]      # 违规统计
    convergence_data: Dict[str, List[float]]  # 收敛数据

def _validate_time_format(time_str: str) -> Tuple[float, float]:
    """验证时间格式并返回小时和分钟"""
    try:
        # 处理时间格式，只保留小时和分钟
        time_parts = time_str.split(':')[:2]
        if len(time_parts) != 2:
            raise ValueError(f"时间格式错误，期望 HH:MM 格式，实际: {time_str}")
            
        hours = float(time_parts[0])
        minutes = float(time_parts[1])
        
        if hours < 0 or hours > 23:
            raise ValueError(f"小时数超出范围(0-23): {hours}")
        if minutes < 0 or minutes > 59:
            raise ValueError(f"分钟数超出范围(0-59): {minutes}")
            
        return hours, minutes
    except Exception as e:
        raise ValueError(f"时间格式无效: {str(e)}")

def _validate_employee_data(employee_data: Dict[str, Any]) -> None:
    """验证员工数据格式"""
    required_fields = ['name', 'position', 'store']
    for field in required_fields:
        if field not in employee_data:
            raise ValueError(f"缺少必要字段: {field}")
    
    # 验证workday_pref
    workday_pref = employee_data.get('workday_pref', [0, 6])
    if not isinstance(workday_pref, (list, tuple)) or len(workday_pref) != 2:
        raise ValueError("workday_pref必须是包含两个整数的列表或元组")
    if not all(isinstance(x, (int, float)) for x in workday_pref):
        raise ValueError("workday_pref必须包含数字")
    if not (0 <= workday_pref[0] <= 6 and 0 <= workday_pref[1] <= 6):
        raise ValueError("workday_pref的值必须在0-6之间")
    
    # 验证time_pref
    time_pref = employee_data.get('time_pref', ['00:00', '23:59'])
    if not isinstance(time_pref, (list, tuple)) or len(time_pref) != 2:
        raise ValueError("time_pref必须是包含两个时间字符串的列表或元组")
    for time_str in time_pref:
        _validate_time_format(time_str)
    
    # 验证工作时长
    max_daily_hours = float(employee_data.get('max_daily_hours', 8.0))
    max_weekly_hours = float(employee_data.get('max_weekly_hours', 40.0))
    if max_daily_hours <= 0 or max_weekly_hours <= 0:
        raise ValueError("工作时长必须大于0")
    if max_daily_hours > 24 or max_weekly_hours > 168:
        raise ValueError("工作时长超出合理范围")

def _validate_shift_data(shift_data: Dict[str, Any]) -> None:
    """验证班次数据格式"""
    required_fields = ['day', 'start_time', 'end_time', 'store']
    for field in required_fields:
        if field not in shift_data:
            raise ValueError(f"缺少必要字段: {field}")
    
    # 验证day
    day = int(shift_data['day'])
    if not (0 <= day <= 6):
        raise ValueError("day必须在0-6之间")
    
    # 验证时间
    _validate_time_format(shift_data['start_time'])
    _validate_time_format(shift_data['end_time'])
    
    # 验证required_positions
    required_positions = shift_data.get('required_positions', {})
    if not isinstance(required_positions, dict):
        raise ValueError("required_positions必须是字典类型")
    for position, count in required_positions.items():
        if not isinstance(count, (int, float)) or count < 0:
            raise ValueError(f"职位{position}的需求人数必须是非负数")

def _convert_employee(employee_data: Dict[str, Any]) -> Employee:
    """将API输入转换为Employee对象"""
    try:
        logger.debug(f"开始转换员工数据: {json.dumps(employee_data, ensure_ascii=False)}")
        
        # 验证数据格式
        _validate_employee_data(employee_data)
        
        # 处理workday_pref
        workday_pref = tuple(map(int, employee_data['workday_pref']))
        
        # 处理time_pref
        time_pref = tuple(str(t) for t in employee_data['time_pref'])
        
        # 创建Employee对象
        employee = Employee(
            name=str(employee_data['name']),
            position=str(employee_data['position']),
            store=str(employee_data['store']),
            workday_pref=workday_pref,
            time_pref=time_pref,
            max_daily_hours=float(employee_data.get('max_daily_hours', 8.0)),
            max_weekly_hours=float(employee_data.get('max_weekly_hours', 40.0)),
            phone=str(employee_data.get('phone', '')),
            email=str(employee_data.get('email', ''))
        )
        logger.debug(f"成功创建Employee对象: {employee}")
        return employee
    except Exception as e:
        logger.error(f"转换员工数据失败: {str(e)}")
        raise

def _convert_shift(shift_data: Dict[str, Any]) -> Shift:
    """将API输入转换为Shift对象"""
    try:
        logger.debug(f"开始转换班次数据: {json.dumps(shift_data, ensure_ascii=False)}")
        
        # 验证数据格式
        _validate_shift_data(shift_data)
        
        # 创建Shift对象
        shift = Shift(
            day=int(shift_data['day']),
            start_time=str(shift_data['start_time']),
            end_time=str(shift_data['end_time']),
            required_positions=dict(shift_data['required_positions']),
            store=str(shift_data['store'])
        )
        logger.debug(f"成功创建Shift对象: {shift}")
        return shift
    except Exception as e:
        logger.error(f"转换班次数据失败: {str(e)}")
        raise

def format_schedule_output(schedule: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """格式化排班结果输出"""
    try:
        formatted_schedule = []
        for assignment in schedule:
            # 确保所有必要字段都存在且类型正确
            if not all(key in assignment for key in ['employee_id', 'shift_id', 'position']):
                raise ValueError("排班结果缺少必要字段")
            
            formatted_assignment = {
                'employee_id': int(assignment['employee_id']),
                'shift_id': int(assignment['shift_id']),
                'position': str(assignment['position'])
            }
            formatted_schedule.append(formatted_assignment)
        return formatted_schedule
    except Exception as e:
        logger.error(f"格式化排班结果失败: {str(e)}")
        raise

def generate_schedule(
    employees_data: List[Dict[str, Any]],
    shifts_data: List[Dict[str, Any]],
    sa_config: Optional[Dict[str, Any]] = None,
    cost_params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """生成排班表的主函数"""
    try:
        logger.debug("开始生成排班表")
        logger.debug(f"员工数据数量: {len(employees_data)}")
        logger.debug(f"班次数据数量: {len(shifts_data)}")
        
        # 转换输入数据
        logger.debug("开始转换员工数据...")
        employees = [_convert_employee(emp) for emp in employees_data]
        logger.debug(f"成功转换{len(employees)}个员工数据")
        
        logger.debug("开始转换班次数据...")
        shifts = [_convert_shift(shift) for shift in shifts_data]
        logger.debug(f"成功转换{len(shifts)}个班次数据")
        
        # 创建调度算法实例
        logger.debug("创建调度算法实例...")
        scheduler = SchedulingAlgorithm(employees, shifts, sa_config, cost_params)
        logger.debug("调度算法实例创建成功")
        
        # 运行模拟退火算法
        logger.debug("开始运行模拟退火算法...")
        schedule, cost, convergence_data = scheduler.simulated_annealing()
        logger.debug(f"模拟退火算法完成，成本: {cost}")
        
        # 分析违规情况
        logger.debug("开始分析违规情况...")
        violations = analyze_violations(schedule, employees)
        logger.debug(f"违规分析完成: {violations}")
        
        # 格式化输出
        logger.debug("开始格式化输出...")
        formatted_schedule = format_schedule_output(schedule)
        logger.debug("输出格式化完成")
        
        # 确保输出格式严格符合要求
        result = {
            "schedule": formatted_schedule,  # 只包含必要的字段
            "cost": float(cost),  # 确保是浮点数
            "violations": {str(k): int(v) for k, v in violations.items()},  # 确保键是字符串，值是整数
            "convergence_data": {
                "temperatures": [float(t) for t in convergence_data.get('temperatures', [])],
                "costs": [float(c) for c in convergence_data.get('costs', [])]
            }
        }
        logger.debug("排班表生成完成")
        return result
    except Exception as e:
        logger.error(f"生成排班表失败: {str(e)}")
        raise

# 使用示例
if __name__ == "__main__":
    # 如果有命令行参数 --help，输出帮助
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print("用法: cat request.json | python3 scheduler_api.py")
        sys.exit(0)

    # 从标准输入读取JSON
    try:
        logger.debug("开始读取输入数据...")
        input_data = sys.stdin.read()
        logger.debug(f"读取到的原始数据: {input_data}")
        
        logger.debug("开始解析JSON数据...")
        request_dict = json.loads(input_data)
        logger.debug(f"解析后的数据: {json.dumps(request_dict, ensure_ascii=False)}")
        
        logger.debug("创建ScheduleRequest对象...")
        request = ScheduleRequest(**request_dict)
        logger.debug("ScheduleRequest对象创建成功")
        
        logger.debug("开始生成排班表...")
        response = generate_schedule(request.employees, request.shifts, request.sa_config, request.cost_params)
        logger.debug("排班表生成成功")
        
        # 输出JSON结果
        logger.debug("开始输出结果...")
        print(json.dumps(response, ensure_ascii=False))
        logger.debug("结果输出完成")
    except Exception as e:
        logger.error(f"程序执行失败: {str(e)}")
        logger.error(f"错误类型: {type(e)}")
        logger.error(f"错误详情: {str(e)}")
        logger.error(f"错误堆栈: {sys.exc_info()}")
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1) 