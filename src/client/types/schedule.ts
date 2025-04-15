export interface Schedule {
  id: number
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'archived'
  store_id: number
  created_by?: number
  created_at: string
}