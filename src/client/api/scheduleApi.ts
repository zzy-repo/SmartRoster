import axios from 'axios'
import type { Schedule } from '@/types/schedule'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

export const fetchSchedules = async () => {
  try {
    const response = await api.get('/schedules')
    return response
  } catch (error) {
    console.error('获取排班列表失败:', error)
    throw error
  }
}

export const createSchedule = async (newSchedule: Omit<Schedule, 'id'>) => {
  try {
    const response = await api.post('/schedules', newSchedule)
    return response
  } catch (error) {
    console.error('创建排班失败:', error)
    throw error
  }
}

export const updateSchedule = async (updatedSchedule: Schedule) => {
  try {
    const response = await api.put(`/schedules/${updatedSchedule.id}`, updatedSchedule)
    return response
  } catch (error) {
    console.error('更新排班失败:', error)
    throw error
  }
}

export const deleteSchedule = async (id: number) => {
  try {
    const response = await api.delete(`/schedules/${id}`)
    return response
  } catch (error) {
    console.error('删除排班失败:', error)
    throw error
  }
}