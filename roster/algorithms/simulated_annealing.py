import random
import math
import copy
import os
import matplotlib.pyplot as plt

# 导入配置
from config.settings import DATA_DIR, SA_CONFIG, COST_PARAMS

# 导入日志配置
from utils.logger import get_logger

# 获取logger实例
logger = get_logger(__name__)


# 辅助函数
def time_to_minutes(t):
    hours, mins = map(int, t.split(":"))
    return hours * 60 + mins


def calculate_shift_duration(shift):
    start = time_to_minutes(shift.start_time)
    end = time_to_minutes(shift.end_time)
    return (end - start) / 60


# 排班算法类
class SchedulingAlgorithm:
    def __init__(self, employees, shifts, sa_config=None, cost_params=None):
        self.employees = employees
        self.shifts = shifts
        self.sa_config = sa_config if sa_config is not None else SA_CONFIG
        self.cost_params = cost_params if cost_params is not None else COST_PARAMS

        # 确保数据目录存在
        os.makedirs(DATA_DIR, exist_ok=True)

    def generate_initial_solution(self):
        """生成初始解"""
        logger.info("开始生成初始解...")
        schedule = []
        for shift in self.shifts:
            assignment = {}
            for position, count in shift.required_positions.items():
                # 只选择同一门店的员工
                candidates = [
                    e
                    for e in self.employees
                    if e.position == position and e.store == shift.store
                ]
                selected = random.sample(candidates, min(count, len(candidates)))
                assignment[position] = selected
                logger.debug(
                    f"班次{shift.day} {shift.start_time}-{shift.end_time} - 门店{shift.store} - 分配{position} {len(selected)}人"
                )
            schedule.append((shift, assignment))
        logger.info(f"初始解生成完成，共安排{len(self.shifts)}个班次")
        return schedule

    def calculate_cost(self, schedule):
        """计算排班方案成本"""
        logger.debug("开始计算方案成本...")
        cost = 0
        # 修改数据结构，按员工和日期分别统计工时
        employee_weekly_hours = {e.name: 0 for e in self.employees}
        employee_daily_hours = {
            e.name: {day: 0 for day in range(7)} for e in self.employees
        }
        violation_details = []

        for shift, assignment in schedule:
            # 检查班次需求是否满足
            for position, count in shift.required_positions.items():
                assigned_count = len(assignment.get(position, []))
                if assigned_count < count:
                    penalty = self.cost_params["understaff_penalty"] * (
                        count - assigned_count
                    )
                    violation_details.append(
                        f"班次{shift.day} {position} 缺少{count - assigned_count}人（惩罚+{penalty}）"
                    )
                    cost += penalty

            # 检查员工约束
            for position, workers in assignment.items():
                for employee in workers:
                    # 工作日偏好
                    if not (
                        employee.workday_pref[0]
                        <= shift.day
                        <= employee.workday_pref[1]
                    ):
                        violation_details.append(
                            f"{employee.name} 工作日偏好冲突（周{shift.day+1}，偏好周{employee.workday_pref[0]+1}-周{employee.workday_pref[1]+1}）"
                        )
                        cost += self.cost_params["workday_violation"]

                    # 工作时间偏好
                    shift_start = time_to_minutes(shift.start_time)
                    shift_end = time_to_minutes(shift.end_time)
                    pref_start = time_to_minutes(employee.time_pref[0])
                    pref_end = time_to_minutes(employee.time_pref[1])
                    if shift_start < pref_start or shift_end > pref_end:
                        violation_details.append(
                            f"{employee.name} 时间偏好冲突（班次{shift.start_time}-{shift.end_time} vs 偏好{employee.time_pref[0]}-{employee.time_pref[1]}）"
                        )
                        cost += self.cost_params["time_pref_violation"]

                    # 更新工作时长 - 同时更新每日和每周工时
                    duration = calculate_shift_duration(shift)
                    employee_weekly_hours[employee.name] += duration
                    employee_daily_hours[employee.name][shift.day] += duration

        # 检查每日时长限制
        for name, daily_hours in employee_daily_hours.items():
            employee = next(e for e in self.employees if e.name == name)
            for day, hours in daily_hours.items():
                if hours > employee.max_daily_hours:
                    violation_details.append(
                        f"{name} 周{day+1}日工作{hours:.1f}小时（限制{employee.max_daily_hours}小时）"
                    )
                    cost += self.cost_params["daily_hours_violation"]

        # 检查每周时长限制
        for name, hours in employee_weekly_hours.items():
            max_hours = next(
                e.max_weekly_hours for e in self.employees if e.name == name
            )
            if hours > max_hours:
                violation_details.append(
                    f"{name} 周总工时{hours:.1f}小时（限制{max_hours}小时）"
                )
                cost += self.cost_params["weekly_hours_violation"]

        # 记录详细违规信息
        if violation_details:
            logger.debug(f"发现{len(violation_details)}条违规：")
            for detail in violation_details[:3]:  # 只显示前3条避免日志过多
                logger.debug(f"  * {detail}")
            if len(violation_details) > 3:
                logger.debug(f"  还有{len(violation_details)-3}条未显示...")

        logger.debug(f"总成本计算完成：{cost}")
        return cost

    def generate_neighbor(self, current_schedule):
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
        
    def generate_neighbor_replace(self, current_schedule):
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
        
        # 只选择同一门店的员工，且排除已分配到该班次的员工
        candidates = [
            e
            for e in self.employees
            if e.position == selected_pos
            and e.store == shift.store
            and e.name not in already_assigned
        ]
        
        if candidates:
            new_worker = random.choice(candidates)
            current_workers.append(new_worker)
            logger.debug(f"新增员工：{new_worker.name}（{selected_pos}）- 门店：{shift.store}")
        else:
            logger.debug(f"没有可用的未分配员工，跳过添加")
            
        return new_schedule

    def simulated_annealing(self):
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
                if cost_diff < 0 or random.random() < math.exp(
                    -cost_diff / temperature
                ):
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
            logger.info(
                f"温度: {temperature:.2f}, 当前成本: {current_cost:.2f}, 最佳成本: {best_cost:.2f}"
            )

        logger.info(f"模拟退火完成，最终成本: {best_cost:.2f}")

        # 返回最佳排班表和成本，以及收敛数据
        return best_schedule, best_cost, convergence_data
