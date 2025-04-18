// 班次需求定义
export interface Shift {
  id: number
  day: number // 0-6 表示周一到周日
  start_time: string // TIME类型 HH:MM
  end_time: string // TIME类型 HH:MM
  status: 'open' | 'closed'
  store_id: number // 所属门店ID
  positions: ShiftPosition[]
  created_at: string
  updated_at: string
}

export interface ShiftPosition {
  id: number
  position: string
  count: number
  shift_id: number
}

export interface ShiftAssignment {
  id: number
  position: string
  override_reason?: string
  schedule_id: number
  shift_id: number
  employee_id: number
  assigned_by?: number
  assigned_at: string
}

// 排班表中的班次定义（包含分配信息）
export interface ScheduleShift extends Omit<Shift, 'positions'> {
  assignments: Record<string, ShiftAssignment[]> // 岗位分配情况
  positions: ShiftPosition[]
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
  id: number
  start_date: string // YYYY-MM-DD 格式
  end_date: string // YYYY-MM-DD 格式
  store_id: number // 所属门店ID
  shifts: ScheduleShift[] // 排班表中的班次
  cost_detail?: CostDetail // 成本详情
  created_at: string
  updated_at: string
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
