import type { Schedule } from '@/types/index'
import { del, get, post, put } from './http'

export const scheduleApi = {

  getSchedules: () => {
    return get<Schedule[]>('/schedules')
  },

  createSchedule: (newSchedule: Omit<Schedule, 'id'>) => {
    return post<{ data: Schedule }>('/schedules', newSchedule)
  },

  updateSchedule: (id: string, updatedSchedule: Partial<Schedule>) => {
    return put<{ data: Schedule }>(`/schedules/${id}`, updatedSchedule)
  },

  deleteSchedule: (id: string) => {
    return del<{ success: boolean }>(`/schedules/${id}`)
  },
}
