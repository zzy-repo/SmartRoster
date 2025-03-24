import os
import csv
from utils.logger import get_logger

# 导入配置
from config.settings import DATA_DIR

# 获取logger实例
logger = get_logger(__name__)

# 数据导出类
class DataExporter:
    @staticmethod
    def export_input_data(employees, shifts):
        """导出输入数据到CSV文件"""
        # 确保数据目录存在
        os.makedirs(DATA_DIR, exist_ok=True)

        # 导出员工数据
        employee_path = os.path.join(DATA_DIR, "employees.csv")
        with open(employee_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "姓名",
                    "职位",
                    "门店",
                    "工作日偏好",
                    "时间偏好",
                    "最大日工时",
                    "最大周工时",
                ]
            )
            for e in employees:
                writer.writerow(
                    [
                        e.name,
                        e.position,
                        e.store,
                        f"周{e.workday_pref[0]+1}-周{e.workday_pref[1]+1}",
                        f"{e.time_pref[0]}-{e.time_pref[1]}",
                        e.max_daily_hours,
                        e.max_weekly_hours,
                    ]
                )

        # 导出班次需求
        shift_path = os.path.join(DATA_DIR, "shifts.csv")
        with open(shift_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["周几", "开始时间", "结束时间", "门店", "职位需求"])
            for s in shifts:
                writer.writerow(
                    [
                        s.day + 1,
                        s.start_time,
                        s.end_time,
                        s.store,
                        str(s.required_positions),
                    ]
                )

        logger.info(f"输入数据已导出至 {employee_path} 和 {shift_path}")

    @staticmethod
    def export_schedule(schedule):
        """导出排班结果到CSV文件"""
        # 确保数据目录存在
        os.makedirs(DATA_DIR, exist_ok=True)

        # 导出排班结果
        schedule_path = os.path.join(DATA_DIR, "schedule.csv")
        with open(schedule_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["周几", "开始时间", "结束时间", "门店", "职位", "分配员工"]
            )
            for shift, assignment in schedule:
                for position, workers in assignment.items():
                    writer.writerow(
                        [
                            shift.day + 1,
                            shift.start_time,
                            shift.end_time,
                            shift.store,
                            position,
                            "、".join([w.name for w in workers]),
                        ]
                    )

        logger.info(f"排班结果已导出至 {schedule_path}")