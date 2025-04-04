import type { Schedule } from '../types'
import { get, post } from './http'

// 排班API服务
export const rosterApi = {
  // 生成排班表
  generateRoster: (params: {
    startDate: string
    endDate: string
    storeId: string
  }) => {
    return post<{ data: Schedule }>('/roster/generate', {
      start_date: params.startDate,
      end_date: params.endDate,
      store_id: params.storeId,
    })
  },

  // 获取排班表
  getSchedule: (params: {
    startDate: string
    endDate: string
    storeId: string
  }) => {
    return get<{ data: Schedule }>('/roster/schedule', {
      start_date: params.startDate,
      end_date: params.endDate,
      store_id: params.storeId,
    })
  },

  // 分配班次
  assignShift: (params: {
    shiftId: string
    employeeId: string
    position: string
  }) => {
    return post<{ data: { success: boolean, employee: any } }>(`/roster/shifts/${params.shiftId}/assign`, {
      employee_id: params.employeeId,
      position: params.position,
    })
  },

  // 取消分配班次
  unassignShift: (params: {
    shiftId: string
    employeeId: string
    position: string
  }) => {
    return post<{ data: { success: boolean } }>(`/roster/shifts/${params.shiftId}/unassign`, {
      employee_id: params.employeeId,
      position: params.position,
    })
  },

  // 获取可用员工列表（用于分配班次）
  getAvailableEmployees: (params: {
    shiftId: string
    position: string
  }) => {
    return get<{ data: any[] }>(`/roster/shifts/${params.shiftId}/available-employees`, {
      position: params.position,
    })
  },
}
