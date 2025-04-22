import { defineStore } from 'pinia'
import { fetchShifts, createShift, updateShift, deleteShift } from '../api/shiftApi'
import type { Shift, ScheduleShift } from '../types/shiftTypes'

interface ShiftState {
  shifts: ScheduleShift[]
  currentStoreId: number | null
  isLoading: boolean
  error: string | null
}

export const useShiftStore = defineStore('shift', {
  state: (): ShiftState => ({
    shifts: [],
    currentStoreId: null,
    isLoading: false,
    error: null
  }),

  actions: {
    async loadShifts(storeId: number) {
      try {
        this.isLoading = true
        this.currentStoreId = storeId
        const shifts = await fetchShifts(storeId)
        this.shifts = shifts.map(s => ({
          ...s,
          start_time: s.startTime,
          end_time: s.endTime,
          store_id: s.storeId,
          assignments: {},
          positions: [],
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString()
        }))
      } catch (error) {
        this.error = '加载班次失败'
      } finally {
        this.isLoading = false
      }
    },

    async createNewShift(shiftData: Omit<Shift, 'id'>) {
      try {
        const newShift = await createShift(shiftData)
        this.shifts.push({
          ...newShift,
          positions: [],
          assignments: {},
          start_time: newShift.startTime,
          end_time: newShift.endTime,
          store_id: newShift.storeId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } catch (error) {
        this.error = '创建班次失败'
        throw error
      }
    },

    async updateExistingShift(shiftId: number, updateData: Partial<Shift>) {
      try {
        const updatedShift = await updateShift(shiftId, updateData)
        const index = this.shifts.findIndex(s => s.id === shiftId)
        if (index !== -1) {
          this.shifts[index] = {
            ...this.shifts[index],
            ...updatedShift,
            start_time: updatedShift.startTime || this.shifts[index].start_time,
            end_time: updatedShift.endTime || this.shifts[index].end_time
          }
        }
      } catch (error) {
        this.error = '更新班次失败'
        throw error
      }
    },

    async toggleShiftStatus(shiftId: number, status: 'open' | 'closed') {
      const shift = this.shifts.find(s => s.id === shiftId)
      if (shift) {
        await this.updateExistingShift(shiftId, { status })
      }
    },

    async removeShift(shiftId: number) {
      try {
        await deleteShift(shiftId)
        this.shifts = this.shifts.filter(s => s.id !== shiftId)
      } catch (error) {
        this.error = '删除班次失败'
        throw error
      }
    }
  },

  getters: {
    getShiftsByDay: (state) => {
      return (day: number) => state.shifts.filter(s => s.day === day)
    },
    activeShifts: (state) => state.shifts.filter(s => s.status === 'open')
  }
})