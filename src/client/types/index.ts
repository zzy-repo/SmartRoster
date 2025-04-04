// 门店类型定义
export interface Store {
  id: string
  name: string
  address: string
  area: number // 工作场所面积（平方米）
  createdAt?: string
  updatedAt?: string
}

// 员工类型定义
export interface Employee {
  id: string
  name: string
  position: string // 职位：门店经理，副经理，小组长，店员（收银，导购，库房）
  phone: string
  email: string
  store: string // 所属门店ID
  preferences: EmployeePreference
  createdAt?: string
  updatedAt?: string
}

// 员工偏好设置
export interface EmployeePreference {
  workday_pref: [number, number] // 工作日偏好，如 [1, 5] 表示周二到周六
  time_pref: [string, string] // 工作时间偏好，如 ['08:00', '18:00']
  max_daily_hours: number // 每天最大工作时长
  max_weekly_hours: number // 每周最大工作时长
}

// 班次需求定义
export interface Shift {
  id: string
  day: number // 0-6 表示周一到周日
  date: string // YYYY-MM-DD 格式
  start_time: string // HH:MM 格式
  end_time: string // HH:MM 格式
  required_positions: Record<string, number> // 岗位需求，如 { '收银员': 2, '导购': 3 }
  store: string // 所属门店ID
  createdAt?: string
  updatedAt?: string
}

// 排班表中的班次定义（包含分配信息）
export interface ScheduleShift extends Shift {
  assignments: Record<string, EmployeeAssignment[]> // 岗位分配情况
}

// 员工分配信息
export interface EmployeeAssignment {
  id: string
  name: string
  position: string
  store: string
}

// 排班表定义
export interface Schedule {
  id: string
  start_date: string // YYYY-MM-DD 格式
  end_date: string // YYYY-MM-DD 格式
  store: string // 所属门店ID
  shifts: ScheduleShift[] // 排班表中的班次
  cost_detail?: CostDetail // 成本详情
  createdAt?: string
  updatedAt?: string
}

// 成本详情
export interface CostDetail {
  total_cost: number
  understaff_penalty: number
  workday_violations: number
  time_pref_violations: number
  daily_hours_exceeded: number
  weekly_hours_exceeded: number
}

// 排班规则
export interface ScheduleRule {
  id: string
  name: string
  store: string // 所属门店ID
  min_rest_hours: number // 两个班次之间的最小休息时间
  max_consecutive_days: number // 最大连续工作天数
  cost_params: {
    understaff_penalty: number
    workday_violation: number
    time_pref_violation: number
    daily_hours_violation: number
    weekly_hours_violation: number
  }
  createdAt?: string
  updatedAt?: string
}

// 业务预测数据
export interface BusinessForecast {
  id: string
  store: string // 所属门店ID
  date: string // YYYY-MM-DD 格式
  hourly_data: {
    hour: number // 0-23 表示一天中的小时
    customer_count: number // 预计客流量
    sales_amount: number // 预计销售额
  }[]
  createdAt?: string
  updatedAt?: string
}
