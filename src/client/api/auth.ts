import type { AxiosPromise } from 'axios'
import request from '@/utils/request'

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

export function login(data: LoginForm): AxiosPromise<LoginResponse> {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function logout(): AxiosPromise<void> {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getUserInfo(): AxiosPromise<any> {
  return request({
    url: '/auth/userinfo',
    method: 'get'
  })
}