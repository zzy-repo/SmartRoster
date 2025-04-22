import type { Schedule, ShiftAssignment } from '@/types/shiftTypes'
import { scheduleApi } from '@/api/scheduleApi'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

export const useScheduleStore = defineStore('schedule', () => {
  const currentSchedule = ref<Schedule | null>(null)
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const scheduleRules = reactive<any[]>([])
  const employeeAssignments = reactive<any[]>([])

  const currentStoreRules = computed(() => {
    if (!currentSchedule.value)
      return []
    return scheduleRules.filter(
      (rule: any) => rule.store === currentSchedule.value?.store_id.toString(),
    )
  })

  async function fetchSchedules() {
    loading.value = true
    try {
      const response = await scheduleApi.getSchedules()
      if (!response.data) {
        throw new Error('获取排班表失败,未获取到数据')
      }
      schedules.value = response.data
      return schedules.value
    }
    catch (err) {
      error.value = '获取排班表失败'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSchedule(scheduleId: number) {
    loading.value = true
    try {
      const response = await scheduleApi.getSchedules()
      currentSchedule.value = response.data.find((s: Schedule) => s.id === scheduleId) || null
    }
    catch (err) {
      error.value = '获取排班表失败'
    }
    finally {
      loading.value = false
    }
  }

  async function saveSchedule() {
    if (!currentSchedule.value)
      return
    loading.value = true
    try {
      // TODO: 实现API调用
      // await api.put(`/schedules/${currentSchedule.value.id}`, currentSchedule.value)
    }
    catch (err) {
      error.value = '保存排班表失败'
    }
    finally {
      loading.value = false
    }
  }

  async function createSchedule(schedule: any) {
    loading.value = true
    try {
      const response = await scheduleApi.createSchedule(schedule)
      return response.data
    }
    catch (err) {
      error.value = '创建排班表失败'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateSchedule(schedule: any) {
    loading.value = true
    try {
      const response = await scheduleApi.updateSchedule(String(schedule.id), schedule)
      return response.data
    }
    catch (err) {
      error.value = '更新排班表失败'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteSchedule(id: number) {
    loading.value = true
    try {
      await scheduleApi.deleteSchedule(String(id))
      schedules.value = schedules.value.filter(s => s.id !== id)
    }
    catch (err) {
      error.value = '删除排班表失败'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function addAssignment(shiftId: number, position: string, employeeId: number) {
    const shift = currentSchedule.value?.shifts.find(s => s.id === shiftId)
    if (shift) {
      const assignment: ShiftAssignment = {
        id: Date.now(),
        position,
        shift_id: shiftId,
        employee_id: employeeId,
        schedule_id: currentSchedule.value!.id,
        assigned_at: new Date().toISOString(),
      }

      if (!shift.assignments[position]) {
        shift.assignments[position] = []
      }
      shift.assignments[position].push(assignment)
    }
  }

  function removeAssignment(shiftId: number, position: string, assignmentId: number) {
    const shift = currentSchedule.value?.shifts.find(s => s.id === shiftId)
    if (shift && shift.assignments[position]) {
      shift.assignments[position] = shift.assignments[position].filter(
        a => a.id !== assignmentId,
      )
    }
  }

  return {
    currentSchedule,
    schedules,
    loading,
    error,
    scheduleRules,
    employeeAssignments,
    currentStoreRules,
    fetchSchedules,
    fetchSchedule,
    saveSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addAssignment,
    removeAssignment,
  }
})
