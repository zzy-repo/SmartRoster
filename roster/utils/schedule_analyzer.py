import os
import csv
from utils.logger import get_logger

# 导入配置
from config.settings import DATA_DIR

# 获取logger实例
logger = get_logger(__name__)

# 辅助函数
def time_to_minutes(t):
    hours, mins = map(int, t.split(":"))
    return hours * 60 + mins


def calculate_shift_duration(shift):
    start = time_to_minutes(shift.start_time)
    end = time_to_minutes(shift.end_time)
    return (end - start) / 60


# 结果分析与输出类
class ScheduleAnalyzer:
    def __init__(self, schedule, employees):
        self.schedule = schedule
        self.employees = employees

    def print_schedule(self):
        """打印排班结果和违规统计"""
        logger.info("\n最终排班方案：")
        violation_stats = {
            "understaff": 0,
            "workday_conflict": 0,
            "time_pref_conflict": 0,
            "daily_overhours": 0,
            "weekly_overhours": 0,
        }
        # 修改数据结构，按员工和日期分别统计工时
        employee_weekly_hours = {e.name: 0 for e in self.employees}
        employee_daily_hours = {
            e.name: {day: 0 for day in range(7)} for e in self.employees
        }
        examples = []

        # 第一遍遍历：收集工时数据
        for shift, assignment in self.schedule:
            for position, workers in assignment.items():
                for employee in workers:
                    duration = calculate_shift_duration(shift)
                    employee_weekly_hours[employee.name] += duration
                    employee_daily_hours[employee.name][shift.day] += duration

        # 第二遍遍历：检测违规
        for shift, assignment in self.schedule:
            logger.info(
                f"\n班次 {shift.day+1}（周{shift.day+1}）{shift.start_time}-{shift.end_time}:"
            )

            # 检查人手不足
            for position, count in shift.required_positions.items():
                assigned = len(assignment.get(position, []))
                if assigned < count:
                    violation_stats["understaff"] += 1
                    examples.append(
                        {
                            "类型": "人手不足",
                            "描述": f"班次{shift.day+1} {position} 需要{count}人，实际{assigned}人",
                            "班次日期": f"周{shift.day+1}",
                            "班次时间": f"{shift.start_time}-{shift.end_time}",
                            "门店": shift.store,
                            "职位": position,
                            "员工": "N/A",
                        }
                    )
                    logger.warning(
                        f"  ! {position}人手不足：需要{count}人，实际{assigned}人"
                    )

            # 检查员工约束
            for position, workers in assignment.items():
                logger.info(f"  {position}: {', '.join([w.name for w in workers])}")
                for employee in workers:
                    # 工作日冲突
                    if not (
                        employee.workday_pref[0]
                        <= shift.day
                        <= employee.workday_pref[1]
                    ):
                        violation_stats["workday_conflict"] += 1
                        examples.append(
                            {
                                "类型": "工作日偏好冲突",
                                "描述": f"{employee.name} 周{shift.day+1}班次与偏好周{employee.workday_pref[0]+1}-周{employee.workday_pref[1]+1}冲突",
                                "班次日期": f"周{shift.day+1}",
                                "班次时间": f"{shift.start_time}-{shift.end_time}",
                                "门店": shift.store,
                                "职位": position,
                                "员工": employee.name,
                            }
                        )

                    # 时间偏好冲突
                    shift_start = time_to_minutes(shift.start_time)
                    shift_end = time_to_minutes(shift.end_time)
                    pref_start = time_to_minutes(employee.time_pref[0])
                    pref_end = time_to_minutes(employee.time_pref[1])
                    if shift_start < pref_start or shift_end > pref_end:
                        violation_stats["time_pref_conflict"] += 1
                        examples.append(
                            {
                                "类型": "时间偏好冲突",
                                "描述": f"{employee.name} 班次时间{shift.start_time}-{shift.end_time}超出偏好时段{employee.time_pref[0]}-{employee.time_pref[1]}",
                                "班次日期": f"周{shift.day+1}",
                                "班次时间": f"{shift.start_time}-{shift.end_time}",
                                "门店": shift.store,
                                "职位": position,
                                "员工": employee.name,
                            }
                        )

        # 检查每日时长限制
        for name, daily_hours in employee_daily_hours.items():
            employee = next(e for e in self.employees if e.name == name)
            for day, hours in daily_hours.items():
                if hours > 0:  # 只检查有排班的日期
                    if hours > employee.max_daily_hours:
                        violation_stats["daily_overhours"] += 1
                        examples.append(
                            {
                                "类型": "单日超时",
                                "描述": f"{name} 周{day+1}日工作{hours:.1f}小时（限制{employee.max_daily_hours}小时）",
                                "班次日期": f"周{day+1}",
                                "班次时间": "全天",
                                "门店": employee.store,
                                "职位": employee.position,
                                "员工": name,
                            }
                        )

        # 检查每周时长限制
        for name, hours in employee_weekly_hours.items():
            employee = next(e for e in self.employees if e.name == name)
            if hours > employee.max_weekly_hours:
                violation_stats["weekly_overhours"] += 1
                examples.append(
                    {
                        "类型": "周超时",
                        "描述": f"{name} 周总工时{hours:.1f}小时（限制{employee.max_weekly_hours}小时）",
                        "班次日期": "全周",
                        "班次时间": "N/A",
                        "门店": employee.store,
                        "职位": employee.position,
                        "员工": name,
                    }
                )

        # 输出统计结果
        logger.info("\n=== 违规统计 ===")
        logger.info(f"1. 人手不足: {violation_stats['understaff']}次")
        logger.info(f"2. 工作日冲突: {violation_stats['workday_conflict']}次")
        logger.info(f"3. 时间偏好冲突: {violation_stats['time_pref_conflict']}次")
        logger.info(f"4. 单日超时: {violation_stats['daily_overhours']}次")
        logger.info(f"5. 周超时: {violation_stats['weekly_overhours']}次")

        # 输出示例（最多5条）
        logger.info("\n=== 违规示例 ===")
        for example in examples[:5]:
            logger.warning(f"· {example['描述']}")
        if len(examples) > 5:
            logger.info(f"（共{len(examples)}条违规记录，仅显示前5条示例）")

        # 导出违规记录到CSV
        self.export_violations(examples)

        # 导出违规统计到CSV
        self.export_violation_stats(violation_stats)

        return examples

    def export_violations(self, violations):
        """导出违规记录到CSV文件"""
        violations_path = os.path.join(DATA_DIR, "violations.csv")
        with open(violations_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["违规类型", "描述", "班次日期", "班次时间", "门店", "职位", "员工"]
            )
            for v in violations:
                writer.writerow(
                    [
                        v["类型"],
                        v["描述"],
                        v["班次日期"],
                        v["班次时间"],
                        v["门店"],
                        v["职位"],
                        v["员工"],
                    ]
                )

        logger.info(f"违规记录已导出至 {violations_path}")

    def export_violation_stats(self, violation_stats):
        """导出违规统计到CSV文件"""
        stats_path = os.path.join(DATA_DIR, "violation_stats.csv")
        with open(stats_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["违规类型", "次数"])
            writer.writerow(["人手不足", violation_stats["understaff"]])
            writer.writerow(["工作日偏好冲突", violation_stats["workday_conflict"]])
            writer.writerow(["时间偏好冲突", violation_stats["time_pref_conflict"]])
            writer.writerow(["单日超时", violation_stats["daily_overhours"]])
            writer.writerow(["周超时", violation_stats["weekly_overhours"]])
            writer.writerow(["总计", sum(violation_stats.values())])

        logger.info(f"违规统计已导出至 {stats_path}")