import type { Store } from '../types'
import { del, get, post, put } from './http'

// 门店API服务
export const storeApi = {
  // 获取门店列表
  getStores: () => {
    return get<{ data: Store[] }>('/stores')
  },

  // 获取单个门店
  getStoreById: (id: string) => {
    return get<{ data: Store }>(`/stores/${id}`)
  },

  // 创建门店
  createStore: (storeData: Omit<Store, 'id'>) => {
    return post<{ data: Store }>('/stores', storeData)
  },

  // 更新门店
  updateStore: (id: string, storeData: Partial<Store>) => {
    return put<{ data: Store }>(`/stores/${id}`, storeData)
  },

  // 删除门店
  deleteStore: (id: string) => {
    return del<{ success: boolean }>(`/stores/${id}`)
  },
}
