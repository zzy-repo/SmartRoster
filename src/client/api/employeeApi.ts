import { get, post, put, del } from './http'
import type { Employee } from '../types'

// 员工API服务
export const employeeApi = {
  // 获取员工列表
  getEmployees: (storeId?: string) => {
    return get<{ data: Employee[] }>('/employees', { store_id: storeId })
  },
  
  // 获取单个员工
  getEmployeeById: (id: string) => {
    return get<{ data: Employee }>(`/employees/${id}`)
  },
  
  // 创建员工
  createEmployee: (employeeData: Omit<Employee, 'id'>) => {
    return post<{ data: Employee }>('/employees', employeeData)
  },
  
  // 更新员工
  updateEmployee: (id: string, employeeData: Partial<Employee>) => {
    return put<{ data: Employee }>(`/employees/${id}`, employeeData)
  },
  
  // 删除员工
  deleteEmployee: (id: string) => {
    return del<{ success: boolean }>(`/employees/${id}`)
  },
  
  // 获取员工偏好设置
  getEmployeePreferences: (id: string) => {
    return get<{ data: Employee['preferences'] }>(`/employees/${id}/preferences`)
  },
  
  // 更新员工偏好设置
  updateEmployeePreferences: (id: string, preferences: Employee['preferences']) => {
    return put<{ data: Employee['preferences'] }>(`/employees/${id}/preferences`, preferences)
  }
}