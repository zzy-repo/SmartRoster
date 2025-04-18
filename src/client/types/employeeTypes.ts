// 员工类型定义
export interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  store_id: string | null
  store_name: string | null
  max_daily_hours: number
  max_weekly_hours: number
  workday_pref_start: number
  workday_pref_end: number
  time_pref_start: string
  time_pref_end: string
  created_at?: string
  updated_at?: string
}

// 员工偏好设置
export interface EmployeePreference {
  workday_pref: [number, number]
  time_pref: [string, string]
  max_daily_hours: number
  max_weekly_hours: number
}