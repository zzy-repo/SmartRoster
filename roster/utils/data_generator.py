import random
import logging

# 导入从model文件夹中提取的数据结构
from model.entities import Employee, Shift

logger = logging.getLogger(__name__)

class DataGenerator:
    @staticmethod
    def generate_employees(stores, positions):
        """生成员工数据"""
        employees = []
        for store in stores:
            for position, count in positions.items():
                for i in range(count):
                    # 生成员工基础信息
                    name = f"{store[:2]}员工{position}{i+1}"
                    phone = f"138{random.randint(1000,9999)}{random.randint(1000,9999)}"
                    email = f"{name}@store.com".replace("（", "").replace("）", "")

                    # 生成排班参数（模拟现实场景）
                    workday_pref = random.choices([(0, 6), (0, 4), (5, 6)], weights=[6, 3, 1])[0]

                    time_pref_options = [
                        ("06:00", "14:00"),  # 早班
                        ("14:00", "22:00"),  # 晚班
                        ("10:00", "18:00"),  # 中班
                        ("00:00", "23:59"),  # 任意时间
                    ]
                    time_pref = random.choices(time_pref_options, weights=[3, 3, 2, 2])[0]

                    constraints = {}
                    if random.random() < 0.3:  # 30%员工有工时限制
                        if random.random() < 0.5:
                            constraints["max_daily_hours"] = random.choice([6, 8, 10])
                        else:
                            constraints["max_weekly_hours"] = random.choice([20, 30, 40])

                    employees.append(
                        Employee(
                            name=name,
                            position=position,
                            phone=phone,
                            email=email,
                            store=store,
                            workday_pref=workday_pref,
                            time_pref=time_pref,
                            **constraints,
                        )
                    )
        return employees

    @staticmethod
    def generate_shifts(stores):
        """生成班次数据"""
        shifts = [
            # 旗舰店常规班次
            Shift(0, "08:00", "12:00", {"门店经理": 1, "副经理": 1, "店员（导购）": 6}, "旗舰店"),
            Shift(0, "12:00", "18:00", {"副经理": 1, "店员（收银）": 4, "店员（导购）": 8}, "旗舰店"),
            Shift(0, "18:00", "22:00", {"小组长": 2, "店员（收银）": 3, "店员（库房）": 4}, "旗舰店"),
            # 分店A特殊班次
            Shift(5, "09:00", "21:00", {"门店经理": 1, "店员（收银）": 5, "店员（导购）": 10}, "分店A"),
            Shift(6, "06:00", "18:00", {"小组长": 2, "店员（库房）": 5}, "分店A"),
            # 分店B夜间班次
            Shift(4, "22:00", "06:00", {"副经理": 1, "店员（库房）": 4}, "分店B"),
            # 全门店通用
            *[
                Shift(d, "10:00", "22:00", {"店员（导购）": 8}, store)
                for d in [5, 6]
                for store in stores
            ],  # 周末高峰班次
            # 特殊节假日班次
            Shift(0, "00:00", "24:00", {"副经理": 2, "店员（收银）": 4, "店员（导购）": 12}, "旗舰店"),
            Shift(0, "04:00", "08:00", {"店员（库房）": 3}, "分店A"),
            Shift(5, "16:00", "02:00", {"小组长": 1, "店员（导购）": 6}, "分店B"),
        ]
        return shifts