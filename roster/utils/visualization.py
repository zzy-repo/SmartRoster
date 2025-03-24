import matplotlib.pyplot as plt
import numpy as np
import os
import csv
from collections import defaultdict
import pandas as pd
from config.settings import DATA_DIR
from utils.logger import get_logger

# 获取logger实例
logger = get_logger(__name__)

# 设置中文字体
plt.rcParams["font.family"] = "Microsoft YaHei"  # 设置中文字体
plt.rcParams["axes.unicode_minus"] = False  # 解决负号显示问题

def plot_convergence_from_csv():
    """从CSV文件读取并绘制算法收敛过程图表"""
    # 读取收敛数据
    convergence_path = os.path.join(DATA_DIR, "convergence_data.csv")
    
    if not os.path.exists(convergence_path):
        logger.error(f"收敛数据文件不存在: {convergence_path}")
        return
    
    # 从CSV读取数据
    iterations = []
    temperatures = []
    current_costs = []
    best_costs = []
    
    with open(convergence_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # 跳过表头
        for row in reader:
            iterations.append(int(row[0]))
            temperatures.append(float(row[1]))
            current_costs.append(float(row[2]))
            best_costs.append(float(row[3]))
    
    # 绘制图表
    plt.figure(figsize=(12, 6))

    # 创建双Y轴
    ax1 = plt.gca()
    ax2 = ax1.twinx()

    # 绘制成本曲线
    (line1,) = ax1.plot(iterations, current_costs, "b-", label="当前成本", alpha=0.5)
    (line2,) = ax1.plot(iterations, best_costs, "r-", label="最佳成本")

    # 绘制温度曲线（对数坐标）
    (line3,) = ax2.plot(iterations, temperatures, "g--", label="温度")
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
    plt.savefig(os.path.join(DATA_DIR, "convergence_plot.png"))
    plt.close()
    logger.info("收敛图表已保存至 data/convergence_plot.png")
    
    # 分析收敛数据
    analyze_convergence_data(iterations, temperatures, current_costs, best_costs)

def analyze_convergence_data(iterations, temperatures, current_costs, best_costs):
    """分析收敛数据并输出统计信息"""
    # 计算收敛速度
    best_cost_final = best_costs[-1]
    convergence_threshold = best_cost_final * 1.05  # 假设成本在最终值的5%以内算作收敛
    
    # 找到首次达到收敛阈值的迭代次数
    convergence_iteration = None
    for i, cost in enumerate(best_costs):
        if cost <= convergence_threshold:
            convergence_iteration = iterations[i]
            break
    
    # 计算成本下降率
    initial_cost = best_costs[0]
    cost_reduction = (initial_cost - best_cost_final) / initial_cost * 100
    
    # 输出分析结果
    logger.info("===== 算法收敛分析 =====")
    logger.info(f"初始成本: {initial_cost:.2f}")
    logger.info(f"最终成本: {best_cost_final:.2f}")
    logger.info(f"成本下降率: {cost_reduction:.2f}%")
    
    if convergence_iteration:
        logger.info(f"收敛迭代次数: {convergence_iteration}")
        logger.info(f"总迭代次数: {iterations[-1]}")
        logger.info(f"收敛效率: {convergence_iteration/iterations[-1]*100:.2f}%")
    else:
        logger.info("算法未达到收敛阈值")
    
    # 导出分析结果
    analysis_path = os.path.join(DATA_DIR, "convergence_analysis.csv")
    with open(analysis_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["指标", "值"])
        writer.writerow(["初始成本", f"{initial_cost:.2f}"])
        writer.writerow(["最终成本", f"{best_cost_final:.2f}"])
        writer.writerow(["成本下降率", f"{cost_reduction:.2f}%"])
        if convergence_iteration:
            writer.writerow(["收敛迭代次数", convergence_iteration])
            writer.writerow(["总迭代次数", iterations[-1]])
            writer.writerow(["收敛效率", f"{convergence_iteration/iterations[-1]*100:.2f}%"])
        else:
            writer.writerow(["收敛状态", "未收敛"])
    
    logger.info(f"收敛分析结果已保存至 {analysis_path}")

def plot_violations(violation_stats):
    """绘制违规统计图表"""
    # 提取数据
    categories = [
        "人手不足", 
        "工作日偏好冲突", 
        "时间偏好冲突", 
        "单日超时", 
        "周超时"
    ]
    values = [
        violation_stats["understaff"],
        violation_stats["workday_conflict"],
        violation_stats["time_pref_conflict"],
        violation_stats["daily_overhours"],
        violation_stats["weekly_overhours"]
    ]
    
    # 创建柱状图
    plt.figure(figsize=(10, 6))
    bars = plt.bar(categories, values, color=['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#c2c2f0'])
    
    # 添加数值标签
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                 f'{height}', ha='center', va='bottom')
    
    # 设置图表属性
    plt.title("排班违规统计")
    plt.xlabel("违规类型")
    plt.ylabel("违规次数")
    plt.xticks(rotation=15)
    plt.tight_layout()
    
    # 保存图表
    plt.savefig(os.path.join(DATA_DIR, "violations_chart.png"))
    plt.close()
    logger.info("违规统计图表已保存至 data/violations_chart.png")

def plot_workload_distribution(employee_hours):
    """绘制员工工时分布图表"""
    # 按门店分组
    store_hours = defaultdict(list)
    for name, hours in employee_hours.items():
        # 从员工名称中提取门店信息
        if name.startswith("旗舰"):
            store = "旗舰店"
        elif name.startswith("分店A"):
            store = "分店A"
        elif name.startswith("分店B"):
            store = "分店B"
        else:
            store = "其他"
        store_hours[store].append(hours)
    
    # 创建箱线图
    plt.figure(figsize=(10, 6))
    
    # 准备数据
    data = [store_hours[store] for store in ["旗舰店", "分店A", "分店B"] if store in store_hours]
    labels = [store for store in ["旗舰店", "分店A", "分店B"] if store in store_hours]
    
    # 绘制箱线图
    box = plt.boxplot(data, labels=labels, patch_artist=True)
    
    # 设置颜色
    colors = ['#ff9999', '#66b3ff', '#99ff99']
    for patch, color in zip(box['boxes'], colors):
        patch.set_facecolor(color)
    
    # 设置图表属性
    plt.title("各门店员工周工时分布")
    plt.xlabel("门店")
    plt.ylabel("周工时(小时)")
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # 保存图表
    plt.savefig(os.path.join(DATA_DIR, "workload_distribution.png"))
    plt.close()
    logger.info("工时分布图表已保存至 data/workload_distribution.png")

def plot_coverage_analysis(schedule, shifts):
    """绘制班次覆盖率分析图表"""
    # 初始化数据结构
    days = list(range(7))
    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    stores = ["旗舰店", "分店A", "分店B"]
    
    # 创建需求和实际分配的矩阵
    required = np.zeros((len(stores), len(days)))
    assigned = np.zeros((len(stores), len(days)))
    
    # 统计需求人数
    for shift in shifts:
        store_idx = stores.index(shift.store)
        day_idx = shift.day
        required[store_idx, day_idx] += sum(shift.required_positions.values())
    
    # 统计实际分配人数
    for shift, assignment in schedule:
        store_idx = stores.index(shift.store)
        day_idx = shift.day
        assigned[store_idx, day_idx] += sum(len(workers) for workers in assignment.values())
    
    # 计算覆盖率
    coverage = np.zeros((len(stores), len(days)))
    for i in range(len(stores)):
        for j in range(len(days)):
            if required[i, j] > 0:
                coverage[i, j] = min(assigned[i, j] / required[i, j], 1.0) * 100
            else:
                coverage[i, j] = 100  # 如果没有需求，则覆盖率为100%
    
    # 创建热力图
    plt.figure(figsize=(12, 8))
    
    # 创建DataFrame以便使用seaborn
    df = pd.DataFrame(coverage, index=stores, columns=day_names)
    
    # 绘制热力图
    ax = plt.gca()
    im = ax.imshow(coverage, cmap='RdYlGn')
    
    # 设置坐标轴
    ax.set_xticks(np.arange(len(days)))
    ax.set_yticks(np.arange(len(stores)))
    ax.set_xticklabels(day_names)
    ax.set_yticklabels(stores)
    
    # 旋转x轴标签
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    
    # 添加数值标签
    for i in range(len(stores)):
        for j in range(len(days)):
            text = ax.text(j, i, f"{coverage[i, j]:.1f}%",
                          ha="center", va="center", color="black")
    
    # 添加颜色条
    cbar = plt.colorbar(im)
    cbar.set_label('覆盖率 (%)')
    
    # 设置图表属性
    plt.title("各门店每日人员需求覆盖率")
    plt.tight_layout()
    
    # 保存图表
    plt.savefig(os.path.join(DATA_DIR, "coverage_analysis.png"))
    plt.close()
    logger.info("覆盖率分析图表已保存至 data/coverage_analysis.png")