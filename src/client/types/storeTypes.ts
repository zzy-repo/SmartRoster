// 门店类型定义
export interface Store {
  id: string
  name: string
  area: number // 工作场所面积（平方米）
  phone?: string // 添加可选的电话属性
  employeeCount?: number // 添加可选的员工数量属性
  createdAt?: string
  updatedAt?: string
}