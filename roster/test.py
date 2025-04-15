import random
import time
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from scheduler import Employee, Shift, SchedulingAlgorithm, analyze_violations

def generate_test_data(scale="medium", seed=None):
    """生成测试数据
    
    参数:
        scale: 测试规模，可选 "small", "medium", "large"
        seed: 随机种子，用于生成可重复的测试数据
    """
    if seed is not None:
        random.seed(seed)
    
    # 根据规模设置参数
    if scale == "small":
        stores = ["Store_A", "Store_B"]
        positions = ["Manager", "Cashier", "Sales"]
        employee_count = 15
        shift_types = [
            ("09:00", "17:00"),  # 早班
        ]
    elif scale == "medium":
        stores = ["Store_A", "Store_B", "Store_C"]
        positions = ["Manager", "Cashier", "Sales", "Stocker"]
        employee_count = 30
        shift_types = [
            ("09:00", "17:00"),  # 早班
            ("13:00", "21:00")   # 晚班
        ]
    else:  # large
        stores = ["Store_A", "Store_B", "Store_C", "Store_D", "Store_E"]
        positions = ["Manager", "Assistant Manager", "Cashier", "Sales", "Stocker", "Security"]
        employee_count = 60
        shift_types = [
            ("07:00", "15:00"),  # 早班
            ("11:00", "19:00"),  # 中班
            ("15:00", "23:00")   # 晚班
        ]
    
    print(f"生成{scale}规模测试数据: {len(stores)}个门店, {len(positions)}种职位, {employee_count}名员工")
    
    # 生成员工数据
    employees = []
    for i in range(employee_count):
        # 随机分配门店和职位
        store = random.choice(stores)
        position = random.choice(positions)
        
        # 随机生成工作日偏好（确保至少工作3天）
        start_day = random.randint(0, 4)
        end_day = random.randint(start_day + 2, 6)
        
        # 随机生成时间偏好（确保至少工作6小时）
        start_hour = random.randint(7, 13)
        end_hour = random.randint(start_hour + 6, 23)
        start_time = f"{start_hour:02d}:00"
        end_time = f"{end_hour:02d}:00"
        
        employee = Employee(
            name=f"Employee_{i+1}",
            position=position,
            store=store,
            workday_pref=(start_day, end_day),
            time_pref=(start_time, end_time),
            max_daily_hours=8.0,
            max_weekly_hours=40.0
        )
        employees.append(employee)
    
    # 生成班次数据
    shifts = []
    for store in stores:
        for day in range(7):  # 一周7天
            for start_time, end_time in shift_types:
                # 每个班次的人员需求
                required_positions = {}
                for position in positions:
                    # 根据职位设置不同的需求量
                    if position.endswith("Manager"):
                        required_positions[position] = 1
                    elif position == "Security":
                        required_positions[position] = random.randint(0, 1)
                    else:
                        required_positions[position] = random.randint(1, 3)
                
                shift = Shift(
                    day=day,
                    start_time=start_time,
                    end_time=end_time,
                    required_positions=required_positions,
                    store=store
                )
                shifts.append(shift)
    
    print(f"生成班次数据完成: 共{len(shifts)}个班次")
    return employees, shifts

def plot_convergence(convergence_data, filename='convergence.png'):
    """绘制算法收敛过程"""
    plt.figure(figsize=(12, 6))
    
    # 绘制温度变化
    plt.subplot(1, 2, 1)
    plt.plot(convergence_data["temperatures"], label="Temperature")
    plt.xlabel("Iteration")
    plt.ylabel("Temperature")
    plt.title("Temperature Cooling Process")
    plt.yscale("log")
    plt.grid(True)
    plt.legend()
    
    # 绘制成本变化
    plt.subplot(1, 2, 2)
    plt.plot(convergence_data["current_costs"], label="Current Cost", alpha=0.5)
    plt.plot(convergence_data["best_costs"], label="Best Cost", linewidth=2)
    plt.xlabel("Iteration")
    plt.ylabel("Cost")
    plt.title("Cost Convergence")
    plt.grid(True)
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(filename)
    plt.close()

def analyze_results(schedule, employees):
    """分析排班结果"""
    # 分析违规情况
    violations = analyze_violations(schedule, employees)
    
    print("\n排班结果分析：")
    print(f"人员配置不足次数: {violations['understaff']}")
    print(f"工作日偏好违反次数: {violations['workday_pref']}")
    print(f"时间偏好违反次数: {violations['time_pref']}")
    print(f"日工时超限次数: {violations['daily_hours']}")
    print(f"周工时超限次数: {violations['weekly_hours']}")
    
    # 计算排班覆盖率
    total_shifts = len(schedule)
    total_positions_required = sum(
        sum(shift.required_positions.values())
        for shift, _ in schedule
    )
    total_positions_filled = sum(
        sum(len(workers) for workers in assignment.values())
        for _, assignment in schedule
    )
    
    coverage_rate = (total_positions_filled / total_positions_required) * 100
    print(f"\n排班覆盖率: {coverage_rate:.2f}%")
    
    # 返回分析结果
    return {
        "violations": violations,
        "total_shifts": total_shifts,
        "total_positions_required": total_positions_required,
        "total_positions_filled": total_positions_filled,
        "coverage_rate": coverage_rate
    }

def run_test(scale, sa_config=None):
    """运行指定规模的测试"""
    # 默认配置
    if sa_config is None:
        sa_config = {
            "initial_temp": 100.0,
            "min_temp": 0.1,
            "cooling_rate": 0.95,
            "iter_per_temp": 100,
            "iterations": 50,
        }
    
    # 生成测试数据
    print(f"\n{'='*50}")
    print(f"开始{scale}规模测试")
    print(f"{'='*50}")
    
    start_time = time.time()
    employees, shifts = generate_test_data(scale=scale, seed=42)  # 使用固定种子以便比较
    
    # 创建并运行调度算法
    print("开始运行排班算法...")
    scheduler = SchedulingAlgorithm(employees, shifts, sa_config=sa_config)
    schedule, best_cost, convergence_data = scheduler.simulated_annealing()
    
    # 计算运行时间
    run_time = time.time() - start_time
    print(f"算法运行时间: {run_time:.2f}秒")
    
    # 绘制收敛过程
    print("正在生成收敛过程图表...")
    plot_convergence(convergence_data, f"{scale}_convergence.png")
    
    # 分析结果
    results = analyze_results(schedule, employees)
    results.update({
        "scale": scale,
        "employee_count": len(employees),
        "shift_count": len(shifts),
        "best_cost": best_cost,
        "run_time": run_time,
        "iterations": len(convergence_data["best_costs"]),
        "final_temperature": convergence_data["temperatures"][-1],
        "convergence_rate": (convergence_data["best_costs"][0] - convergence_data["best_costs"][-1]) / convergence_data["best_costs"][0] if convergence_data["best_costs"][0] > 0 else 0
    })
    
    print(f"\n{scale}规模测试完成！")
    print(f"最终成本: {best_cost:.2f}")
    print(f"收敛过程图表已保存为 '{scale}_convergence.png'")
    
    return results

def plot_comparison(results):
    """绘制不同规模测试结果的对比图表"""
    # 提取数据
    scales = [r["scale"] for r in results]
    run_times = [r["run_time"] for r in results]
    coverage_rates = [r["coverage_rate"] for r in results]
    violation_counts = [sum(r["violations"].values()) for r in results]
    convergence_rates = [r["convergence_rate"] for r in results]
    
    # 创建图表
    plt.figure(figsize=(15, 10))
    
    # 1. 运行时间对比
    plt.subplot(2, 2, 1)
    plt.bar(scales, run_times, color='skyblue')
    plt.xlabel('测试规模')
    plt.ylabel('运行时间 (秒)')
    plt.title('不同规模下的算法运行时间')
    for i, v in enumerate(run_times):
        plt.text(i, v + 0.5, f"{v:.1f}s", ha='center')
    
    # 2. 覆盖率对比
    plt.subplot(2, 2, 2)
    plt.bar(scales, coverage_rates, color='lightgreen')
    plt.xlabel('测试规模')
    plt.ylabel('覆盖率 (%)')
    plt.title('不同规模下的排班覆盖率')
    plt.ylim(0, 105)  # 设置y轴范围，留出空间显示文本
    for i, v in enumerate(coverage_rates):
        plt.text(i, v + 2, f"{v:.1f}%", ha='center')
    
    # 3. 违规情况对比
    plt.subplot(2, 2, 3)
    violation_types = ['understaff', 'workday_pref', 'time_pref', 'daily_hours', 'weekly_hours']
    violation_labels = ['人员不足', '工作日偏好', '时间偏好', '日工时超限', '周工时超限']
    violation_data = []
    for r in results:
        violation_data.append([r["violations"][vt] for vt in violation_types])
    
    x = np.arange(len(scales))
    width = 0.15
    for i, (vtype, vlabel) in enumerate(zip(violation_types, violation_labels)):
        values = [r["violations"][vtype] for r in results]
        plt.bar(x + i*width - 0.3, values, width, label=vlabel)
    
    plt.xlabel('测试规模')
    plt.ylabel('违规次数')
    plt.title('不同规模下的违规情况')
    plt.xticks(x, scales)
    plt.legend()
    
    # 4. 收敛率对比
    plt.subplot(2, 2, 4)
    plt.bar(scales, convergence_rates, color='salmon')
    plt.xlabel('测试规模')
    plt.ylabel('收敛率')
    plt.title('不同规模下的算法收敛率')
    for i, v in enumerate(convergence_rates):
        plt.text(i, v + 0.02, f"{v:.2f}", ha='center')
    
    plt.tight_layout()
    plt.savefig('scale_comparison.png')
    plt.close()
    
    print("规模对比图表已保存为 'scale_comparison.png'")

def export_results_to_csv(results):
    """将测试结果导出为CSV文件"""
    # 准备数据
    data = []
    for r in results:
        row = {
            "规模": r["scale"],
            "员工数量": r["employee_count"],
            "班次数量": r["shift_count"],
            "运行时间(秒)": r["run_time"],
            "最终成本": r["best_cost"],
            "排班覆盖率(%)": r["coverage_rate"],
            "人员配置不足次数": r["violations"]["understaff"],
            "工作日偏好违反次数": r["violations"]["workday_pref"],
            "时间偏好违反次数": r["violations"]["time_pref"],
            "日工时超限次数": r["violations"]["daily_hours"],
            "周工时超限次数": r["violations"]["weekly_hours"],
            "迭代次数": r["iterations"],
            "最终温度": r["final_temperature"],
            "收敛率": r["convergence_rate"]
        }
        data.append(row)
    
    # 创建DataFrame并导出
    df = pd.DataFrame(data)
    df.to_csv('test_results.csv', index=False, encoding='utf-8-sig')
    print("测试结果已导出到 'test_results.csv'")

def main():
    # 配置不同规模的测试参数
    scales = ["small", "medium", "large"]
    
    # 为大规模测试调整模拟退火参数
    sa_configs = {
        "small": {
            "initial_temp": 100.0,
            "min_temp": 0.1,
            "cooling_rate": 0.95,
            "iter_per_temp": 50,
            "iterations": 30,
        },
        "medium": {
            "initial_temp": 100.0,
            "min_temp": 0.1,
            "cooling_rate": 0.95,
            "iter_per_temp": 100,
            "iterations": 50,
        },
        "large": {
            "initial_temp": 100.0,
            "min_temp": 0.1,
            "cooling_rate": 0.95,
            "iter_per_temp": 150,
            "iterations": 70,
        }
    }
    
    # 运行不同规模的测试
    all_results = []
    for scale in scales:
        results = run_test(scale, sa_configs[scale])
        all_results.append(results)
    
    # 绘制对比图表
    plot_comparison(all_results)
    
    # 导出结果到CSV
    export_results_to_csv(all_results)
    
    print("\n所有测试完成！")

if __name__ == "__main__":
    main()