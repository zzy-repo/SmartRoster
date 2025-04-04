import axios from 'axios'
import router from '../router'
import { useAuthStore } from '../stores/authStore.ts'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  // 注册接口不需要携带token
  if (authStore.token && config.url !== '/api/auth/register') {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      authStore.clearUser()
      router.replace(`/login?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`)
    }

    // 统一处理错误信息
    const errorMessage = error.response?.data?.error || '请求发生错误'
    return Promise.reject(new Error(errorMessage))
  },
)

export function checkAuth() {
  return localStorage.getItem('token') !== null
}

export default api
