import logging
import random
import math
import copy
from datetime import datetime
import matplotlib.pyplot as plt
import csv
import os

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# 常量配置
DATA_DIR = r"e:\workplace\SmartRoster\roster\data"

# 模拟退火算法参数
SA_CONFIG = {
    "initial_temp": 1000,  # 初始温度
    "min_temp": 0.1,       # 最小温度
    "cooling_rate": 0.95,  # 冷却率
    "iterations": 50,      # 每个温度下的迭代次数
}

# 成本参数配置
COST_PARAMS = {
    "understaff_penalty": 100,
    "workday_violation": 10,
    "time_pref_violation": 5,
    "daily_hours_violation": 20,
    "weekly_hours_violation": 50,
}


# 数据结构定义
class Employee:
    def __init__(
        self,
        name,
        position,
        phone,
        email,
        store,
        workday_pref=(0, 6),  # 周一(0)到周日(6)
        time_pref=("00:00", "23:59"),
        max_daily_hours=24,
        max_weekly_hours=168,
    ):
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
    def __init__(self, day, start_time, end_time, required_positions, store):
        self.day = day
        self.start_time = start_time
        self.end_time = end_time
        self.required_positions = required_positions
        self.store = store


# 辅助函数
def time_to_minutes(t):
    hours, mins = map(int, t.split(":"))
    return hours * 60 + mins


def calculate_shift_duration(shift):
    start = time_to_minutes(shift.start_time)
    end = time_to_minutes(shift.end_time)
    return (end - start) / 60


# 数据生成类
class DataGenerator:
    @staticmethod
    def generate_employees(stores, positions):
        """生成员工数据"""
        employees = []
        for store in stores:
            for position, count in positions.items():
                for i in range(count):
                    # 生成员工基础信息
                    name = f"{store[:2]}员工{position}{i+1}"
                    phone = f"138{random.randint(1000,9999)}{random.randint(1000,9999)}"
                    email = f"{name}@store.com".replace("（", "").replace("）", "")

                    # 生成排班参数（模拟现实场景）
                    workday_pref = random.choices([(0, 6), (0, 4), (5, 6)], weights=[6, 3, 1])[0]

                    time_pref_options = [
                        ("06:00", "14:00"),  # 早班
                        ("14:00", "22:00"),  # 晚班
                        ("10:00", "18:00"),  # 中班
                        ("00:00", "23:59"),  # 任意时间
                    ]
                    time_pref = random.choices(time_pref_options, weights=[3, 3, 2, 2])[0]

                    constraints = {}
                    if random.random() < 0.3:  # 30%员工有工时限制
                        if random.random() < 0.5:
                            constraints["max_daily_hours"] = random.choice([6, 8, 10])
                        else:
                            constraints["max_weekly_hours"] = random.choice([20, 30, 40])

                    employees.append(
                        Employee(
                            name=name,
                            position=position,
                            phone=phone,
                            email=email,
                            store=store,
                            workday_pref=workday_pref,
                            time_pref=time_pref,
                            **constraints,
                        )
                    )
        return employees

    @staticmethod
    def generate_shifts(stores):
        """生成班次数据"""
        shifts = [
            # 旗舰店常规班次
            Shift(0, "08:00", "12:00", {"门店经理": 1, "副经理": 1, "店员（导购）": 6}, "旗舰店"),
            Shift(0, "12:00", "18:00", {"副经理": 1, "店员（收银）": 4, "店员（导购）": 8}, "旗舰店"),
            Shift(0, "18:00", "22:00", {"小组长": 2, "店员（收银）": 3, "店员（库房）": 4}, "旗舰店"),
            # 分店A特殊班次
            Shift(5, "09:00", "21:00", {"门店经理": 1, "店员（收银）": 5, "店员（导购）": 10}, "分店A"),
            Shift(6, "06:00", "18:00", {"小组长": 2, "店员（库房）": 5}, "分店A"),
            # 分店B夜间班次
            Shift(4, "22:00", "06:00", {"副经理": 1, "店员（库房）": 4}, "分店B"),
            # 全门店通用
            *[
                Shift(d, "10:00", "22:00", {"店员（导购）": 8}, store)
                for d in [5, 6]
                for store in stores
            ],  # 周末高峰班次
            # 特殊节假日班次
            Shift(0, "00:00", "24:00", {"副经理": 2, "店员（收银）": 4, "店员（导购）": 12}, "旗舰店"),
            Shift(0, "04:00", "08:00", {"店员（库房）": 3}, "分店A"),
            Shift(5, "16:00", "02:00", {"小组长": 1, "店员（导购）": 6}, "分店B"),
        ]
        return shifts


# 排班算法类
class SchedulingAlgorithm:
    def __init__(self, employees, shifts, sa_config=SA_CONFIG, cost_params=COST_PARAMS):
        self.employees = employees
        self.shifts = shifts
        self.sa_config = sa_config
        self.cost_params = cost_params
        
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
        employee_hours = {e.name: 0 for e in self.employees}
        violation_details = []

        for shift, assignment in schedule:
            # 检查班次需求是否满足
            for position, count in shift.required_positions.items():
                assigned_count = len(assignment.get(position, []))
                if assigned_count < count:
                    penalty = self.cost_params["understaff_penalty"] * (count - assigned_count)
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

                    # 更新工作时长
                    duration = calculate_shift_duration(shift)
                    employee_hours[employee.name] += duration

                    # 每日时长限制
                    if duration > employee.max_daily_hours:
                        violation_details.append(
                            f"{employee.name} 单日超时（{duration}h > 限制{employee.max_daily_hours}h）"
                        )
                        cost += self.cost_params["daily_hours_violation"]

        # 检查每周时长限制
        for name, hours in employee_hours.items():
            max_hours = next(e.max_weekly_hours for e in self.employees if e.name == name)
            if hours > max_hours:
                violation_details.append(f"{name} 周超时（{hours}h > 限制{max_hours}h）")
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

        # 只选择同一门店的员工
        candidates = [
            e for e in self.employees if e.position == selected_pos and e.store == shift.store
        ]
        if candidates:
            new_worker = random.choice(candidates)
            current_workers.append(new_worker)
            logger.debug(
                f"新增员工：{new_worker.name}（{selected_pos}）- 门店：{shift.store}"
            )

        return new_schedule

    def simulated_annealing(self):
        """模拟退火算法主流程"""
        logger.info("==== 开始模拟退火算法 ====")
        # 数据收集变量
        temperatures = []
        current_costs = []
        best_costs = []
        
        # 初始化
        current_sol = self.generate_initial_solution()
        current_cost = self.calculate_cost(current_sol)
        best_sol = copy.deepcopy(current_sol)
        best_cost = current_cost

        temp = self.sa_config["initial_temp"]
        iteration = 0

        logger.info(f"初始温度：{self.sa_config['initial_temp']} 初始成本：{current_cost}")

        # 主循环
        while temp > self.sa_config["min_temp"]:
            iteration += 1
            logger.debug(
                f"当前温度：{temp:.2f} 当前成本：{current_cost} 最佳成本：{best_cost}"
            )

            for _ in range(self.sa_config["iterations"]):
                neighbor = self.generate_neighbor(current_sol)
                neighbor_cost = self.calculate_cost(neighbor)

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

            # 数据收集
            temperatures.append(temp)
            current_costs.append(current_cost)
            best_costs.append(best_cost)

            if iteration % 10 == 0:
                logger.info(
                    f"迭代 [{iteration}] 温度：{temp:.2f} 当前成本：{current_cost} 最佳成本：{best_cost}"
                )

            temp *= self.sa_config["cooling_rate"]

        # 可视化结果
        self._visualize_convergence(temperatures, current_costs, best_costs)
        
        logger.info("==== 算法结束 ====")
        return best_sol, best_cost

    def _visualize_convergence(self, temperatures, current_costs, best_costs):
        """可视化收敛过程"""
        plt.rcParams["font.family"] = "Microsoft YaHei"  # 设置中文字体
        plt.rcParams["axes.unicode_minus"] = False  # 解决负号显示问题
        plt.figure(figsize=(12, 6))

        # 创建双Y轴
        ax1 = plt.gca()
        ax2 = ax1.twinx()

        # 绘制成本曲线
        (line1,) = ax1.plot(
            range(len(temperatures)), current_costs, "b-", label="当前成本", alpha=0.5
        )
        (line2,) = ax1.plot(range(len(temperatures)), best_costs, "r-", label="最佳成本")

        # 绘制温度曲线（对数坐标）
        (line3,) = ax2.plot(range(len(temperatures)), temperatures, "g--", label="温度")
        ax2.set_yscale("log")

        # 设置图表属性
        ax1.set_xlabel("迭代次数")
        ax1.set_ylabel("成本值")
        ax2.set_ylabel("温度（对数尺度）")
        plt.title("模拟退火算法收敛过程")

        # 合并图例
        lines = [line1, line2, line3]
        labels = [l.get_label() for l in lines]
        plt.legend(lines, labels, loc="upper right")

        # 保存图表
        plt_path = os.path.join(DATA_DIR, "convergence_plot.png")
        plt.savefig(plt_path)
        logger.info(f"收敛图表已保存至 {plt_path}")


# 结果分析与输出类
class ScheduleAnalyzer:
    def __init__(self, schedule, employees):
        self.schedule = schedule
        self.employees = employees
        
    def print_schedule(self):
        """打印排班结果和违规统计"""
        logger.info("\n最终排班方案：")
        violation_stats = {
            "understaff": 0,
            "workday_conflict": 0,
            "time_pref_conflict": 0,
            "daily_overhours": 0,
            "weekly_overhours": 0,
        }
        employee_hours = {e.name: 0 for e in self.employees}
        examples = []

        # 第一遍遍历：收集工时数据
        for shift, assignment in self.schedule:
            for position, workers in assignment.items():
                for employee in workers:
                    duration = calculate_shift_duration(shift)
                    employee_hours[employee.name] += duration

        # 第二遍遍历：检测违规
        for shift, assignment in self.schedule:
            logger.info(
                f"\n班次 {shift.day+1}（周{shift.day+1}）{shift.start_time}-{shift.end_time}:"
            )

            # 检查人手不足
            for position, count in shift.required_positions.items():
                assigned = len(assignment.get(position, []))
                if assigned < count:
                    violation_stats["understaff"] += 1
                    examples.append(
                        f"班次{shift.day+1} {position} 需要{count}人，实际{assigned}人"
                    )
                    logger.warning(
                        f"  ! {position}人手不足：需要{count}人，实际{assigned}人"
                    )

            # 检查员工约束
            for position, workers in assignment.items():
                logger.info(f"  {position}: {', '.join([w.name for w in workers])}")
                for employee in workers:
                    # 工作日冲突
                    if not (
                        employee.workday_pref[0] <= shift.day <= employee.workday_pref[1]
                    ):
                        violation_stats["workday_conflict"] += 1
                        examples.append(
                            f"{employee.name} 周{shift.day+1}班次与偏好周{employee.workday_pref[0]+1}-周{employee.workday_pref[1]+1}冲突"
                        )

                    # 时间偏好冲突
                    shift_start = time_to_minutes(shift.start_time)
                    shift_end = time_to_minutes(shift.end_time)
                    pref_start = time_to_minutes(employee.time_pref[0])
                    pref_end = time_to_minutes(employee.time_pref[1])
                    if shift_start < pref_start or shift_end > pref_end:
                        violation_stats["time_pref_conflict"] += 1
                        examples.append(
                            f"{employee.name} 班次时间{shift.start_time}-{shift.end_time}超出偏好时段"
                        )

                    # 每日时长检查
                    duration = calculate_shift_duration(shift)
                    if duration > employee.max_daily_hours:
                        violation_stats["daily_overhours"] += 1
                        examples.append(
                            f"{employee.name} 单日工作{duration}小时（限制{employee.max_daily_hours}小时）"
                        )

            # 每周时长检查
            for name, hours in employee_hours.items():
                employee = next(e for e in self.employees if e.name == name)
                if hours > employee.max_weekly_hours:
                    violation_stats["weekly_overhours"] += 1
                    examples.append(
                        f"{name} 周总工时{hours}小时（限制{employee.max_weekly_hours}小时）"
                    )

        # 输出统计结果
        logger.info("\n=== 违规统计 ===")
        logger.info(f"1. 人手不足: {violation_stats['understaff']}次")
        logger.info(f"2. 工作日冲突: {violation_stats['workday_conflict']}次")
        logger.info(f"3. 时间偏好冲突: {violation_stats['time_pref_conflict']}次")
        logger.info(f"4. 单日超时: {violation_stats['daily_overhours']}次")
        logger.info(f"5. 周超时: {violation_stats['weekly_overhours']}次")

        # 输出示例（最多5条）
        logger.info("\n=== 违规示例 ===")
        for example in examples[:5]:
            logger.warning(f"· {example}")
        if len(examples) > 5:
            logger.info(f"（共{len(examples)}条违规记录，仅显示前5条示例）")


# 数据导出类
class DataExporter:
    @staticmethod
    def export_input_data(employees, shifts):
        """导出输入数据到CSV文件"""
        # 确保数据目录存在
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # 导出员工数据
        employee_path = os.path.join(DATA_DIR, "employees.csv")
        with open(employee_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['姓名', '职位', '门店', '工作日偏好', '时间偏好', '最大日工时', '最大周工时'])
            for e in employees:
                writer.writerow([
                    e.name, e.position, e.store,
                    f"周{e.workday_pref[0]+1}-周{e.workday_pref[1]+1}",
                    f"{e.time_pref[0]}-{e.time_pref[1]}",
                    e.max_daily_hours, e.max_weekly_hours
                ])
        
        # 导出班次需求
        shift_path = os.path.join(DATA_DIR, "shifts.csv")
        with open(shift_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['周几', '开始时间', '结束时间', '门店', '职位需求'])
            for s in shifts:
                writer.writerow([
                    s.day+1, s.start_time, s.end_time, 
                    s.store, str(s.required_positions)
                ])
        
        logger.info(f"输入数据已导出至 {employee_path} 和 {shift_path}")

    @staticmethod
    def export_schedule(schedule):
        """导出排班结果到CSV文件"""
        # 确保数据目录存在
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # 导出排班结果
        schedule_path = os.path.join(DATA_DIR, "schedule.csv")
        with open(schedule_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['周几', '开始时间', '结束时间', '门店', '职位', '分配员工'])
            for shift, assignment in schedule:
                for position, workers in assignment.items():
                    writer.writerow([
                        shift.day+1, shift.start_time, shift.end_time,
                        shift.store, position, 
                        '、'.join([w.name for w in workers])
                    ])
        
        logger.info(f"排班结果已导出至 {schedule_path}")


# 主程序
if __name__ == "__main__":
    # 基础数据
    stores = ["旗舰店", "分店A", "分店B"]
    positions = {
        "门店经理": 1,
        "副经理": 2,
        "小组长": 3,
        "店员（收银）": 8,
        "店员（导购）": 12,
        "店员（库房）": 6,
    }
    
    # 生成测试数据
    employees = DataGenerator.generate_employees(stores, positions)
    shifts = DataGenerator.generate_shifts(stores)
    
    # 导出输入数据
    DataExporter.export_input_data(employees, shifts)
    
    # 运行排班算法
    scheduler = SchedulingAlgorithm(employees, shifts)
    best_schedule, cost = scheduler.simulated_annealing()
    
    # 分析并输出结果
    analyzer = ScheduleAnalyzer(best_schedule, employees)
    analyzer.print_schedule()
    
    # 导出排班结果
    DataExporter.export_schedule(best_schedule)