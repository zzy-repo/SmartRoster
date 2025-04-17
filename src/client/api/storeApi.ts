import type { Store } from '../types'
import { del, get, post, put } from './http'

// 门店API服务
export const storeApi = {
  // 获取门店列表
  getStores: () => {
    return get<{ data: Store[] }>('/store')
  },

  // 获取单个门店
  getStoreById: (id: string) => {
    return get<{ data: Store }>(`/store/${id}`)
  },

  // 创建门店
  createStore: async (storeData: Omit<Store, 'id'>) => {
    const res = await post<{ data: Store }>('/store', storeData)
    const id = res.data.data.id
    return id
  },

  // 更新门店
  updateStore: (id: string, storeData: Partial<Store>) => {
    return put<{ data: Store }>(`/store/${id}`, storeData)
  },

  // 删除门店
  deleteStore: (id: string) => {
    return del<{ success: boolean }>(`/store/${id}`)
  },
}
