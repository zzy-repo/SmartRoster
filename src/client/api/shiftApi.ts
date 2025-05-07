import http from './http'

export interface Shift {
  id: number
  day: number
  start_time: string
  end_time: string
  store_id: number
  schedule_id: number
  positions: {
    id: number
    position: string
    count: number
    shift_id: number
  }[]
  created_at: string
  updated_at: string
}

export interface ShiftResponse {
  shifts: Shift[]
}

export function fetchShifts(storeId: number, scheduleId: number) {
  return http.get<ShiftResponse>('/schedule/shifts', {
    params: {
      storeId,
      scheduleId
    }
  }).then(res => res.data)
}

export function createShift(data: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) {
  return http.post<Shift>('/schedule/shifts', data).then(res => res.data)
}

export function updateShift(id: number, data: Partial<Omit<Shift, 'id' | 'created_at' | 'updated_at'>>) {
  return http.put<Shift>(`/schedule/shifts/${id}`, data).then(res => res.data)
}

export function deleteShift(id: number) {
  return http.delete(`/schedule/shifts/${id}`)
}
