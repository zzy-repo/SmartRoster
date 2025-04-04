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
  createStore: (storeData: Omit<Store, 'id'>) => {
    return post<{ data: Store }>('/store', storeData)
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
