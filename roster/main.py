import random
import math
import copy
from datetime import datetime
import matplotlib.pyplot as plt
import csv
import os

# 导入从model文件夹中提取的数据结构
from model.entities import Employee, Shift

# 导入配置
from config.settings import DATA_DIR, SA_CONFIG

# 导入数据IO模块
from utils.data_io import DataGenerator, DataExporter

# 导入日志配置
from utils.logger import get_logger

# 导入算法模块
from algorithms.simulated_annealing import SchedulingAlgorithm
from utils.schedule_analyzer import ScheduleAnalyzer

# 导入可视化模块
from utils.visualization import plot_violations, plot_workload_distribution, plot_coverage_analysis, plot_convergence_from_csv

# 获取logger实例
logger = get_logger(__name__)

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

    # 新增成本参数配置
    COST_PARAMS = {
        "understaff_penalty": 100,
        "workday_violation": 10,
        "time_pref_violation": 5,
        "daily_hours_violation": 20,
        "weekly_hours_violation": 50,
    }

    # 生成测试数据
    employees = DataGenerator.generate_employees(stores, positions)
    shifts = DataGenerator.generate_shifts(stores)

    # 导出输入数据
    DataExporter.export_input_data(employees, shifts)

    # 运行排班算法
    scheduler = SchedulingAlgorithm(
        employees, 
        shifts,
        sa_config=SA_CONFIG,
        cost_params=COST_PARAMS  # 新增显式传递成本参数
    )
    best_schedule, cost, convergence_data = scheduler.simulated_annealing()

    # 导出收敛数据
    DataExporter.export_convergence_data(convergence_data)

    # 分析并输出结果
    analyzer = ScheduleAnalyzer(best_schedule, employees)
    violations = analyzer.print_schedule()

    # 导出排班结果
    DataExporter.export_schedule(best_schedule)
    
    # 从CSV文件读取收敛数据并分析
    plot_convergence_from_csv()
    
    # 可视化违规统计
    plot_violations(analyzer.detector.violation_stats)
    
    # 可视化员工工时分布
    plot_workload_distribution(analyzer.detector.employee_weekly_hours)
    
    # 可视化班次覆盖率分析
    plot_coverage_analysis(best_schedule, shifts)
    
    logger.info("排班分析与可视化完成，结果已保存至数据目录")