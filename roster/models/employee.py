class Employee:
    def __init__(
        self,
        name,
        position,
        phone,
        email,
        store,
        workday_pref=(0, 6),  # 周一(0)到周日(6)
        time_pref=("00:00", "23:59"),
        max_daily_hours=24,
        max_weekly_hours=168,
    ):
        self.name = name
        self.position = position
        self.phone = phone
        self.email = email
        self.store = store
        self.workday_pref = workday_pref
        self.time_pref = time_pref
        self.max_daily_hours = max_daily_hours
        self.max_weekly_hours = max_weekly_hours