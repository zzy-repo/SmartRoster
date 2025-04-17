export interface Schedule {
  id: number
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'archived'
  store_id: number
  created_by?: number
  created_at: string
  position: string
  employee_name: string
  start_time: string
  end_time: string
  override_reason?: string
}