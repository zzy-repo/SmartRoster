import http from './http'

export interface Shift {
  id: number
  day: number
  start_time: string
  end_time: string
  store_id: number
  schedule_id: number
  positions: {
    position: string
    count: number
  }[]
}

export function fetchShifts(scheduleId: number) {
  return http.get<Shift[]>(`/schedule/shifts?scheduleId=${scheduleId}`).then(res => res.data)
}

export function createShift(data: Omit<Shift, 'id'>) {
  return http.post<Shift>('/schedule/shifts', data).then(res => res.data)
}

export function updateShift(id: number, data: Partial<Shift>) {
  return http.put<Shift>(`/schedule/shifts/${id}`, data).then(res => res.data)
}

export function deleteShift(id: number) {
  return http.delete(`/schedule/shifts/${id}`)
}
