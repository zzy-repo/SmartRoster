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
    def __init__(self, day, start_time, end_time, required_positions):
        self.day = day
        self.start_time = start_time
        self.end_time = end_time
        self.required_positions = required_positions

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
            candidates = [e for e in employees if e.position == position]
            selected = random.sample(candidates, min(count, len(candidates)))
            assignment[position] = selected
            logger.debug(f"班次{shift.day} {shift.start_time}-{shift.end_time} - 分配{position} {len(selected)}人")
        schedule.append((shift, assignment))
    logger.info(f"初始解生成完成，共安排{len(shifts)}个班次")
    return schedule

# 成本计算（添加详细日志）
def calculate_cost(schedule):
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
    
    candidates = [e for e in employees if e.position == selected_pos]
    if candidates:
        new_worker = random.choice(candidates)
        current_workers.append(new_worker)
        logger.debug(f"新增员工：{new_worker.name}（{selected_pos}）")
    
    return new_schedule

# 模拟退火主算法（添加详细日志）
def simulated_annealing(employees, shifts):
    logger.info("==== 开始模拟退火算法 ====")
    current_sol = generate_initial_solution(shifts, employees)
    current_cost = calculate_cost(current_sol)
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
            neighbor_cost = calculate_cost(neighbor)
            
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


# 测试数据
stores = ["旗舰店", "分店A", "分店B"]
positions = ["门店经理", "副经理", "小组长", "店员（收银）", "店员（导购）", "店员（库房）"]

# 创建20名员工
employees = [
    # 旗舰店员工
    Employee("张伟", "门店经理", "13800010001", "zhang@store.com", "旗舰店",
             workday_pref=(0, 4), time_pref=('09:00', '18:00'), max_daily_hours=10),
    Employee("王芳", "副经理", "13800010002", "wang@store.com", "旗舰店",
             workday_pref=(0, 6), time_pref=('12:00', '21:00'), max_weekly_hours=50),
    Employee("李强", "店员（收银）", "13800010003", "li@store.com", "旗舰店",
             workday_pref=(4, 6), time_pref=('16:00', '23:00'), max_daily_hours=6),
    Employee("赵敏", "店员（导购）", "13800010004", "zhao@store.com", "旗舰店",
             workday_pref=(0, 3), time_pref=('08:00', '17:00'), max_weekly_hours=30),
    Employee("周杰", "店员（库房）", "13800010005", "zhou@store.com", "旗舰店",
             workday_pref=(0, 6), time_pref=('06:00', '14:00'), max_daily_hours=8),

    # 分店A员工
    Employee("陈婷", "门店经理", "13800020001", "chen@store.com", "分店A",
             workday_pref=(5, 6), time_pref=('10:00', '20:00'), max_weekly_hours=45),
    Employee("刘洋", "副经理", "13800020002", "liu@store.com", "分店A",
             workday_pref=(0, 4), time_pref=('07:00', '15:00')),
    Employee("徐璐", "小组长", "13800020003", "xu@store.com", "分店A",
             workday_pref=(2, 4), time_pref=('13:00', '21:00'), max_daily_hours=9),
    Employee("孙浩", "店员（收银）", "13800020004", "sun@store.com", "分店A",
             workday_pref=(0, 6), time_pref=('00:00', '23:59'), max_weekly_hours=40),
    Employee("吴倩", "店员（导购）", "13800020005", "wu@store.com", "分店A",
             workday_pref=(1, 5), time_pref=('09:30', '18:30'), max_daily_hours=7),

    # 分店B员工
    Employee("郑凯", "门店经理", "13800030001", "zheng@store.com", "分店B",
             workday_pref=(3, 5), time_pref=('11:00', '23:00'), max_weekly_hours=55),
    Employee("林娜", "副经理", "13800030002", "lin@store.com", "分店B",
             workday_pref=(0, 2), time_pref=('06:00', '12:00')),
    Employee("罗毅", "小组长", "13800030003", "luo@store.com", "分店B",
             workday_pref=(0, 6), time_pref=('08:00', '20:00'), max_daily_hours=10),
    Employee("唐薇", "店员（收银）", "13800030004", "tang@store.com", "分店B",
             workday_pref=(4, 6), time_pref=('14:00', '22:00')),
    Employee("韩磊", "店员（库房）", "13800030005", "han@store.com", "分店B",
             workday_pref=(0, 3), time_pref=('04:00', '12:00'), max_weekly_hours=35),

    # 跨店支援员工
    Employee("欧阳雪", "店员（导购）", "13800040001", "ouyang@store.com", "分店A",
             workday_pref=(0, 6), time_pref=('10:00', '22:00'), max_weekly_hours=60),
    Employee("慕容云", "店员（收银）", "13800040002", "murong@store.com", "旗舰店",
             workday_pref=(0, 4), time_pref=('07:30', '16:30')),
    Employee("诸葛明", "副经理", "13800040003", "zhuge@store.com", "分店B",
             workday_pref=(5, 6), time_pref=('18:00', '24:00'), max_daily_hours=8),
    Employee("司马燕", "店员（导购）", "13800040004", "sima@store.com", "旗舰店",
             workday_pref=(0, 6), time_pref=('00:00', '23:59')),
]

# 创建复杂班次需求
shifts = [
    # 旗舰店班次
    Shift(0, "08:00", "12:00", {"门店经理":1, "店员（导购）":2}),
    Shift(0, "12:00", "18:00", {"副经理":1, "店员（收银）":2, "店员（导购）":3}),
    Shift(0, "18:00", "22:00", {"小组长":1, "店员（收银）":1, "店员（库房）":2}),
    Shift(5, "09:00", "21:00", {"门店经理":1, "副经理":1, "店员（收银）":4, "店员（导购）":5}),

    # 分店A班次
    Shift(2, "06:00", "12:00", {"店员（库房）":3}),
    Shift(3, "12:00", "24:00", {"副经理":1, "店员（收银）":3, "店员（导购）":4}),
    Shift(6, "10:00", "22:00", {"门店经理":1, "小组长":2, "店员（导购）":6}),

    # 分店B班次
    Shift(4, "22:00", "06:00", {"副经理":1, "店员（库房）":3}),  # 跨天班次
    Shift(5, "08:00", "20:00", {"门店经理":1, "店员（收银）":3, "店员（导购）":3}),
    Shift(6, "09:00", "18:00", {"小组长":1, "店员（导购）":4}),

    # 特殊班次
    Shift(0, "00:00", "24:00", {"副经理":2, "店员（收银）":2}),  # 全天候班次
    Shift(3, "04:00", "08:00", {"店员（库房）":2}),  # 凌晨班次
    Shift(5, "16:00", "02:00", {"门店经理":1, "店员（导购）":5}),  # 跨午夜班次
]

if __name__ == "__main__":
    # 运行算法
    best_schedule, cost = simulated_annealing(employees, shifts)
    
    # 输出结果
    print_schedule(best_schedule)