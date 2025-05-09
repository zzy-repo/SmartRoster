import type { AxiosPromise } from 'axios'
import request from '@/utils/request'

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: { // 添加user字段
    id: string
    username: string
    // 可以根据实际返回的用户信息添加更多字段
  }
}

export function login(data: LoginForm): AxiosPromise<LoginResponse> {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

export function logout(): AxiosPromise<void> {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}

export function getUserInfo(): AxiosPromise<any> {
  return request({
    url: '/auth/userinfo',
    method: 'get',
  })
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未授权访问'
    case 403:
      return '禁止访问'
    case 404:
      return '资源不存在'
    case 500:
      return '服务器内部错误'
    default:
      return `请求失败 (${status})`
  }
}

export function register(data: RegisterForm): AxiosPromise<void> {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  }).catch((error) => {
    if (!error.response) {
      throw {
        response: {
          status: 0,
          data: { message: '网络错误，请检查连接' },
        },
        message: '网络错误',
      }
    }
    throw {
      response: {
        status: error.response.status,
        data: {
          message: error.response.data?.message
            || getDefaultMessage(error.response.status),
        },
      },
      message: error.response.data?.message || '注册失败',
    }
  })
}
