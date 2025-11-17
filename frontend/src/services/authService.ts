import axios from 'axios'

import {ApiResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse} from '../types'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {return Promise.reject(error)})

// 响应拦截器 - 处理认证错误
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    // Token过期或无效，清除本地存储并重定向到登录页
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  return Promise.reject(error)
})

export const authService = {
  // 登录 - 使用不安全登录方式
  async login(credentials: LoginRequest): Promise<LoginResponse>{
    const response =
        await api.post<LoginResponse>('/auth/insecure/login', credentials)
// 后端直接返回LoginResponse，不需要解包ApiResponse
    return response.data
  },

  // 注册 - 使用不安全注册方式
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>(
        '/auth/insecure/register', userData)
    // 后端直接返回RegisterResponse，不需要解包ApiResponse
    return response.data
  },

  // 验证token
  async verifyToken(token: string): Promise<boolean> {
  try {
    const response =
        await api.get<ApiResponse<{valid: boolean}>>('/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
    return response.data.data?.valid || false
  } catch (error) {
    return false
  }
  },

  // 获取用户信息
  async getUserInfo(): Promise<any> {
  const response = await api.get<ApiResponse<any>>('/auth/me')
  if (!response.data.success) {
    throw new Error(response.data.error || '获取用户信息失败')
  }
  return response.data.data!
  },

  // 更新用户信息
  async updateUserInfo(userData: any): Promise<any> {
  const response = await api.put<ApiResponse<any>>('/auth/me', userData)
  if (!response.data.success) {
    throw new Error(response.data.error || '更新用户信息失败')
  }
  return response.data.data!
  },

  // 修改密码
  async changePassword(
      oldPassword: string, newPassword: string): Promise<void> {
  const response = await api.put<ApiResponse<void>>('/auth/change-password', {
    oldPassword,
    newPassword,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || '修改密码失败')
  }
  },
}

export default authService