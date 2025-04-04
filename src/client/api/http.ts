import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: '/api', // 根据vite.config.ts中的代理配置
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // Skip auth header for registration and login endpoints
    const skipAuthUrls = ['/auth/register', '/auth/login']
    const token = localStorage.getItem('token')
    if (token && !skipAuthUrls.some(url => config.url?.includes(url))) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error
    if (response) {
      // Skip auth cleanup for registration endpoint
      if (response.status === 401 && !response.config.url?.includes('/auth/register')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

// 封装GET请求
export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http.get(url, { params, ...config })
}

// 封装POST请求
export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http.post(url, data, config)
}

// 封装PUT请求
export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http.put(url, data, config)
}

// 封装DELETE请求
export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http.delete(url, config)
}

export default http
