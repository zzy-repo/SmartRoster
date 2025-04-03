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


# 违规检测模块
class ViolationDetector:
    def __init__(self, schedule, employees):
        self.schedule = schedule
        self.employees = employees
        self.employee_weekly_hours = {}
        self.employee_daily_hours = {}
        self.violation_stats = {
            "understaff": 0,
            "workday_conflict": 0,
            "time_pref_conflict": 0,
            "daily_overhours": 0,
            "weekly_overhours": 0,
        }
        self.violation_examples = []
        
    def initialize_hour_tracking(self):
        """初始化工时跟踪数据结构"""
        self.employee_weekly_hours = {e.name: 0 for e in self.employees}
        self.employee_daily_hours = {
            e.name: {day: 0 for day in range(7)} for e in self.employees
        }
    
    def collect_working_hours(self):
        """收集员工工时数据"""
        for shift, assignment in self.schedule:
            for position, workers in assignment.items():
                for employee in workers:
                    duration = calculate_shift_duration(shift)
                    self.employee_weekly_hours[employee.name] += duration
                    self.employee_daily_hours[employee.name][shift.day] += duration
    
    def detect_violations(self):
        """检测所有违规情况"""
        # 检测班次相关违规
        self._check_shift_violations()
        
        # 检测每日时长限制
        self._check_daily_hour_limits()
        
        # 检测每周时长限制
        self._check_weekly_hour_limits()
        
        return self.violation_stats, self.violation_examples
    
    def _check_shift_violations(self):
        """检测与班次相关的违规"""
        for shift, assignment in self.schedule:
            # 移除班次信息的输出
            # 检查人手不足
            self._check_understaffing(shift, assignment)
            
            # 检查员工约束
            self._check_employee_constraints(shift, assignment)
    
    def _check_understaffing(self, shift, assignment):
        """检查人手不足情况"""
        for position, count in shift.required_positions.items():
            assigned = len(assignment.get(position, []))
            if assigned < count:
                self.violation_stats["understaff"] += 1
                self.violation_examples.append(
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
    
    def _check_employee_constraints(self, shift, assignment):
        """检查员工约束违规"""
        for position, workers in assignment.items():
            # 移除员工分配信息的输出
            for employee in workers:
                # 工作日冲突
                self._check_workday_conflict(employee, shift, position)
                
                # 时间偏好冲突
                self._check_time_preference_conflict(employee, shift, position)
    
    def _check_workday_conflict(self, employee, shift, position):
        """检查工作日偏好冲突"""
        if not (employee.workday_pref[0] <= shift.day <= employee.workday_pref[1]):
            self.violation_stats["workday_conflict"] += 1
            self.violation_examples.append(
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
    
    def _check_time_preference_conflict(self, employee, shift, position):
        """检查时间偏好冲突"""
        shift_start = time_to_minutes(shift.start_time)
        shift_end = time_to_minutes(shift.end_time)
        pref_start = time_to_minutes(employee.time_pref[0])
        pref_end = time_to_minutes(employee.time_pref[1])
        
        if shift_start < pref_start or shift_end > pref_end:
            self.violation_stats["time_pref_conflict"] += 1
            self.violation_examples.append(
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
    
    def _check_daily_hour_limits(self):
        """检查每日工时限制"""
        for name, daily_hours in self.employee_daily_hours.items():
            employee = next(e for e in self.employees if e.name == name)
            for day, hours in daily_hours.items():
                if hours > 0 and hours > employee.max_daily_hours:  # 只检查有排班的日期
                    self.violation_stats["daily_overhours"] += 1
                    self.violation_examples.append(
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
    
    def _check_weekly_hour_limits(self):
        """检查每周工时限制"""
        for name, hours in self.employee_weekly_hours.items():
            employee = next(e for e in self.employees if e.name == name)
            if hours > employee.max_weekly_hours:
                self.violation_stats["weekly_overhours"] += 1
                self.violation_examples.append(
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


# 数据导出模块
class DataExporter:
    @staticmethod
    def export_violations(violations):
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

    @staticmethod
    def export_violation_stats(violation_stats):
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


# 结果分析与输出类
class ScheduleAnalyzer:
    def __init__(self, schedule, employees):
        self.schedule = schedule
        self.employees = employees
        self.detector = ViolationDetector(schedule, employees)
        self.exporter = DataExporter()

    def print_schedule(self):
        """打印排班结果和违规统计"""
        # 初始化数据结构
        self.detector.initialize_hour_tracking()
        
        # 收集工时数据
        self.detector.collect_working_hours()
        
        # 检测违规
        violation_stats, violation_examples = self.detector.detect_violations()
        
        # 导出违规记录到CSV
        self.exporter.export_violations(violation_examples)
        
        # 导出违规统计到CSV
        self.exporter.export_violation_stats(violation_stats)
        
        return violation_examples