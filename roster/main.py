from utils.logger import logger
from data.test_data import employees, shifts
from algorithm.simulated_annealing import simulated_annealing

def print_schedule(schedule):
    logger.info("\n最终排班方案：")
    total_violations = 0
    for shift, assignment in schedule:
        logger.info(
            f"\n班次 {shift.day+1}（周{shift.day+1}）{shift.start_time}-{shift.end_time}:"
        )
        for position, workers in assignment.items():
            logger.info(f"  {position}: {', '.join([w.name for w in workers])}")
            required = shift.required_positions.get(position, 0)
            if len(workers) < required:
                logger.warning(f"   ! 人手不足：需要{required}人，实际{len(workers)}人")
                total_violations += 1
    logger.info(f"\n总违规数：{total_violations}")

if __name__ == "__main__":
    # 运行算法
    best_schedule, cost = simulated_annealing(employees, shifts)

    # 输出结果
    print_schedule(best_schedule)