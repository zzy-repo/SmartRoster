import http from './http'

export interface Shift {
  id: number
  day: number
  startTime: string
  endTime: string
  status: 'open' | 'closed'
  storeId: number
}

export function fetchShifts(storeId: number) {
  return http.get<Shift[]>(`/shifts?storeId=${storeId}`).then(res => res.data)
}

export function createShift(data: Omit<Shift, 'id'>) {
  return http.post<Shift>('/shifts', data).then(res => res.data)
}

export function updateShift(id: number, data: Partial<Shift>) {
  return http.patch<Shift>(`/shifts/${id}`, data).then(res => res.data)
}

export function deleteShift(id: number) {
  return http.delete(`/shifts/${id}`)
}
