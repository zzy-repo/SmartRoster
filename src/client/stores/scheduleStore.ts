import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Schedule } from '@/types/schedule'
import {
  createSchedule as apiCreateSchedule,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule as apiDeleteSchedule,
  fetchSchedules as apiFetchSchedules
} from '@/api/scheduleApi'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([
    { id: 1, start_date: '2024-03-01', end_date: '2024-03-07', status: 'published', store_id: 1 },
    { id: 2, start_date: '2024-04-15', end_date: '2024-04-21', status: 'draft', store_id: 1 },
    { id: 3, start_date: '2024-05-01', end_date: '2024-05-07', status: 'published', store_id: 1 }
  ])

  async function fetchSchedules() {
    try {
      const response = await apiFetchSchedules()
      schedules.value = response.data
    } catch (error) {
      console.error('获取排班列表失败:', error)
      throw error
    }
  }

  async function createSchedule(newSchedule: Omit<Schedule, 'id'>) {
    try {
      const response = await apiCreateSchedule(newSchedule)
      schedules.value.push(response.data)
    } catch (error) {
      console.error('创建排班失败:', error)
      throw error
    }
  }

  async function updateSchedule(updatedSchedule: Schedule) {
    try {
      await apiUpdateSchedule(updatedSchedule)
      const index = schedules.value.findIndex((s: Schedule) => s.id === updatedSchedule.id)
      if (index !== -1) {
        schedules.value.splice(index, 1, updatedSchedule)
      }
    } catch (error) {
      console.error('更新排班失败:', error)
      throw error
    }
  }

  async function deleteSchedule(id: number) {
    try {
      await apiDeleteSchedule(id)
      schedules.value = schedules.value.filter((s: Schedule) => s.id !== id)
    } catch (error) {
      console.error('删除排班失败:', error)
      throw error
    }
  }

  return {
    schedules,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
})