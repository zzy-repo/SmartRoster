import { defineStore } from 'pinia'
import type { Schedule, ShiftAssignment } from '@/types/shiftTypes'
import { scheduleApi } from '@/api/scheduleApi'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    currentSchedule: null as Schedule | null,
    schedules: [] as Schedule[],
    loading: false,
    error: null as string | null,
    scheduleRules: [],
    employeeAssignments: []
  }),

  actions: {
    async fetchSchedules() {
      this.loading = true
      try {
        const response = await scheduleApi.getSchedules()
        if(!response.data) {
          throw new Error('获取排班表失败,未获取到数据')
        }
        this.schedules = response.data
        return this.schedules
      } catch (err) {
        this.error = '获取排班表失败'
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async fetchSchedule(scheduleId: number) {
      this.loading = true
      try {
        console.log(scheduleId)
        const response = await scheduleApi.getSchedules()
        console.log(response)
        this.currentSchedule = response.data.find((s: Schedule) => s.id === scheduleId) || null
      } catch (err) {
        this.error = '获取排班表失败'
      } finally {
        this.loading = false
      }
    },

    async saveSchedule() {
      if (!this.currentSchedule) return
      this.loading = true
      try {
        // TODO: 实现API调用
        // await api.put(`/schedules/${this.currentSchedule.id}`, this.currentSchedule)
      } catch (err) {
        this.error = '保存排班表失败'
      } finally {
        this.loading = false
      }
    },
    
    async createSchedule(schedule: any) {
      this.loading = true
      try {
        const response = await scheduleApi.createSchedule(schedule)
        return response.data
      } catch (err) {
        this.error = '创建排班表失败'
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async updateSchedule(schedule: any) {
      this.loading = true
      try {
        const response = await scheduleApi.updateSchedule(String(schedule.id), schedule)
        return response.data
      } catch (err) {
        this.error = '更新排班表失败'
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async deleteSchedule(id: number) {
      this.loading = true
      try {
        await scheduleApi.deleteSchedule(String(id))
        this.schedules = this.schedules.filter(s => s.id !== id)
      } catch (err) {
        this.error = '删除排班表失败'
        throw err
      } finally {
        this.loading = false
      }
    },

    addAssignment(shiftId: number, position: string, employeeId: number) {
      const shift = this.currentSchedule?.shifts.find(s => s.id === shiftId)
      if (shift) {
        const assignment: ShiftAssignment = {
          id: Date.now(),
          position,
          shift_id: shiftId,
          employee_id: employeeId,
          schedule_id: this.currentSchedule!.id,
          assigned_at: new Date().toISOString()
        }
        
        if (!shift.assignments[position]) {
          shift.assignments[position] = []
        }
        shift.assignments[position].push(assignment)
      }
    },

    removeAssignment(shiftId: number, position: string, assignmentId: number) {
      const shift = this.currentSchedule?.shifts.find(s => s.id === shiftId)
      if (shift && shift.assignments[position]) {
        shift.assignments[position] = shift.assignments[position].filter(
          a => a.id !== assignmentId
        )
      }
    }
  },

  getters: {
    currentStoreRules: (state) => {
      if (!state.currentSchedule) return []
      return state.scheduleRules.filter(
        (rule: any) => rule.store === state.currentSchedule?.store_id.toString()
      )
    }
  }
})