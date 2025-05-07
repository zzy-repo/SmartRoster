import http from './http'
import type { Shift, ShiftPosition } from '@/types/shiftTypes'

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
