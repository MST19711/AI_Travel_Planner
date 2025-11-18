import {create} from 'zustand'
import {persist} from 'zustand/middleware'

import {authService} from '../services/authService'
import {AuthState, User} from '../types'

interface AuthStore extends AuthState {
  login: (token: string, user: User) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: true,
      token: null,
      user: null,

      login: async (token: string, user: User) => {
  try {
    // 对于不安全的登录方式，直接设置认证状态，不进行token验证
    // 因为验证接口可能尚未实现或存在网络问题
    set({
      isAuthenticated: true,
      token,
      user,
      isLoading: false,
    })
    // 同时将token存储到localStorage，确保axios拦截器能获取到
    localStorage.setItem('token', token)
    localStorage.setItem('access_token', token)  // 确保兼容性
  } catch (error) {
    set({
      isAuthenticated: false,
      token: null,
      user: null,
      isLoading: false,
    })
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
    throw error
  }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          isLoading: false,
        })
// 同时清除localStorage中的token
localStorage.removeItem('token')
        localStorage.removeItem('access_token')
      },

      checkAuth: async () => {
  const {token, user} = get()

  console.log('checkAuth called, token from zustand:', token, 'user:', user)

  // 如果zustand中没有token，尝试从localStorage恢复
  let actualToken = token
  if (!actualToken) {
    actualToken =
        localStorage.getItem('token') || localStorage.getItem('access_token')
    console.log('Token from localStorage:', actualToken)

    if (actualToken) {
      // 从localStorage恢复状态
      const savedUser = localStorage.getItem('user')
      const userData = savedUser ? JSON.parse(savedUser) : null

      set({
        isAuthenticated: true,
        token: actualToken,
        user: userData || user,
        isLoading: false,
      })
      console.log('Restored auth state from localStorage')
    }
  }

  if (!actualToken || !user) {
    console.log('No token or user found, setting isLoading to false')
    set({isLoading: false})
    return
  }

  try {
    console.log('Verifying token with backend...')
    const isValid = await authService.verifyToken(actualToken)
    console.log('Token verification result:', isValid)
    if (!isValid) {
      console.log('Token is invalid, logging out')
      get().logout()
    }
    else {
      console.log('Token is valid, user remains authenticated')
    }
  } catch (error) {
    console.log('Token verification failed:', error)
    get().logout()
  } finally {
    set({isLoading: false})
  }
      },

      updateUser: (userData: Partial<User>) => {
  const {user} = get()
  if (user) {
    const updatedUser = {...user, ...userData};
    set({user: updatedUser})
  }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      } as any),
    }
  )
)