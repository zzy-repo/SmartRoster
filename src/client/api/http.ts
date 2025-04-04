import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: '/api', // 根据vite.config.ts中的代理配置
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 统一处理错误
    const { response } = error
    if (response) {
      // 根据状态码处理不同错误
      switch (response.status) {
        case 401:
          // 未授权，可以跳转到登录页
          console.error('未授权，请重新登录')
          // 可以在这里清除token并跳转到登录页
          break
        case 403:
          console.error('没有权限访问该资源')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error(`未知错误: ${response.status}`)
      }
    } else {
      // 网络错误或请求被取消
      console.error('网络错误或请求被取消')
    }
    return Promise.reject(error)
  }
)

// 封装GET请求
export const get = <T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return http.get(url, { params, ...config })
}

// 封装POST请求
export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return http.post(url, data, config)
}

// 封装PUT请求
export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return http.put(url, data, config)
}

// 封装DELETE请求
export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return http.delete(url, config)
}

export default http