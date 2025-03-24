from models.employee import Employee
from models.shift import Shift

# 测试数据
stores = ["旗舰店", "分店A", "分店B"]
positions = ["门店经理", "副经理", "小组长", "店员（收银）", "店员（导购）", "店员（库房）"]

# 创建20名员工
employees = [
    # 旗舰店员工
    Employee("张伟", "门店经理", "13800010001", "zhang@store.com", "旗舰店",
             workday_pref=(0, 4), time_pref=('09:00', '18:00'), max_daily_hours=10),
    Employee("王芳", "副经理", "13800010002", "wang@store.com", "旗舰店",
             workday_pref=(0, 6), time_pref=('12:00', '21:00'), max_weekly_hours=50),
    Employee("李强", "店员（收银）", "13800010003", "li@store.com", "旗舰店",
             workday_pref=(4, 6), time_pref=('16:00', '23:00'), max_daily_hours=6),
    Employee("赵敏", "店员（导购）", "13800010004", "zhao@store.com", "旗舰店",
             workday_pref=(0, 3), time_pref=('08:00', '17:00'), max_weekly_hours=30),
    Employee("周杰", "店员（库房）", "13800010005", "zhou@store.com", "旗舰店",
             workday_pref=(0, 6), time_pref=('06:00', '14:00'), max_daily_hours=8),

    # 分店A员工
    Employee("陈婷", "门店经理", "13800020001", "chen@store.com", "分店A",
             workday_pref=(5, 6), time_pref=('10:00', '20:00'), max_weekly_hours=45),
    Employee("刘洋", "副经理", "13800020002", "liu@store.com", "分店A",
             workday_pref=(0, 4), time_pref=('07:00', '15:00')),
    Employee("徐璐", "小组长", "13800020003", "xu@store.com", "分店A",
             workday_pref=(2, 4), time_pref=('13:00', '21:00'), max_daily_hours=9),
    Employee("孙浩", "店员（收银）", "13800020004", "sun@store.com", "分店A",
             workday_pref=(0, 6), time_pref=('00:00', '23:59'), max_weekly_hours=40),
    Employee("吴倩", "店员（导购）", "13800020005", "wu@store.com", "分店A",
             workday_pref=(1, 5), time_pref=('09:30', '18:30'), max_daily_hours=7),

    # 分店B员工
    Employee("郑凯", "门店经理", "13800030001", "zheng@store.com", "分店B",
             workday_pref=(3, 5), time_pref=('11:00', '23:00'), max_weekly_hours=55),
    Employee("林娜", "副经理", "13800030002", "lin@store.com", "分店B",
             workday_pref=(0, 2), time_pref=('06:00', '12:00')),
    Employee("罗毅", "小组长", "13800030003", "luo@store.com", "分店B",
             workday_pref=(0, 6), time_pref=('08:00', '20:00'), max_daily_hours=10),
    Employee("唐薇", "店员（收银）", "13800030004", "tang@store.com", "分店B",
             workday_pref=(4, 6), time_pref=('14:00', '22:00')),
    Employee("韩磊", "店员（库房）", "13800030005", "han@store.com", "分店B",
             workday_pref=(0, 3), time_pref=('04:00', '12:00'), max_weekly_hours=35),

    # 跨店支援员工
    Employee("欧阳雪", "店员（导购）", "13800040001", "ouyang@store.com", "分店A",
             workday_pref=(0, 6), time_pref=('10:00', '22:00'), max_weekly_hours=60),
    Employee("慕容云", "店员（收银）", "13800040002", "murong@store.com", "旗舰店",
             workday_pref=(0, 4), time_pref=('07:30', '16:30')),
    Employee("诸葛明", "副经理", "13800040003", "zhuge@store.com", "分店B",
             workday_pref=(5, 6), time_pref=('18:00', '24:00'), max_daily_hours=8),
    Employee("司马燕", "店员（导购）", "13800040004", "sima@store.com", "旗舰店",
             workday_pref=(0, 6), time_pref=('00:00', '23:59')),
]

# 创建复杂班次需求
shifts = [
    # 旗舰店班次
    Shift(0, "08:00", "12:00", {"门店经理":1, "店员（导购）":2}),
    Shift(0, "12:00", "18:00", {"副经理":1, "店员（收银）":2, "店员（导购）":3}),
    Shift(0, "18:00", "22:00", {"小组长":1, "店员（收银）":1, "店员（库房）":2}),
    Shift(5, "09:00", "21:00", {"门店经理":1, "副经理":1, "店员（收银）":4, "店员（导购）":5}),

    # 分店A班次
    Shift(2, "06:00", "12:00", {"店员（库房）":3}),
    Shift(3, "12:00", "24:00", {"副经理":1, "店员（收银）":3, "店员（导购）":4}),
    Shift(6, "10:00", "22:00", {"门店经理":1, "小组长":2, "店员（导购）":6}),

    # 分店B班次
    Shift(4, "22:00", "06:00", {"副经理":1, "店员（库房）":3}),  # 跨天班次
    Shift(5, "08:00", "20:00", {"门店经理":1, "店员（收银）":3, "店员（导购）":3}),
    Shift(6, "09:00", "18:00", {"小组长":1, "店员（导购）":4}),

    # 特殊班次
    Shift(0, "00:00", "24:00", {"副经理":2, "店员（收银）":2}),  # 全天候班次
    Shift(3, "04:00", "08:00", {"店员（库房）":2}),  # 凌晨班次
    Shift(5, "16:00", "02:00", {"门店经理":1, "店员（导购）":5}),  # 跨午夜班次
]