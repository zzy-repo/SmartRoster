import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Schedule } from '@/types/schedule'

interface ScheduleStore extends Schedule {
  id: number
  created_at: string
  position: string
  employee_name: string
  start_time: string
  end_time: string
  override_reason?: string
}
import { scheduleApi } from '@/api/scheduleApi'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<ScheduleStore[]>([
    { 
      id: 1, 
      start_date: '2024-03-01', 
      end_date: '2024-03-07', 
      status: 'published', 
      store_id: 1,
      created_at: '',
      position: '',
      employee_name: '',
      start_time: '',
      end_time: ''
    },
    { 
      id: 2, 
      start_date: '2024-04-15', 
      end_date: '2024-04-21', 
      status: 'draft', 
      store_id: 1,
      created_at: '',
      position: '',
      employee_name: '',
      start_time: '',
      end_time: ''
    },
    { 
      id: 3, 
      start_date: '2024-05-01', 
      end_date: '2024-05-07', 
      status: 'published', 
      store_id: 1,
      created_at: '',
      position: '',
      employee_name: '',
      start_time: '',
      end_time: ''
    }
  ])

  async function fetchSchedules() {
    try {
      const response = await scheduleApi.getSchedules()
      schedules.value = response.data.data.map(item => ({
        ...item,
        created_at: item.created_at || '',
        position: item.position || '',
        employee_name: item.employee_name || '',
        start_time: item.start_time || '',
        end_time: item.end_time || ''
      }))
    } catch (error) {
      console.error('获取排班列表失败:', error)
      throw error
    }
  }

  async function createSchedule(newSchedule: Omit<Schedule, 'id'>) {
    try {
      const response = await scheduleApi.createSchedule(newSchedule)
      schedules.value.push({
        ...response.data.data,
        created_at: response.data.data.created_at || '',
        position: response.data.data.position || '',
        employee_name: response.data.data.employee_name || '',
        start_time: response.data.data.start_time || '',
        end_time: response.data.data.end_time || ''
      })
    } catch (error) {
      console.error('创建排班失败:', error)
      throw error
    }
  }

  async function updateSchedule(updatedSchedule: Schedule) {
    try {
      await scheduleApi.updateSchedule(updatedSchedule.id.toString(), updatedSchedule)
      const index = schedules.value.findIndex((s: ScheduleStore) => s.id === updatedSchedule.id)
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
      await scheduleApi.deleteSchedule(id.toString())
      schedules.value = schedules.value.filter((s: ScheduleStore) => s.id !== id)
    } catch (error) {
      console.error('删除排班失败:', error)
      throw error
    }
  }

  async function updateShiftAssignment(updatedShift: ScheduleStore) {
    const index = schedules.value.findIndex(s => s.id === updatedShift.id)
    if (index !== -1) {
      schedules.value[index] = { ...schedules.value[index], ...updatedShift }
    }
  }

  return {
    schedules,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    updateShiftAssignment
  }
})