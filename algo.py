import logging
import random
import math
import copy
from datetime import datetime

# 模拟退火算法参数
INITIAL_TEMP = 1000  # 初始温度
MIN_TEMP = 0.1      # 最小温度
COOLING_RATE = 0.95 # 冷却率
NUM_ITERATIONS = 50 # 每个温度下的迭代次数

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 数据结构定义（保持不变）
class Employee:
    def __init__(self, name, position, phone, email, store, 
                 workday_pref=(0,6),  # 周一(0)到周日(6)
                 time_pref=('00:00', '23:59'),
                 max_daily_hours=24,
                 max_weekly_hours=168):
        self.name = name
        self.position = position
        self.phone = phone
        self.email = email
        self.store = store
        self.workday_pref = workday_pref
        self.time_pref = time_pref
        self.max_daily_hours = max_daily_hours
        self.max_weekly_hours = max_weekly_hours

class Shift:
    def __init__(self, day, start_time, end_time, required_positions, store):  # 添加store参数
        self.day = day
        self.start_time = start_time
        self.end_time = end_time
        self.required_positions = required_positions
        self.store = store  # 新增门店属性

# 辅助函数（保持不变）
def time_to_minutes(t):
    hours, mins = map(int, t.split(':'))
    return hours * 60 + mins

def calculate_shift_duration(shift):
    start = time_to_minutes(shift.start_time)
    end = time_to_minutes(shift.end_time)
    return (end - start) / 60

# 初始解生成（添加日志）
def generate_initial_solution(shifts, employees):
    logger.info("开始生成初始解...")
    schedule = []
    for shift in shifts:
        assignment = {}
        for position, count in shift.required_positions.items():
            # 修改：只选择同一门店的员工
            candidates = [e for e in employees if e.position == position and e.store == shift.store]
            selected = random.sample(candidates, min(count, len(candidates)))
            assignment[position] = selected
            logger.debug(f"班次{shift.day} {shift.start_time}-{shift.end_time} - 门店{shift.store} - 分配{position} {len(selected)}人")
        schedule.append((shift, assignment))
    logger.info(f"初始解生成完成，共安排{len(shifts)}个班次")
    return schedule

# 成本计算（添加详细日志）
# 在模拟退火算法参数区块添加成本参数
# 模拟退火算法参数
INITIAL_TEMP = 1000
MIN_TEMP = 0.1
COOLING_RATE = 0.95
NUM_ITERATIONS = 50
COST_PARAMS = {  # 新增成本参数配置
    'understaff_penalty': 100,
    'workday_violation': 10,
    'time_pref_violation': 5,
    'daily_hours_violation': 20,
    'weekly_hours_violation': 50
}

# 修改calculate_cost函数签名和计算逻辑
def calculate_cost(schedule, cost_params=COST_PARAMS):
    logger.debug("开始计算方案成本...")
    cost = 0
    employee_hours = {e.name: 0 for e in employees}
    violation_details = []

    for shift, assignment in schedule:
        # 检查班次需求是否满足
        for position, count in shift.required_positions.items():
            assigned_count = len(assignment.get(position, []))
            if assigned_count < count:
                penalty = cost_params['understaff_penalty'] * (count - assigned_count)
                violation_details.append(
                    f"班次{shift.day} {position} 缺少{count - assigned_count}人（惩罚+{penalty}）"
                )
                cost += penalty
    
        # 检查员工约束
        for position, workers in assignment.items():
            for employee in workers:
                # 工作日偏好
                if not (employee.workday_pref[0] <= shift.day <= employee.workday_pref[1]):
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
            violation_details.append(
                f"{name} 周超时（{hours}h > 限制{max_hours}h）"
            )
            cost += 50

    # 记录详细违规信息
    if violation_details:
        logger.debug(f"发现{len(violation_details)}条违规：")
        for detail in violation_details[:3]:  # 只显示前3条避免日志过多
            logger.debug(f"  * {detail}")
        if len(violation_details) > 3:
            logger.debug(f"  还有{len(violation_details)-3}条未显示...")
    
    logger.debug(f"总成本计算完成：{cost}")
    return cost

# 邻居生成（添加调试日志）
def generate_neighbor(current_schedule):
    logger.debug("生成相邻解...")
    new_schedule = copy.deepcopy(current_schedule)
    
    idx = random.randint(0, len(new_schedule)-1)
    shift, assignment = new_schedule[idx]
    
    positions = list(shift.required_positions.keys())
    if not positions:
        return new_schedule
    selected_pos = random.choice(positions)
    
    current_workers = assignment.get(selected_pos, [])
    if current_workers:
        remove_idx = random.randint(0, len(current_workers)-1)
        removed = current_workers.pop(remove_idx)
        logger.debug(f"移除员工：{removed.name}（{selected_pos}）")
    
    # 修改：只选择同一门店的员工
    candidates = [e for e in employees if e.position == selected_pos and e.store == shift.store]
    if candidates:
        new_worker = random.choice(candidates)
        current_workers.append(new_worker)
        logger.debug(f"新增员工：{new_worker.name}（{selected_pos}）- 门店：{shift.store}")
    
    return new_schedule

# 模拟退火主算法（添加详细日志）
def simulated_annealing(employees, shifts, cost_params=COST_PARAMS):
    logger.info("==== 开始模拟退火算法 ====")
    current_sol = generate_initial_solution(shifts, employees)
    current_cost = calculate_cost(current_sol, cost_params)
    best_sol = copy.deepcopy(current_sol)
    best_cost = current_cost
    
    temp = INITIAL_TEMP
    iteration = 0
    
    logger.info(f"初始温度：{INITIAL_TEMP} 初始成本：{current_cost}")

    while temp > MIN_TEMP:
        iteration += 1
        logger.debug(f"当前温度：{temp:.2f} 当前成本：{current_cost} 最佳成本：{best_cost}")
        
        for _ in range(NUM_ITERATIONS):
            neighbor = generate_neighbor(current_sol)
            neighbor_cost = calculate_cost(neighbor, cost_params)
            
            cost_diff = neighbor_cost - current_cost
            accept_prob = math.exp(-cost_diff/temp) if cost_diff > 0 else 1
            
            if neighbor_cost < current_cost or random.random() < accept_prob:
                current_sol = neighbor
                current_cost = neighbor_cost
                logger.debug(f"接受新解（成本变化：{cost_diff}）")
                
                if neighbor_cost < best_cost:
                    best_sol = copy.deepcopy(neighbor)
                    best_cost = neighbor_cost
                    logger.info(f"发现新最佳解！温度：{temp:.2f} 成本：{best_cost}")
        
        # 温度更新日志
        if iteration % 10 == 0:
            logger.info(f"迭代 [{iteration}] 温度：{temp:.2f} 当前成本：{current_cost} 最佳成本：{best_cost}")
        
        temp *= COOLING_RATE
    
    logger.info("==== 算法结束 ====")
    logger.info(f"最终最佳成本：{best_cost}")
    return best_sol, best_cost

# 结果输出函数（新增）
def print_schedule(schedule):
    logger.info("\n最终排班方案：")
    total_violations = 0
    for shift, assignment in schedule:
        logger.info(f"\n班次 {shift.day+1}（周{shift.day+1}）{shift.start_time}-{shift.end_time}:")
        for position, workers in assignment.items():
            logger.info(f"  {position}: {', '.join([w.name for w in workers])}")
            required = shift.required_positions.get(position, 0)
            if len(workers) < required:
                logger.warning(f"   ! 人手不足：需要{required}人，实际{len(workers)}人")
                total_violations += 1
    logger.info(f"\n总违规数：{total_violations}")

stores = ["旗舰店", "分店A", "分店B"]
positions = {
    "门店经理": 1,
    "副经理": 2,
    "小组长": 3,
    "店员（收银）": 8,
    "店员（导购）": 12,
    "店员（库房）": 6
}

employees = []
for store in stores:
    for position, count in positions.items():
        for i in range(count):
            # 生成员工基础信息
            name = f"{store[:2]}员工{position}{i+1}"
            phone = f"138{random.randint(1000,9999)}{random.randint(1000,9999)}"
            email = f"{name}@store.com".replace("（","").replace("）","")
            
            # 生成排班参数（模拟现实场景）
            workday_pref = (
                random.choice([(0,4), (5,6), (0,6)]),  # 工作日偏好
                random.choices([(0,6), (0,4), (5,6)], weights=[6,3,1])[0]
            )[1]
            
            time_pref_options = [
                ('06:00', '14:00'),   # 早班
                ('14:00', '22:00'),   # 晚班
                ('10:00', '18:00'),   # 中班
                ('00:00', '23:59')    # 任意时间
            ]
            time_pref = random.choices(time_pref_options, weights=[3,3,2,2])[0]
            
            constraints = {}
            if random.random() < 0.3:  # 30%员工有工时限制
                if random.random() < 0.5:
                    constraints["max_daily_hours"] = random.choice([6,8,10])
                else:
                    constraints["max_weekly_hours"] = random.choice([20,30,40])
            
            employees.append(Employee(
                name=name,
                position=position,
                phone=phone,
                email=email,
                store=store,
                workday_pref=workday_pref,
                time_pref=time_pref,
                **constraints
            ))

# 生成复杂班次需求（包含高峰时段和特殊班次）
shifts = [
    # 旗舰店常规班次
    Shift(0, "08:00", "12:00", {"门店经理":1, "副经理":1, "店员（导购）":6}, "旗舰店"),
    Shift(0, "12:00", "18:00", {"副经理":1, "店员（收银）":4, "店员（导购）":8}, "旗舰店"),
    Shift(0, "18:00", "22:00", {"小组长":2, "店员（收银）":3, "店员（库房）":4}, "旗舰店"),
    
    # 分店A特殊班次
    Shift(5, "09:00", "21:00", {"门店经理":1, "店员（收银）":5, "店员（导购）":10}, "分店A"),
    Shift(6, "06:00", "18:00", {"小组长":2, "店员（库房）":5}, "分店A"),
    
    # 分店B夜间班次
    Shift(4, "22:00", "06:00", {"副经理":1, "店员（库房）":4}, "分店B"),
    
    # 全门店通用
    *[Shift(d, "10:00", "22:00", {"店员（导购）":8}, store) 
      for d in [5,6] for store in stores],  # 周末高峰班次
      
    # 特殊节假日班次
    Shift(0, "00:00", "24:00", {"副经理":2, "店员（收银）":4, "店员（导购）":12}, "旗舰店"),
    Shift(0, "04:00", "08:00", {"店员（库房）":3}, "分店A"),
    Shift(5, "16:00", "02:00", {"小组长":1, "店员（导购）":6}, "分店B")
]

if __name__ == "__main__":
    # 运行算法
    best_schedule, cost = simulated_annealing(employees, shifts)
    
    # 输出结果
    print_schedule(best_schedule)