import type { Store } from '../types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storeApi } from '../api/storeApi'

export const useStoreStore = defineStore('store', () => {
  // 状态
  const stores = ref<Store[]>([])
  const loading = ref(false)
  const currentStore = ref<Store | null>(null)

  // 计算属性
  const storeCount = computed(() => stores.value.length)
  const storeOptions = computed(() => stores.value.map(store => ({
    label: store.name,
    value: store.id,
  })))

  // 方法
  const fetchStores = async () => {
    loading.value = true
    try {
      const { data } = await storeApi.getStores()
      stores.value = data.data
    }
    catch (error) {
      console.error('获取门店列表失败:', error)
    }
    finally {
      loading.value = false
    }
  }

  const getStoreById = async (id: string) => {
    try {
      const { data } = await storeApi.getStoreById(id)
      currentStore.value = data.data
      return data
    }
    catch (error) {
      console.error(`获取门店信息失败 (ID: ${id}):`, error)
      return null
    }
  }

  const createStore = async (storeData: Omit<Store, 'id'>) => {
    try {
      const id = await storeApi.createStore(storeData)
      const newStore = { ...storeData, id }
      stores.value.push(newStore)
      return newStore
    }
    catch (error) {
      console.error('创建门店失败:', error)
      throw error
    }
  }

  const updateStore = async (id: string, storeData: Partial<Store>) => {
    try {
      const { data } = await storeApi.updateStore(id, storeData)
      const index = stores.value.findIndex(store => store.id === id)
      if (index !== -1) {
        stores.value[index] = { ...stores.value[index], ...data.data }
      }
      if (currentStore.value?.id === id) {
        currentStore.value = { ...currentStore.value, ...data }
      }
      return data
    }
    catch (error) {
      console.error(`更新门店失败 (ID: ${id}):`, error)
      throw error
    }
  }

  const deleteStore = async (id: string) => {
    try {
      await storeApi.deleteStore(id)
      stores.value = stores.value.filter(store => store.id !== id)
      if (currentStore.value?.id === id) {
        currentStore.value = null
      }
      return true
    }
    catch (error) {
      console.error(`删除门店失败 (ID: ${id}):`, error)
      throw error
    }
  }

  return {
    // 状态
    stores,
    loading,
    currentStore,
    // 计算属性
    storeCount,
    storeOptions,
    // 方法
    fetchStores,
    getStoreById,
    createStore,
    updateStore,
    deleteStore,
  }
})
