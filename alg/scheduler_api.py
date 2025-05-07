from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from .scheduler import Employee, Shift, SchedulingAlgorithm, format_schedule_output, analyze_violations

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

def _convert_employee(emp_dict: Dict[str, Any]) -> Employee:
    """将字典格式的员工数据转换为Employee对象"""
    return Employee(
        name=emp_dict["name"],
        position=emp_dict["position"],
        store=emp_dict["store"],
        workday_pref=tuple(emp_dict["workday_pref"]),
        time_pref=tuple(emp_dict["time_pref"]),
        max_daily_hours=float(emp_dict["max_daily_hours"]),
        max_weekly_hours=float(emp_dict["max_weekly_hours"]),
        phone=emp_dict.get("phone", ""),
        email=emp_dict.get("email", "")
    )

def _convert_shift(shift_dict: Dict[str, Any]) -> Shift:
    """将字典格式的班次数据转换为Shift对象"""
    return Shift(
        day=shift_dict["day"],
        start_time=shift_dict["start_time"],
        end_time=shift_dict["end_time"],
        required_positions=shift_dict["required_positions"],
        store=shift_dict["store"]
    )

def generate_schedule(request: ScheduleRequest) -> ScheduleResponse:
    """
    生成排班表的主接口函数
    
    Args:
        request: ScheduleRequest对象，包含排班所需的所有数据
        
    Returns:
        ScheduleResponse对象，包含排班结果和相关信息
        
    Raises:
        ValueError: 当输入数据格式不正确时
        Exception: 其他可能的错误
    """
    try:
        # 1. 数据转换
        employees = [_convert_employee(emp) for emp in request.employees]
        shifts = [_convert_shift(shift) for shift in request.shifts]
        
        # 2. 初始化算法
        scheduler = SchedulingAlgorithm(
            employees=employees,
            shifts=shifts,
            sa_config=request.sa_config,
            cost_params=request.cost_params
        )
        
        # 3. 运行算法
        schedule, cost, convergence_data = scheduler.simulated_annealing()
        
        # 4. 格式化结果
        formatted_schedule = format_schedule_output(schedule)
        violations = analyze_violations(schedule, employees)
        
        # 5. 返回结果
        return ScheduleResponse(
            schedule=formatted_schedule,
            cost=cost,
            violations=violations,
            convergence_data=convergence_data
        )
        
    except KeyError as e:
        raise ValueError(f"输入数据缺少必要字段: {str(e)}")
    except Exception as e:
        raise Exception(f"排班过程发生错误: {str(e)}")

# 使用示例
if __name__ == "__main__":
    # 示例请求数据
    request_data = {
        "employees": [
            {
                "name": "张三",
                "position": "收银员",
                "store": "门店A",
                "workday_pref": [0, 6],
                "time_pref": ["08:00", "20:00"],
                "max_daily_hours": 8.0,
                "max_weekly_hours": 40.0
            }
        ],
        "shifts": [
            {
                "day": 0,
                "start_time": "09:00",
                "end_time": "17:00",
                "required_positions": {"收银员": 1},
                "store": "门店A"
            }
        ]
    }
    
    # 创建请求对象
    request = ScheduleRequest(**request_data)
    
    # 调用排班接口
    response = generate_schedule(request)
    
    # 打印结果
    print(f"总成本: {response.cost}")
    print("\n排班表:")
    for shift in response.schedule:
        print(f"日期: 周{shift['day']+1}")
        print(f"时间: {shift['start_time']}-{shift['end_time']}")
        print(f"门店: {shift['store']}")
        print("人员安排:")
        for position, workers in shift['assignments'].items():
            print(f"  {position}: {', '.join(w['name'] for w in workers)}")
        print()
    
    print("\n违规统计:")
    for key, value in response.violations.items():
        print(f"{key}: {value}") 