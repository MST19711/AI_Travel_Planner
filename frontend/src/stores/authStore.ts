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
      isLoading: true,  // 初始设置为true，等待状态恢复
      token: null,
      user: null,

      login: async (token: string, user: User) => {
  try {
    // 设置认证状态
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
// 清除localStorage中的token
localStorage.removeItem('token')
        localStorage.removeItem('access_token')
      },

      checkAuth: async () => {
  const {token, user} = get()

  console.log('checkAuth called, token from zustand:', token, 'user:', user)

  // 如果没有token或用户信息，设置为未认证状态
  if (!token || !user) {
    console.log('No token or user found, setting isLoading to false')
    set({isLoading: false})
    return
  }

  // 验证token有效性
  try {
    console.log('Verifying token with backend...')
    const isValid = await authService.verifyToken(token)
    console.log('Token verification result:', isValid)
    if (!isValid) {
      console.log('Token is invalid, logging out')
      get().logout()
    }
    else {
      console.log('Token is valid, user remains authenticated')
      // 确保localStorage中也有token
      localStorage.setItem('token', token)
      localStorage.setItem('access_token', token)
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
      // 不使用partialize，让Zustand持久化所有状态
      onRehydrateStorage: () => (state, error) => {
  console.log('Zustand rehydrating auth state:', state)
  if (error) {
    console.error('Zustand rehydration error:', error)
    return
  }

  // 当状态从localStorage恢复后，确保token也设置到localStorage中供axios使用
  if (state?.token && state?.user) {
    console.log('Setting token to localStorage:', state.token)
    localStorage.setItem('token', state.token)
    localStorage.setItem('access_token', state.token)

    // 确保isAuthenticated被正确设置
    if (!state.isAuthenticated) {
      console.log('Fixing isAuthenticated flag')
      // 在下一个tick中更新状态
      setTimeout(() => {
        const currentState = useAuthStore.getState()
        if (currentState.token && currentState.user &&
            !currentState.isAuthenticated) {
          useAuthStore.setState({isAuthenticated: true})
        }
      }, 0)
    }
  } else {
    console.log('No token or user found in rehydrated state')
  }
      },
    }
  )
)