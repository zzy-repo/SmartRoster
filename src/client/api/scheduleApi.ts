import type { Schedule } from '@/types/index'
import { del, get, post, put } from './http'

export const scheduleApi = {

  getSchedules: async () => {
    const res = await get<{ data: Schedule[] }>('/schedule')
    return res.data
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

  runSchedule: async (scheduleId: number|string) => {
    return post(`/schedule/run/${scheduleId}`)
  },
}
