import type { Schedule } from '../types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { rosterApi } from '../api/rosterApi'

export const useRosterStore = defineStore('roster', () => {
  // 状态
  const schedule = ref<Schedule | null>(null)
  const loading = ref(false)
  const generating = ref(false)
  const currentView = ref<'day' | 'week'>('week')
  const currentDate = ref(new Date())
  const groupBy = ref<'position' | 'employee' | 'skill'>('position')

  // 计算属性
  const currentWeekSchedule = computed(() => {
    if (!schedule.value)
      return []

    // 获取当前周的开始日期（周一）
    const curr = new Date(currentDate.value)
    const first = curr.getDate() - curr.getDay() + 1
    const monday = new Date(curr.setDate(first))

    // 过滤出当前周的排班数据
    return schedule.value.shifts.filter((shift) => {
      const shiftDate = new Date(shift.date)
      const diffTime = shiftDate.getTime() - monday.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays < 7
    })
  })

  const currentDaySchedule = computed(() => {
    if (!schedule.value)
      return []

    // 格式化当前日期为YYYY-MM-DD格式
    const dateStr = currentDate.value.toISOString().split('T')[0]

    // 过滤出当前日期的排班数据
    return schedule.value.shifts.filter((shift) => {
      return shift.date === dateStr
    })
  })

  const unassignedShifts = computed(() => {
    const shifts = currentView.value === 'day' ? currentDaySchedule.value : currentWeekSchedule.value
    return shifts.filter((shift) => {
      // 检查是否有未分配的岗位
      return Object.values(shift.assignments).some(assignments => assignments.length === 0)
    })
  })

  // 方法
  const getAvailableEmployees = async (params: {
    shiftId: string
    position: string
  }) => {
    try {
      const { data } = await rosterApi.getAvailableEmployees(params)
      return data
    }
    catch (error) {
      console.error('获取可用员工列表失败:', error)
      throw error
    }
  }

  const generateSchedule = async (params: {
    startDate: string
    endDate: string
    storeId: string
  }) => {
    generating.value = true
    try {
      const { data } = await rosterApi.generateRoster(params)
      schedule.value = data.data
      return data.data
    }
    catch (error) {
      console.error('生成排班表失败:', error)
      throw error
    }
    finally {
      generating.value = false
    }
  }

  const fetchSchedule = async (params: {
    startDate: string
    endDate: string
    storeId: string
  }) => {
    loading.value = true
    try {
      const { data } = await rosterApi.getSchedule(params)
      schedule.value = data.data
      return data.data
    }
    catch (error) {
      console.error('获取排班表失败:', error)
      throw error
    }
    finally {
      loading.value = false
    }
  }

  const assignShift = async (params: {
    shiftId: string
    employeeId: string
    position: string
  }) => {
    try {
      const response = await rosterApi.assignShift(params)

      // 更新本地排班数据
      if (schedule.value) {
        const shiftIndex = schedule.value.shifts.findIndex(s => s.id === params.shiftId)
        if (shiftIndex !== -1) {
          // 深拷贝当前排班表
          const updatedSchedule = JSON.parse(JSON.stringify(schedule.value))
          // 更新指定班次的分配情况
          const assignments = updatedSchedule.shifts[shiftIndex].assignments

          // 如果该岗位不存在，创建一个空数组
          if (!assignments[params.position]) {
            assignments[params.position] = []
          }

          // 添加员工到该岗位
          assignments[params.position].push({
            id: params.employeeId,
            // 其他员工信息将由后端返回
            ...response.data,
          })

          schedule.value = updatedSchedule
        }
      }

      return response.data
    }
    catch (error) {
      console.error('分配班次失败:', error)
      throw error
    }
  }

  const unassignShift = async (params: {
    shiftId: string
    employeeId: string
    position: string
  }) => {
    try {
      await rosterApi.unassignShift(params)

      // 更新本地排班数据
      if (schedule.value) {
        const shiftIndex = schedule.value.shifts.findIndex(s => s.id === params.shiftId)
        if (shiftIndex !== -1) {
          // 深拷贝当前排班表
          const updatedSchedule = JSON.parse(JSON.stringify(schedule.value))
          // 更新指定班次的分配情况
          const assignments = updatedSchedule.shifts[shiftIndex].assignments

          // 如果该岗位存在，移除指定员工
          if (assignments[params.position]) {
            assignments[params.position] = assignments[params.position].filter(
              (emp: { id: string }) => emp.id !== params.employeeId,
            )
          }

          schedule.value = updatedSchedule
        }
      }

      return true
    }
    catch (error) {
      console.error('取消分配班次失败:', error)
      throw error
    }
  }

  const setCurrentView = (view: 'day' | 'week') => {
    currentView.value = view
  }

  const setCurrentDate = (date: Date) => {
    currentDate.value = date
  }

  const setGroupBy = (group: 'position' | 'employee' | 'skill') => {
    groupBy.value = group
  }

  return {
    // 状态
    schedule,
    loading,
    generating,
    currentView,
    currentDate,
    groupBy,
    // 计算属性
    currentWeekSchedule,
    currentDaySchedule,
    unassignedShifts,
    // 方法
    getAvailableEmployees,
    generateSchedule,
    fetchSchedule,
    assignShift,
    unassignShift,
    setCurrentView,
    setCurrentDate,
    setGroupBy,
  }
})
