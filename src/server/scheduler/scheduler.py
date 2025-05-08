import os
import math
import copy
import random
import logging
from dataclasses import dataclass
from typing import Dict, List, Tuple, Set, Any, Optional

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("StandaloneScheduler")

# 常量配置
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# 模拟退火算法参数
SA_CONFIG = {
    "initial_temp": 100.0,
    "min_temp": 0.1,
    "cooling_rate": 0.95,
    "iter_per_temp": 100,
    "iterations": 50,
}

# 成本参数默认值
DEFAULT_COST_PARAMS = {
    "understaff_penalty": 100,
    "workday_violation": 10,
    "time_pref_violation": 5,
    "daily_hours_violation": 20,
    "weekly_hours_violation": 50,
}


@dataclass
class Employee:
    """员工类"""
    name: str
    position: str
    store: str
    workday_pref: Tuple[int, int]  # 工作日偏好 (开始日, 结束日)
    time_pref: Tuple[str, str]  # 时间偏好 (开始时间, 结束时间)
    max_daily_hours: float  # 每日最大工时
    max_weekly_hours: float  # 每周最大工时
    phone: str = ""
    email: str = ""


@dataclass
class Shift:
    """班次类"""
    day: int  # 0-6 表示周一到周日
    start_time: str  # 格式: "HH:MM"
    end_time: str  # 格式: "HH:MM"
    required_positions: Dict[str, int]  # 职位: 需要人数
    # 员工的职位有：门店经理，副经理，小组长，店员（收银，导购，库房）
    store: str  # 门店


def time_to_minutes(time_str: str) -> int:
    """将时间字符串转换为分钟数"""
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes


def calculate_shift_duration(shift: Shift) -> float:
    """计算班次时长（小时）"""
    start = time_to_minutes(shift.start_time)
    end = time_to_minutes(shift.end_time)
    return (end - start) / 60


class SchedulingAlgorithm:
    """排班算法类"""
    
    def __init__(self, employees: List[Employee], shifts: List[Shift], 
                 sa_config: Optional[Dict[str, Any]] = None, cost_params: Optional[Dict[str, Any]] = None):
        self.employees = employees
        self.shifts = shifts
        self.sa_config = sa_config if sa_config is not None else SA_CONFIG
        self.cost_params = cost_params if cost_params is not None else DEFAULT_COST_PARAMS
        
        # 确保数据目录存在
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # 预处理员工数据：按门店和职位分类
        self.employee_store_position_map = {}
        for e in self.employees:
            key = (e.store, e.position)
            if key not in self.employee_store_position_map:
                self.employee_store_position_map[key] = []
            self.employee_store_position_map[key].append(e)
        
        logger.debug(f"员工数据预处理完成，共有{len(self.employee_store_position_map)}种门店-职位组合")
    
    def _calculate_position_demand(self) -> Dict[str, int]:
        """计算各职位需求总量"""
        position_demand = {}
        for shift in self.shifts:
            for position, count in shift.required_positions.items():
                position_demand[position] = position_demand.get(position, 0) + count
        return position_demand
    
    def _calculate_position_supply(self) -> Dict[str, int]:
        """计算各职位员工数量"""
        position_supply = {}
        for employee in self.employees:
            position_supply[employee.position] = position_supply.get(employee.position, 0) + 1
        return position_supply
    
    def _calculate_position_scarcity(self, demand: Dict[str, int], supply: Dict[str, int]) -> Dict[str, float]:
        """计算职位稀缺度"""
        scarcity = {}
        for position in demand:
            if position in supply and supply[position] > 0:
                scarcity[position] = supply[position] / demand[position]
            else:
                scarcity[position] = 0  # 极度稀缺
        return scarcity
    
    def _sort_shifts_by_scarcity(self, position_scarcity: Dict[str, float]) -> List[Shift]:
        """按稀缺度对班次进行排序（先处理包含稀缺职位的班次）"""
        return sorted(
            self.shifts,
            key=lambda s: min([position_scarcity.get(p, float('inf')) for p in s.required_positions.keys()], default=float('inf'))
        )
    
    def _sort_positions_by_scarcity(self, positions, position_scarcity: Dict[str, float]):
        """按稀缺度对职位进行排序（先分配稀缺职位）"""
        return sorted(positions, key=lambda x: position_scarcity.get(x[0], 0))
    
    def _score_candidates(self, candidates: List[Employee], shift: Shift, 
                          employee_assigned_hours: Dict[str, float], 
                          employee_assigned_days: Dict[str, Set[int]]) -> List[Tuple[Employee, float]]:
        """根据员工偏好和已分配工作量对候选员工进行评分"""
        scored_candidates = []
        for e in candidates:
            # 如果员工已经在这一天被分配了，降低其优先级
            day_penalty = 5 if shift.day in employee_assigned_days[e.name] else 0
            
            # 计算工作日偏好匹配度
            day_pref_match = 1 if e.workday_pref[0] <= shift.day <= e.workday_pref[1] else 0
            
            # 计算时间偏好匹配度
            shift_start = time_to_minutes(shift.start_time)
            shift_end = time_to_minutes(shift.end_time)
            pref_start = time_to_minutes(e.time_pref[0])
            pref_end = time_to_minutes(e.time_pref[1])
            time_pref_match = 1 if (shift_start >= pref_start and shift_end <= pref_end) else 0
            
            # 考虑已分配工时，优先分配工时少的员工
            hours_score = 1 / (1 + employee_assigned_hours[e.name])
            
            # 综合评分
            score = (3 * day_pref_match + 2 * time_pref_match + hours_score - day_penalty)
            scored_candidates.append((e, score))
        
        # 按评分排序
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return scored_candidates
    
    def generate_initial_solution(self) -> List[Tuple[Shift, Dict[str, List[Employee]]]]:
        """生成初始解"""
        logger.info("开始生成初始解...")
        schedule = []
        
        # 计算职位稀缺度
        position_demand = self._calculate_position_demand()
        position_supply = self._calculate_position_supply()
        position_scarcity = self._calculate_position_scarcity(position_demand, position_supply)
        
        logger.debug(f"职位稀缺度: {position_scarcity}")
        
        # 跟踪每个员工的已分配工时和工作日
        employee_assigned_hours = {e.name: 0.0 for e in self.employees}  # 修改为float类型
        employee_assigned_days = {e.name: set() for e in self.employees}
        
        # 按稀缺度对班次进行排序
        sorted_shifts = self._sort_shifts_by_scarcity(position_scarcity)
        
        for shift in sorted_shifts:
            assignment = {}
            
            # 按稀缺度对职位进行排序
            sorted_positions = self._sort_positions_by_scarcity(shift.required_positions.items(), position_scarcity)
            
            for position, count in sorted_positions:
                # 获取并评分候选员工
                candidates = self.employee_store_position_map.get((shift.store, position), [])
                scored_candidates = self._score_candidates(
                    candidates, shift, employee_assigned_hours, employee_assigned_days
                )
                
                # 选择评分最高的员工
                selected = [scored_candidates[i][0] for i in range(min(count, len(scored_candidates)))]
                
                # 更新员工工时和工作日记录
                for employee in selected:
                    duration = calculate_shift_duration(shift)
                    employee_assigned_hours[employee.name] += duration
                    employee_assigned_days[employee.name].add(shift.day)
                
                assignment[position] = selected
                logger.debug(
                    f"班次{shift.day} {shift.start_time}-{shift.end_time} - 门店{shift.store} - 分配{position} {len(selected)}人"
                )
            
            schedule.append((shift, assignment))
        
        logger.info(f"初始解生成完成，共安排{len(self.shifts)}个班次")
        return schedule
    
    def _init_hours_tracking(self) -> Tuple[Dict[str, float], Dict[str, Dict[int, float]]]:
        """初始化工时跟踪数据结构"""
        employee_weekly_hours = {e.name: 0.0 for e in self.employees}  # 修改为float类型
        employee_daily_hours = {e.name: {day: 0.0 for day in range(7)} for e in self.employees}  # 修改为float类型
        return employee_weekly_hours, employee_daily_hours
    
    def _check_shift_requirements(self, shift: Shift, assignment: Dict[str, List[Employee]], 
                                 violation_details: List[str]) -> float:
        """检查班次需求是否满足"""
        cost = 0
        for position, required_count in shift.required_positions.items():
            assigned_count = len(assignment.get(position, []))
            if assigned_count < required_count:
                shortage = required_count - assigned_count
                violation_details.append(
                    f"班次{shift.day} {shift.start_time}-{shift.end_time} {shift.store} 缺少 {position} {shortage}人"
                )
                cost += shortage * self.cost_params["understaff_penalty"]
        return cost
    
    def _check_workday_preference(self, employee: Employee, shift: Shift, 
                                 violation_details: List[str]) -> float:
        """检查工作日偏好是否满足"""
        if not (employee.workday_pref[0] <= shift.day <= employee.workday_pref[1]):
            violation_details.append(
                f"{employee.name} 工作日偏好冲突（班次周{shift.day+1} vs 偏好周{employee.workday_pref[0]+1}-{employee.workday_pref[1]+1}）"
            )
            return self.cost_params["workday_violation"]
        return 0
    
    def _check_time_preference(self, employee: Employee, shift: Shift, 
                              violation_details: List[str]) -> float:
        """检查时间偏好是否满足"""
        shift_start = time_to_minutes(shift.start_time)
        shift_end = time_to_minutes(shift.end_time)
        pref_start = time_to_minutes(employee.time_pref[0])
        pref_end = time_to_minutes(employee.time_pref[1])
        
        if shift_start < pref_start or shift_end > pref_end:
            violation_details.append(
                f"{employee.name} 时间偏好冲突（班次{shift.start_time}-{shift.end_time} vs 偏好{employee.time_pref[0]}-{employee.time_pref[1]}）"
            )
            return self.cost_params["time_pref_violation"]
        return 0
    
    def _check_employee_constraints(self, shift: Shift, assignment: Dict[str, List[Employee]],
                                   employee_weekly_hours: Dict[str, float],
                                   employee_daily_hours: Dict[str, Dict[int, float]],
                                   violation_details: List[str]) -> float:
        """检查员工约束"""
        cost = 0
        
        # 遍历所有分配的员工
        for position, employees in assignment.items():
            for employee in employees:
                # 检查工作日偏好
                cost += self._check_workday_preference(employee, shift, violation_details)
                
                # 检查时间偏好
                cost += self._check_time_preference(employee, shift, violation_details)
                
                # 更新工时统计
                duration = calculate_shift_duration(shift)
                employee_weekly_hours[employee.name] += duration
                employee_daily_hours[employee.name][shift.day] += duration
        
        return cost
    
    def _check_hours_limits(self, weekly_hours: Dict[str, float], 
                           daily_hours: Dict[str, Dict[int, float]],
                           violation_details: List[str]) -> float:
        """检查工时限制"""
        cost = 0
        
        # 检查每日时长限制
        for name, days in daily_hours.items():
            employee = next(e for e in self.employees if e.name == name)
            for day, hours in days.items():
                if hours > employee.max_daily_hours:
                    violation_details.append(
                        f"{name} 周{day+1}日工作{hours:.1f}小时（限制{employee.max_daily_hours}小时）"
                    )
                    cost += self.cost_params["daily_hours_violation"]
        
        # 检查每周时长限制
        for name, hours in weekly_hours.items():
            max_hours = next(e.max_weekly_hours for e in self.employees if e.name == name)
            if hours > max_hours:
                violation_details.append(
                    f"{name} 周总工时{hours:.1f}小时（限制{max_hours}小时）"
                )
                cost += self.cost_params["weekly_hours_violation"]
                
        return cost
    
    def _log_violations(self, violation_details: List[str]) -> None:
        """记录违规详情"""
        if violation_details:
            logger.debug(f"发现{len(violation_details)}条违规：")
            for detail in violation_details[:3]:  # 只显示前3条避免日志过多
                logger.debug(f"  * {detail}")
            if len(violation_details) > 3:
                logger.debug(f"  还有{len(violation_details)-3}条未显示...")
    
    def calculate_cost(self, schedule: List[Tuple[Shift, Dict[str, List[Employee]]]]) -> float:
        """计算排班方案成本"""
        logger.debug("开始计算方案成本...")
        cost = 0
        
        # 初始化工时统计和违规记录
        employee_weekly_hours, employee_daily_hours = self._init_hours_tracking()
        violation_details = []
        
        # 计算班次需求和员工约束相关成本
        for shift, assignment in schedule:
            # 检查班次需求是否满足
            cost += self._check_shift_requirements(shift, assignment, violation_details)
            
            # 检查员工约束并更新工时
            cost += self._check_employee_constraints(shift, assignment, employee_weekly_hours, 
                                                   employee_daily_hours, violation_details)
        
        # 检查工时限制
        cost += self._check_hours_limits(employee_weekly_hours, employee_daily_hours, violation_details)
        
        # 记录详细违规信息
        self._log_violations(violation_details)
        
        logger.debug(f"总成本计算完成：{cost}")
        return cost
    
    def generate_neighbor_replace(self, current_schedule: List[Tuple[Shift, Dict[str, List[Employee]]]]) -> List[Tuple[Shift, Dict[str, List[Employee]]]]:
        """原有的替换员工操作，作为基础邻域操作"""
        new_schedule = copy.deepcopy(current_schedule)
        
        idx = random.randint(0, len(new_schedule) - 1)
        shift, assignment = new_schedule[idx]
        
        positions = list(shift.required_positions.keys())
        if not positions:
            return new_schedule
        selected_pos = random.choice(positions)
        
        current_workers = assignment.get(selected_pos, [])
        if current_workers:
            remove_idx = random.randint(0, len(current_workers) - 1)
            removed = current_workers.pop(remove_idx)
            logger.debug(f"移除员工：{removed.name}（{selected_pos}）")
        
        # 获取当前班次中所有已分配的员工（跨职位）
        already_assigned = []
        for pos, workers in assignment.items():
            already_assigned.extend([w.name for w in workers])
        
        # 使用预处理的数据结构获取候选员工
        candidates = [
            e
            for e in self.employee_store_position_map.get((shift.store, selected_pos), [])
            if e.name not in already_assigned
        ]
        
        if candidates:
            new_worker = random.choice(candidates)
            current_workers.append(new_worker)
            logger.debug(f"新增员工：{new_worker.name}（{selected_pos}）- 门店：{shift.store}")
        else:
            logger.debug(f"没有可用的未分配员工，跳过添加")
            
        return new_schedule
    
    def generate_neighbor(self, current_schedule: List[Tuple[Shift, Dict[str, List[Employee]]]]) -> List[Tuple[Shift, Dict[str, List[Employee]]]]:
        """生成相邻解"""
        logger.debug("生成相邻解...")
        new_schedule = copy.deepcopy(current_schedule)
        
        # 随机选择邻域操作类型
        operation_type = random.choice(["swap", "replace", "move"])
        logger.debug(f"选择邻域操作: {operation_type}")
        
        if operation_type == "swap":
            # 操作1: 交换两个班次中的员工
            if len(new_schedule) < 2:
                return self.generate_neighbor_replace(new_schedule)  # 如果只有一个班次，退化为替换操作
                
            # 随机选择两个不同的班次
            idx1, idx2 = random.sample(range(len(new_schedule)), 2)
            shift1, assignment1 = new_schedule[idx1]
            shift2, assignment2 = new_schedule[idx2]
            
            # 尝试找到可以交换的员工
            common_positions = set(assignment1.keys()) & set(assignment2.keys())
            if not common_positions:
                return self.generate_neighbor_replace(new_schedule)  # 没有共同职位，退化为替换操作
                
            selected_pos = random.choice(list(common_positions))
            
            workers1 = assignment1.get(selected_pos, [])
            workers2 = assignment2.get(selected_pos, [])
            
            if not workers1 or not workers2:
                return self.generate_neighbor_replace(new_schedule)  # 任一班次没有该职位的员工，退化为替换操作
                
            # 随机选择要交换的员工
            worker1 = random.choice(workers1)
            worker2 = random.choice(workers2)
            
            # 检查门店匹配
            if worker1.store == shift2.store and worker2.store == shift1.store:
                # 执行交换
                workers1.remove(worker1)
                workers2.remove(worker2)
                workers1.append(worker2)
                workers2.append(worker1)
                logger.debug(f"交换员工: {worker1.name} 和 {worker2.name}")
            else:
                return self.generate_neighbor_replace(new_schedule)  # 门店不匹配，退化为替换操作
                
        elif operation_type == "move":
            # 操作2: 将员工从一个班次移动到另一个班次
            if len(new_schedule) < 2:
                return self.generate_neighbor_replace(new_schedule)  # 如果只有一个班次，退化为替换操作
                
            # 随机选择两个不同的班次
            idx1, idx2 = random.sample(range(len(new_schedule)), 2)
            shift1, assignment1 = new_schedule[idx1]
            shift2, assignment2 = new_schedule[idx2]
            
            # 随机选择一个职位
            if not assignment1:
                return self.generate_neighbor_replace(new_schedule)
                
            selected_pos = random.choice(list(assignment1.keys()))
            workers1 = assignment1.get(selected_pos, [])
            
            if not workers1:
                return self.generate_neighbor_replace(new_schedule)
                
            # 随机选择要移动的员工
            worker = random.choice(workers1)
            
            # 检查目标班次是否需要该职位且员工门店匹配
            if (selected_pos in shift2.required_positions and 
                worker.store == shift2.store and
                worker.name not in [w.name for w in assignment2.get(selected_pos, [])]):
                
                # 执行移动
                workers1.remove(worker)
                if selected_pos not in assignment2:
                    assignment2[selected_pos] = []
                assignment2[selected_pos].append(worker)
                logger.debug(f"移动员工: {worker.name} 从班次{shift1.day} 到班次{shift2.day}")
            else:
                return self.generate_neighbor_replace(new_schedule)  # 条件不满足，退化为替换操作
        else:
            # 操作3: 替换员工（原有的操作）
            return self.generate_neighbor_replace(new_schedule)
            
        return new_schedule
    
    def simulated_annealing(self) -> Tuple[List[Tuple[Shift, Dict[str, List[Employee]]]], float, Dict[str, List[float]]]:
        """使用模拟退火算法生成排班表"""
        # 初始化收敛数据记录
        convergence_data = {"temperatures": [], "current_costs": [], "best_costs": []}
        
        # 初始化随机排班
        current_schedule = self.generate_initial_solution()
        current_cost = self.calculate_cost(current_schedule)
        
        # 记录最佳解
        best_schedule = copy.deepcopy(current_schedule)
        best_cost = current_cost
        
        # 初始化温度和迭代计数
        temperature = self.sa_config["initial_temp"]
        iteration = 0
        
        # 记录初始状态
        convergence_data["temperatures"].append(temperature)
        convergence_data["current_costs"].append(current_cost)
        convergence_data["best_costs"].append(best_cost)
        
        # 模拟退火主循环
        while temperature > self.sa_config["min_temp"]:
            for _ in range(self.sa_config["iter_per_temp"]):
                # 生成邻域解
                new_schedule = self.generate_neighbor(current_schedule)
                new_cost = self.calculate_cost(new_schedule)
                
                # 计算成本差异
                cost_diff = new_cost - current_cost
                
                # 接受准则
                if cost_diff < 0 or random.random() < math.exp(-cost_diff / temperature):
                    current_schedule = new_schedule
                    current_cost = new_cost
                    
                    # 更新最佳解
                    if current_cost < best_cost:
                        best_schedule = copy.deepcopy(current_schedule)
                        best_cost = current_cost
                
                iteration += 1
            
            # 记录当前状态
            convergence_data["temperatures"].append(temperature)
            convergence_data["current_costs"].append(current_cost)
            convergence_data["best_costs"].append(best_cost)
            
            # 降温
            temperature *= self.sa_config["cooling_rate"]
            
            # 日志输出
            logger.info(f"温度: {temperature:.2f}, 当前成本: {current_cost:.2f}, 最佳成本: {best_cost:.2f}")
        
        logger.info(f"模拟退火完成，最终成本: {best_cost:.2f}")
        
        # 返回最佳排班表和成本，以及收敛数据
        return best_schedule, best_cost, convergence_data


def format_schedule_output(schedule: List[Tuple[Shift, Dict[str, List[Employee]]]]) -> List[Dict[str, Any]]:
    """格式化排班结果为易读格式"""
    formatted_schedule = []
    for shift, assignment in schedule:
        shift_data = {
            "day": shift.day,
            "start_time": shift.start_time,
            "end_time": shift.end_time,
            "store": shift.store,
            "assignments": {}
        }
        
        for position, workers in assignment.items():
            shift_data["assignments"][position] = [
                {"name": w.name, "position": w.position, "store": w.store}
                for w in workers
            ]
        
        formatted_schedule.append(shift_data)
    
    return formatted_schedule


def analyze_violations(schedule: List[Tuple[Shift, Dict[str, List[Employee]]]], employees: List[Employee]) -> Dict[str, int]:
    """分析排班方案中的违规情况"""
    violations = {
        "understaff": 0,
        "workday_pref": 0,
        "time_pref": 0,
        "daily_hours": 0,
        "weekly_hours": 0
    }
    
    # 初始化工时统计 - 修改为float类型
    employee_weekly_hours = {e.name: 0.0 for e in employees}
    employee_daily_hours = {e.name: {day: 0.0 for day in range(7)} for e in employees}
    
    # 检查每个班次
    for shift, assignment in schedule:
        # 检查人员配置是否满足需求
        for position, required_count in shift.required_positions.items():
            assigned_count = len(assignment.get(position, []))
            if assigned_count < required_count:
                violations["understaff"] += required_count - assigned_count
        
        # 检查员工约束
        for position, workers in assignment.items():
            for employee in workers:
                # 检查工作日偏好
                if not (employee.workday_pref[0] <= shift.day <= employee.workday_pref[1]):
                    violations["workday_pref"] += 1
                
                # 检查时间偏好
                shift_start = time_to_minutes(shift.start_time)
                shift_end = time_to_minutes(shift.end_time)
                pref_start = time_to_minutes(employee.time_pref[0])
                pref_end = time_to_minutes(employee.time_pref[1])
                
                if shift_start < pref_start or shift_end > pref_end:
                    violations["time_pref"] += 1
                
                # 更新工时统计
                duration = calculate_shift_duration(shift)
                employee_weekly_hours[employee.name] += duration
                employee_daily_hours[employee.name][shift.day] += duration
    
    # 检查工时限制
    for name, days in employee_daily_hours.items():
        employee = next(e for e in employees if e.name == name)
        for day, hours in days.items():
            if hours > employee.max_daily_hours:
                violations["daily_hours"] += 1
    
    for name, hours in employee_weekly_hours.items():
        max_hours = next(e.max_weekly_hours for e in employees if e.name == name)
        if hours > max_hours:
            violations["weekly_hours"] += 1
    
    return violations
