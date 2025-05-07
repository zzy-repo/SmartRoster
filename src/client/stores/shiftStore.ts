import type { ScheduleShift, Shift, ShiftPosition } from '../types/shiftTypes'
import { defineStore } from 'pinia'
import { createShift, deleteShift, fetchShifts, updateShift } from '../api/shiftApi'

interface ShiftState {
  shifts: ScheduleShift[]
  currentStoreId: number | null
  currentScheduleId: number | null
  isLoading: boolean
  error: string | null
}

export const useShiftStore = defineStore('shift', {
  state: (): ShiftState => ({
    shifts: [],
    currentStoreId: null,
    currentScheduleId: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async loadShifts(storeId: number, scheduleId: number) {
      try {
        this.isLoading = true
        this.currentStoreId = storeId
        this.currentScheduleId = scheduleId
        const response = await fetchShifts(storeId, scheduleId)
        
        // 检查响应数据格式
        if (!response || !response.shifts || !Array.isArray(response.shifts)) {
          console.error('服务器返回的数据格式不正确:', response)
          throw new Error('服务器返回的数据格式不正确')
        }

        this.shifts = response.shifts.map(s => {
          // 确保每个班次对象都有必要的字段
          if (!s || typeof s !== 'object') {
            console.error('无效的班次数据:', s)
            throw new Error('无效的班次数据')
          }

          // 确保positions是数组
          const positions = Array.isArray(s.positions) ? s.positions : []
          
          return {
            id: s.id || 0,
            day: s.day || 0,
            start_time: s.start_time || '',
            end_time: s.end_time || '',
            store_id: s.store_id || storeId,
            schedule_id: s.schedule_id || scheduleId,
            assignments: {},
            positions: positions.map(p => ({
              position: p.position || '',
              count: p.count || 0,
              id: p.id || 0,
              shift_id: s.id || 0
            })),
            created_at: s.created_at || new Date().toISOString(),
            updated_at: s.updated_at || new Date().toISOString()
          }
        })
      }
      catch (error) {
        console.error('加载班次失败:', error)
        this.error = '加载班次失败'
        throw error
      }
      finally {
        this.isLoading = false
      }
    },

    async createNewShift(shiftData: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) {
      try {
        const newShift = await createShift(shiftData)
        this.shifts.push({
          ...newShift,
          assignments: {},
          positions: shiftData.positions.map(p => ({
            position: p.position,
            count: p.count,
            id: 0,
            shift_id: newShift.id
          }))
        })
      }
      catch (error) {
        this.error = '创建班次失败'
        throw error
      }
    },

    async updateExistingShift(shiftId: number, updateData: Partial<Omit<Shift, 'id' | 'created_at' | 'updated_at'>>) {
      try {
        const updatedShift = await updateShift(shiftId, updateData)
        const index = this.shifts.findIndex(s => s.id === shiftId)
        
        if (index !== -1) {
          this.shifts[index] = {
            ...this.shifts[index],
            ...updatedShift,
            positions: (updateData.positions || this.shifts[index].positions).map(p => ({
              position: p.position,
              count: p.count,
              id: p.id || 0,
              shift_id: shiftId
            }))
          }
        }
      }
      catch (error) {
        this.error = '更新班次失败'
        throw error
      }
    },

    async removeShift(shiftId: number) {
      try {
        await deleteShift(shiftId)
        this.shifts = this.shifts.filter(s => s.id !== shiftId)
      }
      catch (error) {
        this.error = '删除班次失败'
        throw error
      }
    },
  },

  getters: {
    getShiftsByDay: (state) => {
      return (day: number) => state.shifts.filter(s => s.day === day)
    },
  },
})
