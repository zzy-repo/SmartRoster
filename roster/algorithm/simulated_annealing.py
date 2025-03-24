import math
import copy
import random
from utils.logger import logger
from utils.time_utils import calculate_shift_duration, time_to_minutes
from .schedule_generator import generate_initial_solution, generate_neighbor

# 算法参数
INITIAL_TEMP = 1000.0
MIN_TEMP = 0.1
NUM_ITERATIONS = 100
COOLING_RATE = 0.95

def calculate_cost(schedule, employees):
    logger.debug("开始计算方案成本...")
    cost = 0
    employee_hours = {e.name: 0 for e in employees}
    violation_details = []

    for shift, assignment in schedule:
        # 检查班次需求是否满足
        for position, count in shift.required_positions.items():
            assigned_count = len(assignment.get(position, []))
            if assigned_count < count:
                penalty = 100 * (count - assigned_count)
                violation_details.append(
                    f"班次{shift.day} {position} 缺少{count - assigned_count}人（惩罚+{penalty}）"
                )
                cost += penalty

        # 检查员工约束
        for position, workers in assignment.items():
            for employee in workers:
                # 工作日偏好
                if not (
                    employee.workday_pref[0] <= shift.day <= employee.workday_pref[1]
                ):
                    violation_details.append(
                        f"{employee.name} 工作日偏好冲突（周{shift.day+1}，偏好周{employee.workday_pref[0]+1}-周{employee.workday_pref[1]+1}）"
                    )
                    cost += 10

                # 工作时间偏好
                shift_start = time_to_minutes(shift.start_time)
                shift_end = time_to_minutes(shift.end_time)
                pref_start = time_to_minutes(employee.time_pref[0])
                pref_end = time_to_minutes(employee.time_pref[1])
                if shift_start < pref_start or shift_end > pref_end:
                    violation_details.append(
                        f"{employee.name} 时间偏好冲突（班次{shift.start_time}-{shift.end_time} vs 偏好{employee.time_pref[0]}-{employee.time_pref[1]}）"
                    )
                    cost += 5

                # 更新工作时长
                duration = calculate_shift_duration(shift)
                employee_hours[employee.name] += duration

                # 每日时长限制
                if duration > employee.max_daily_hours:
                    violation_details.append(
                        f"{employee.name} 单日超时（{duration}h > 限制{employee.max_daily_hours}h）"
                    )
                    cost += 20

    # 检查每周时长限制
    for name, hours in employee_hours.items():
        max_hours = next(e.max_weekly_hours for e in employees if e.name == name)
        if hours > max_hours:
            violation_details.append(f"{name} 周超时（{hours}h > 限制{max_hours}h）")
            cost += 50

    # 记录详细违规信息
    if violation_details:
        logger.debug(f"发现{len(violation_details)}条违规：")
        for detail in violation_details[:3]:
            logger.debug(f"  * {detail}")
        if len(violation_details) > 3:
            logger.debug(f"  还有{len(violation_details)-3}条未显示...")

    logger.debug(f"总成本计算完成：{cost}")
    return cost

def simulated_annealing(employees, shifts):
    logger.info("==== 开始模拟退火算法 ====")
    current_sol = generate_initial_solution(shifts, employees)
    current_cost = calculate_cost(current_sol, employees)
    best_sol = copy.deepcopy(current_sol)
    best_cost = current_cost

    temp = INITIAL_TEMP
    iteration = 0

    logger.info(f"初始温度：{INITIAL_TEMP} 初始成本：{current_cost}")

    while temp > MIN_TEMP:
        iteration += 1
        logger.debug(
            f"当前温度：{temp:.2f} 当前成本：{current_cost} 最佳成本：{best_cost}"
        )

        for _ in range(NUM_ITERATIONS):
            neighbor = generate_neighbor(current_sol, employees)
            neighbor_cost = calculate_cost(neighbor, employees)

            cost_diff = neighbor_cost - current_cost
            accept_prob = math.exp(-cost_diff / temp) if cost_diff > 0 else 1

            if neighbor_cost < current_cost or random.random() < accept_prob:
                current_sol = neighbor
                current_cost = neighbor_cost
                logger.debug(f"接受新解（成本变化：{cost_diff}）")

                if neighbor_cost < best_cost:
                    best_sol = copy.deepcopy(neighbor)
                    best_cost = neighbor_cost
                    logger.info(f"发现新最佳解！温度：{temp:.2f} 成本：{best_cost}")

        if iteration % 10 == 0:
            logger.info(
                f"迭代 [{iteration}] 温度：{temp:.2f} 当前成本：{current_cost} 最佳成本：{best_cost}"
            )

        temp *= COOLING_RATE

    logger.info("==== 算法结束 ====")
    logger.info(f"最终最佳成本：{best_cost}")
    return best_sol, best_cost