import type { ScheduleShift, Shift, ShiftPosition } from '../types/shiftTypes'
import { defineStore } from 'pinia'
import { createShift, deleteShift, fetchShifts, updateShift } from '../api/shiftApi'

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
    error: null,
  }),

  actions: {
    async loadShifts(storeId: number) {
      try {
        this.isLoading = true
        this.currentStoreId = storeId
        const shifts = await fetchShifts(storeId)
        this.shifts = shifts.map(s => ({
          ...s,
          assignments: {},
          positions: s.positions.map(p => ({
            position: p.position,
            count: p.count,
            id: 0,
            shift_id: s.id
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      }
      catch (error) {
        this.error = '加载班次失败'
      }
      finally {
        this.isLoading = false
      }
    },

    async createNewShift(shiftData: Omit<Shift, 'id'>) {
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
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      catch (error) {
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
            positions: (updateData.positions || this.shifts[index].positions).map(p => ({
              position: p.position,
              count: p.count,
              id: p.id || 0,
              shift_id: shiftId
            })),
            updated_at: new Date().toISOString()
          }
        }
      }
      catch (error) {
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
    activeShifts: state => state.shifts.filter(s => s.status === 'open'),
  },
})
