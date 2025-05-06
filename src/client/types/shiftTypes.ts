/**
 * 班次基础定义
 * 表示一个具体的班次时间段，包含时间、状态和所需岗位信息
 */
export interface Shift {
  id: number // 班次唯一ID
  day: number // 0-6 表示周一到周日
  start_time: string // 开始时间，格式HH:MM
  end_time: string // 结束时间，格式HH:MM
  store_id: number // 所属门店ID
  positions: ShiftPosition[] // 该班次需要的岗位及人数
  created_at: string // 创建时间
  updated_at: string // 更新时间
}

/**
 * 班次岗位需求
 * 定义某个班次中特定岗位的需求数量
 */
export interface ShiftPosition {
  id: number // 岗位需求ID
  position: string // 岗位名称
  count: number // 需要的人数
  shift_id: number // 关联的班次ID
}

/**
 * 班次分配记录
 * 记录员工被分配到某个班次的具体信息
 */
export interface ShiftAssignment {
  id: number // 分配记录ID
  position: string // 分配的岗位名称
  override_reason?: string // 覆盖分配的原因(如有)
  schedule_id: number // 所属排班表ID
  shift_id: number // 关联的班次ID
  employee_id: number // 被分配员工ID
  assigned_by?: number // 分配操作人ID
  assigned_at: string // 分配时间
}

/**
 * 排班表中的班次定义
 * 扩展基础班次信息，包含实际分配情况
 */
export interface ScheduleShift extends Omit<Shift, 'positions'> {
  assignments: Record<string, ShiftAssignment[]> // 按岗位分组的分配记录
  positions: ShiftPosition[] // 该班次需要的岗位及人数
}

/**
 * 员工分配信息视图
 * 用于展示员工在排班中的分配情况
 */
export interface EmployeeAssignment {
  id: string // 员工ID
  name: string // 员工姓名
  position: string // 分配岗位
  store: string // 所属门店
}

/**
 * 排班表定义
 * 表示一个完整的排班周期，包含所有班次和分配情况
 */
export interface Schedule {
  id: number // 排班表ID
  start_date: string // 开始日期，格式YYYY-MM-DD
  end_date: string // 结束日期，格式YYYY-MM-DD
  store_id: string // 所属门店ID
  status: string // 状态(draft/published/archived)
  shifts: ScheduleShift[] // 该排班表包含的所有班次
  cost_detail?: CostDetail // 排班成本计算结果
  created_at: string // 创建时间
  updated_at: string // 更新时间
}

/**
 * 排班成本详情
 * 记录排班方案的成本计算结果和各项违规惩罚
 */
export interface CostDetail {
  total_cost: number // 总成本
  understaff_penalty: number // 人手不足惩罚
  workday_violations: number // 工作日偏好违规
  time_pref_violations: number // 时间偏好违规
  daily_hours_exceeded: number // 每日超时
  weekly_hours_exceeded: number // 每周超时
}

/**
 * 排班规则定义
 * 定义门店的排班约束规则和成本计算参数
 */
export interface ScheduleRule {
  id: string // 规则ID
  name: string // 规则名称
  store: string // 所属门店ID
  min_rest_hours: number // 最小休息时间(小时)
  max_consecutive_days: number // 最大连续工作天数
  cost_params: {
    understaff_penalty: number // 人手不足惩罚系数
    workday_violation: number // 工作日偏好违规系数
    time_pref_violation: number // 时间偏好违规系数
    daily_hours_violation: number // 每日超时惩罚系数
    weekly_hours_violation: number // 每周超时惩罚系数
  }
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
}
