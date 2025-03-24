import logging

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# 获取logger实例的函数
def get_logger(name):
    return logging.getLogger(name)