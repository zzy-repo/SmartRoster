import random
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from scheduler import Employee, Shift, SchedulingAlgorithm

def generate_test_data():
    """生成测试数据"""
    # 门店配置
    stores = ["Store_A", "Store_B", "Store_C"]
    positions = ["Manager", "Cashier", "Sales"]
    
    # 生成员工数据
    employees = []
    for i in range(30):
        # 随机分配门店和职位
        store = random.choice(stores)
        position = random.choice(positions)
        
        # 随机生成工作日偏好（确保至少工作3天）
        start_day = random.randint(0, 4)
        end_day = random.randint(start_day + 2, 6)
        
        # 随机生成时间偏好（确保至少工作6小时）
        start_hour = random.randint(8, 12)
        end_hour = random.randint(start_hour + 6, 20)
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
            # 早班和晚班
            shift_times = [
                ("09:00", "17:00"),  # 早班
                ("13:00", "21:00")   # 晚班
            ]
            
            for start_time, end_time in shift_times:
                # 每个班次的人员需求
                required_positions = {
                    "Manager": 1,
                    "Cashier": random.randint(1, 2),
                    "Sales": random.randint(2, 3)
                }
                
                shift = Shift(
                    day=day,
                    start_time=start_time,
                    end_time=end_time,
                    required_positions=required_positions,
                    store=store
                )
                shifts.append(shift)
    
    return employees, shifts

def plot_convergence(convergence_data):
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
    plt.savefig('convergence.png')
    plt.close()

def analyze_results(schedule, employees):
    """分析排班结果"""
    from scheduler import analyze_violations
    
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

def main():
    # 生成测试数据
    print("正在生成测试数据...")
    employees, shifts = generate_test_data()
    
    # 配置算法参数
    sa_config = {
        "initial_temp": 100.0,
        "min_temp": 0.1,
        "cooling_rate": 0.95,
        "iter_per_temp": 100,
        "iterations": 50,
    }
    
    # 创建并运行调度算法
    print("开始运行排班算法...")
    scheduler = SchedulingAlgorithm(employees, shifts, sa_config=sa_config)
    schedule, best_cost, convergence_data = scheduler.simulated_annealing()
    
    # 绘制收敛过程
    print("正在生成收敛过程图表...")
    plot_convergence(convergence_data)
    
    # 分析结果
    analyze_results(schedule, employees)
    
    print("\n算法运行完成！")
    print(f"最终成本: {best_cost:.2f}")
    print("收敛过程图表已保存为 'convergence.png'")

if __name__ == "__main__":
    main()