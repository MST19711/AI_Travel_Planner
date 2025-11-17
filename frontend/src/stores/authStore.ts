import {create} from 'zustand'
import {persist} from 'zustand/middleware'

import {authService} from '../services/authService'
import {AuthState, User} from '../types'

    interface AuthStore extends AuthState {login: (token: string, user: User) => Promise <void>; logout : () => void; checkAuth : () => Promise <void>; updateUser : (user: Partial <User>) => void}

export const useAuthStore = create <AuthStore>()(persist((set, get) => ({isAuthenticated : false, isLoading : true, token : null, user : null,

                                                                         login : async (token: string, user: User) => {
        try {
          // 对于不安全的登录方式，直接设置认证状态，不进行token验证
          // 因为验证接口可能尚未实现或存在网络问题
          set({
            isAuthenticated: true,
            token,
            user,
            isLoading: false,
          })
        } catch (error) {
          set({
            isAuthenticated: false,
            token: null,
            user: null,
            isLoading: false,
          })
          throw error
        }
                                                                         },

                                                                         logout : () => {set({isAuthenticated : false, token : null, user : null, isLoading : false,})},

                                                                         checkAuth : async () => {
        const { token, user } = get()

        if (!token || !user) {
          set({ isLoading: false })
          return
        }

        try {
          const isValid = await authService.verifyToken(token)
          if (!isValid) {
            get().logout()
          }
        } catch (error) {
          get().logout()
        } finally {
          set({ isLoading: false })
        }
                                                                         },

                                                                         updateUser : (userData: Partial <User>) => {
        const { user } = get()
        if (user) {
          const updatedUser = { ...user, ...userData }
          set({ user: updatedUser })
        }
                                                                         },}), {name : 'auth-storage', partialize : (state) => ({isAuthenticated : state.isAuthenticated, token : state.token, user : state.user,}),}))