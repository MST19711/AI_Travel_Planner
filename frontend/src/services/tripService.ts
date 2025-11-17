import axios from 'axios'

import {Trip, TripCreateRequest} from '../types'

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
api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token过期或无效，清除本地存储并重定向到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    })

    // 后端行程数据结构
    interface BackendTrip {
  id: number
  user_id: number
  title: string
  status: string
  trip_data: {title?: string
  description?: string|null
  startDate?: string
  endDate?: string
  start_date?: string
  end_date?: string
  budget?: number|null
  participants?: number|null
  travelers?: number|null
  preferences?: {food?: string[]
  activities?: string[]
      accommodation?: string
    } | null
      activities?: Array < {title: string
      description?: string|null
      location?: string|null
      city?: string|null
      countryCode?: string|null
      startTime?: string|null
      endTime?: string|null
      estimatedCost?: number|null
      cost?: number|null
      notes?: string | null
    }> | null
  }
  created_at: string
      updated_at: string
}

interface TripListResponse {
  items: BackendTrip[]
  total: number
  page: number
  size: number
  pages: number
}

// 将后端行程数据转换为前端格式
function transformBackendTrip(backendTrip: BackendTrip): Trip {
  const tripData = backendTrip.trip_data

  // 处理日期字段 - 支持两种格式
  const startDate =
      tripData.startDate || tripData.start_date || backendTrip.created_at
  const endDate =
      tripData.endDate || tripData.end_date || backendTrip.created_at

  return {
    id: backendTrip.id, title: tripData.title || backendTrip.title,
        description: tripData.description || null, startDate: startDate,
        endDate: endDate, budget: tripData.budget || null,
        participants: tripData.participants || tripData.travelers || null,
        preferences: tripData.preferences ?
        JSON.stringify(tripData.preferences) :
        null,
        activities: tripData.activities?.map(
            (activity, index) => ({
              id: index + 1,
              tripId: backendTrip.id,
              title: activity.title || `活动 ${index + 1}`,
              description: activity.description || null,
              location: activity.location || null,
              countryCode: activity.countryCode || null,
              latitude: null,
              longitude: null,
              startTime: activity.startTime || null,
              endTime: activity.endTime || null,
              cost: activity.estimatedCost || activity.cost || null,
              category: activity.notes || null,
              createdAt: backendTrip.created_at,
              updatedAt: backendTrip.updated_at
            })) ||
        null,
        createdAt: backendTrip.created_at, updatedAt: backendTrip.updated_at,
        status: backendTrip.status
  }
}

export const tripService = {
  // 获取行程列表
  async getTrips(page: number = 1, size: number = 10, status?: string):
      Promise<Trip[]> {
        try {
          const params = new URLSearchParams()
          params.append('page', page.toString())
          params.append('size', size.toString())
          if (status) {
            params.append('status', status)
          }

          const response = await api.get<TripListResponse>(`/trips/?${params}`)
          return response.data.items.map(transformBackendTrip)
        } catch (error) {
          console.error('获取行程列表失败:', error)
          throw error
        }
      },

  // 获取行程详情
  async getTripById(tripId: number): Promise<Trip> {
    try {
      const response = await api.get<BackendTrip>(`/trips/${tripId}`)
      return transformBackendTrip(response.data)
    } catch (error) {
      console.error(`获取行程详情失败 (ID: ${tripId}):`, error)
      throw error
    }
  },

  // 创建行程
  async createTrip(tripData: TripCreateRequest): Promise<Trip> {
    try {
      // 将前端格式转换为后端格式
      const backendTripData = {
        title: tripData.title,
        trip_data: {
          title: tripData.title,
          description: tripData.description || null,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          budget: tripData.budget || null,
          participants: tripData.participants || null,
          preferences: tripData.preferences ? JSON.parse(tripData.preferences) :
                                              null,
          activities: tripData.activities || []  // 保存activities数据
        }
      }

      const response = await api.post<BackendTrip>('/trips/', backendTripData)
      return transformBackendTrip(response.data)
    } catch (error) {
      console.error('创建行程失败:', error)
      throw error
    }
  },

  // 更新行程
  async updateTrip(tripId: number, tripData: Partial<TripCreateRequest>):
      Promise<Trip> {
        try {
          const updateData: any = {}

          if (tripData.title !== undefined) {
            updateData.title = tripData.title
          }

          // 如果有任何行程数据字段需要更新，构建 trip_data 对象
          if (tripData.description !== undefined ||
              tripData.startDate !== undefined ||
              tripData.endDate !== undefined || tripData.budget !== undefined ||
              tripData.participants !== undefined ||
              tripData.preferences !== undefined) {
            updateData.trip_data = {}

            if (tripData.title !== undefined) {
              updateData.trip_data.title = tripData.title
            }
            if (tripData.description !== undefined) {
              updateData.trip_data.description = tripData.description
            }
            if (tripData.startDate !== undefined) {
              updateData.trip_data.startDate = tripData.startDate
            }
            if (tripData.endDate !== undefined) {
              updateData.trip_data.endDate = tripData.endDate
            }
            if (tripData.budget !== undefined) {
              updateData.trip_data.budget = tripData.budget
            }
            if (tripData.participants !== undefined) {
              updateData.trip_data.participants = tripData.participants
            }
            if (tripData.preferences !== undefined) {
              updateData.trip_data.preferences =
                  tripData.preferences ? JSON.parse(tripData.preferences) : null
            }
          }

          const response =
              await api.put<BackendTrip>(`/trips/${tripId}`, updateData)
          return transformBackendTrip(response.data)
        } catch (error) {
          console.error(`更新行程失败 (ID: ${tripId}):`, error)
          throw error
        }
      },
  // 删除行程
  async deleteTrip(tripId: number): Promise<void> {
    try {
      await api.delete(`/trips/${tripId}`)
    } catch (error) {
      console.error(`删除行程失败 (ID: ${tripId}):`, error)
      throw error
    }
  }
}

export default tripService