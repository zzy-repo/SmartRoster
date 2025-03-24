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
from config.settings import DATA_DIR, SA_CONFIG, COST_PARAMS

# 导入数据生成器
from utils.data_generator import DataGenerator

# 导入日志配置
from utils.logger import get_logger

# 导入算法模块
from algorithms.simulated_annealing import SchedulingAlgorithm
from utils.schedule_analyzer import ScheduleAnalyzer
from utils.data_exporter import DataExporter

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
    analyzer.print_schedule()  # 现在会自动导出违规记录

    # 导出排班结果
    DataExporter.export_schedule(best_schedule)