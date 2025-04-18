import type { Schedule } from '@/types/schedule'
import { del, get, post, put } from './http'

export const scheduleApi = {

  getSchedules: () => {
    return get<{ data: Schedule[] }>('/schedule')
  },

  createSchedule: (newSchedule: Omit<Schedule, 'id'>) => {
    return post<{ data: Schedule }>('/schedule', newSchedule)
  },

  updateSchedule: (id: string, updatedSchedule: Partial<Schedule>) => {
    return put<{ data: Schedule }>(`/schedule/${id}`, updatedSchedule)
  },

  deleteSchedule: (id: string) => {
    return del<{ success: boolean }>(`/schedule/${id}`)
  },
}
