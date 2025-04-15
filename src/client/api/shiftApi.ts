import http from './http'

export interface Shift {
  id: number
  day: number
  startTime: string
  endTime: string
  status: 'open' | 'closed'
  storeId: number
}

export const fetchShifts = (storeId: number) =>
  http.get<Shift[]>(`/shifts?storeId=${storeId}`).then(res => res.data)

export const createShift = (data: Omit<Shift, 'id'>) =>
  http.post<Shift>('/shifts', data).then(res => res.data)

export const updateShift = (id: number, data: Partial<Shift>) =>
  http.patch<Shift>(`/shifts/${id}`, data).then(res => res.data)

export const deleteShift = (id: number) =>
  http.delete(`/shifts/${id}`)