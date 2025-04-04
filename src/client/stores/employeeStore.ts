import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Employee } from '../types'
import { employeeApi } from '../api/employeeApi'

export const useEmployeeStore = defineStore('employee', () => {
  // 状态
  const employees = ref<Employee[]>([])
  const loading = ref(false)
  const currentEmployee = ref<Employee | null>(null)

  // 计算属性
  const employeeCount = computed(() => employees.value.length)
  const employeesByStore = computed(() => (storeId: string) => {
    return employees.value.filter(employee => employee.store === storeId)
  })
  const employeesByPosition = computed(() => (position: string) => {
    return employees.value.filter(employee => employee.position === position)
  })

  // 方法
  const fetchEmployees = async (storeId?: string) => {
    loading.value = true
    try {
      const { data } = await employeeApi.getEmployees(storeId)
      employees.value = data.data
    } catch (error) {
      console.error('获取员工列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const getEmployeeById = async (id: string) => {
    try {
      const { data } = await employeeApi.getEmployeeById(id)
      currentEmployee.value = data.data
      return data
    } catch (error) {
      console.error(`获取员工信息失败 (ID: ${id}):`, error)
      return null
    }
  }

  const createEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      const { data } = await employeeApi.createEmployee(employeeData)
      employees.value.push(data.data)
      return data
    } catch (error) {
      console.error('创建员工失败:', error)
      throw error
    }
  }

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const { data: updatedEmployee } = await employeeApi.updateEmployee(id, employeeData)
      const index = employees.value.findIndex(employee => employee.id === id)
      if (index !== -1) {
        employees.value[index] = { ...employees.value[index], ...updatedEmployee.data }
      }
      if (currentEmployee.value?.id === id) {
        currentEmployee.value = { ...currentEmployee.value, ...updatedEmployee.data }
      }
      return updatedEmployee.data
    } catch (error) {
      console.error(`更新员工失败 (ID: ${id}):`, error)
      throw error
    }
  }

  const deleteEmployee = async (id: string) => {
    try {
      await employeeApi.deleteEmployee(id)
      employees.value = employees.value.filter(employee => employee.id !== id)
      if (currentEmployee.value?.id === id) {
        currentEmployee.value = null
      }
      return true
    } catch (error) {
      console.error(`删除员工失败 (ID: ${id}):`, error)
      throw error
    }
  }

  return {
    // 状态
    employees,
    loading,
    currentEmployee,
    // 计算属性
    employeeCount,
    employeesByStore,
    employeesByPosition,
    // 方法
    fetchEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
  }
})