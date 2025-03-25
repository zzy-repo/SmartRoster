# 排班系统配置文件

import os

# 常量配置
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "roster", "data")

# 模拟退火算法参数
SA_CONFIG = {
    "initial_temp": 100.0,
    "min_temp": 0.1,
    "cooling_rate": 0.95,
    "iter_per_temp": 100,  # 添加这个键
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