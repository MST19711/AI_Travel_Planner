import axios from 'axios'

import {ApiKeys} from '../types'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// 创建axios实例
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

// API密钥字段映射工具函数
const mapApiKeysToFrontend = (backendData: any): ApiKeys => ({
  amapApiKey: backendData.amap_api_key,
  openaiApiKey: backendData.openai_api_key,
  openaiBaseUrl: backendData.openai_base_url,
  openaiModel: backendData.openai_model,
  glmApiKey: backendData.glm_api_key,
  xunfeiAppId: backendData.xunfei_app_id,
  xunfeiApiSecret: backendData.xunfei_api_secret,
  xunfeiApiKey: backendData.xunfei_api_key,
})

const mapApiKeysToBackend = (frontendData: ApiKeys): any => ({
  amap_api_key: frontendData.amapApiKey,
  openai_api_key: frontendData.openaiApiKey,
  openai_base_url: frontendData.openaiBaseUrl,
  openai_model: frontendData.openaiModel,
  glm_api_key: frontendData.glmApiKey,
  xunfei_app_id: frontendData.xunfeiAppId,
  xunfei_api_secret: frontendData.xunfeiApiSecret,
  xunfei_api_key: frontendData.xunfeiApiKey,
})

export const userService = {
  /**
   * 获取用户API密钥
   * @returns 用户的所有API密钥配置
   */
  async getApiKeys(): Promise<ApiKeys> {
    try {
      const response = await api.get<any>('/user/api-keys')
      return mapApiKeysToFrontend(response.data)
    } catch (error) {
      console.error('获取API密钥失败:', error)
      throw error
    }
  },

  /**
   * 更新用户API密钥
   * @param apiKeys 要更新的API密钥对象
   */
  async updateApiKeys(apiKeys: ApiKeys): Promise<void> {
    try {
      const backendApiKeys = mapApiKeysToBackend(apiKeys)
                                 await api.put('/user/api-keys', backendApiKeys)
    } catch (error) {
      console.error('更新API密钥失败:', error)
      throw error
    }
  },

  /**
   * 获取当前用户信息
   * @returns 用户信息对象
   */
  async getUserInfo(): Promise<any> {
    try {
      const response = await api.get('/user/me')
      return response.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  },

  /**
   * 更新用户信息
   * @param userData 要更新的用户数据
   * @returns 更新后的用户信息
   */
  async updateUserInfo(userData: any): Promise<any> {
    try {
      const response = await api.put('/user/profile', userData)
      return response.data
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  },

  /**
   * 修改用户密码
   * @param passwordData 密码数据，包含旧密码和新密码
   */
  async changePassword(
      passwordData: {oldPassword: string; newPassword: string}): Promise<void> {
    try {
      await api.put('/user/change-password', passwordData)
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  },

  /**
   * 删除用户账户
   */
  async deleteAccount(): Promise<void> {
    try {
      await api.delete('/user/account')
    } catch (error) {
      console.error('删除账户失败:', error)
      throw error
    }
  }
}

export default userService