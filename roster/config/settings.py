import os

# 常量配置
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "roster", "data")

# 模拟退火算法参数
SA_CONFIG = {
    "initial_temp": 100.0,
    "min_temp": 0.1,
    "cooling_rate": 0.95,
    "iter_per_temp": 100,
    "iterations": 50,
}