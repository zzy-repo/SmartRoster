import os
import matplotlib.pyplot as plt
from utils.logger import get_logger

# 获取logger实例
logger = get_logger(__name__)

def visualize_convergence(temperatures, current_costs, best_costs, output_dir):
    """
    可视化算法收敛过程
    
    Args:
        temperatures: 温度列表
        current_costs: 当前成本列表
        best_costs: 最佳成本列表
        output_dir: 输出目录
    """
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
    (line2,) = ax1.plot(
        range(len(temperatures)), best_costs, "r-", label="最佳成本"
    )

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
    plt_path = os.path.join(output_dir, "convergence_plot.png")
    plt.savefig(plt_path)
    logger.info(f"收敛图表已保存至 {plt_path}")
    
    # 关闭图表，释放资源
    plt.close()