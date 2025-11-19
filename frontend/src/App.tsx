import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import HomePage from './pages/home/HomePage'
import TripLayoutPage from './pages/trips/TripLayoutPage'
import AITripPlanningPage from './pages/trips/AITripPlanningPage'
import SettingsPage from './pages/settings/SettingsPage'
import ApiKeysPage from './pages/settings/ApiKeysPage'
import ChatPage from './pages/chat/ChatPage'
import SearchPage from './pages/search/SearchPage'
import { ROUTES } from './config/routes'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  // 添加调试日志
  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)

  // 应用启动时检查认证状态
  useEffect(() => {
    console.log('App mounted - initializing auth check...')
    const authStorage = localStorage.getItem('auth-storage')
    const token = localStorage.getItem('token')
    console.log('auth-storage in localStorage:', authStorage)
    console.log('token in localStorage:', token)
    
    // 延迟执行checkAuth，确保Zustand持久化完成
    const timer = setTimeout(() => {
      console.log('App useEffect - checking auth...')
      checkAuth()
    }, 300)  // 增加延迟时间，确保Zustand完全恢复
    
    return () => clearTimeout(timer)
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">AI旅行规划师</h2>
          <p className="text-gray-600 mt-2">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* 公开路由 */}
        <Route path={ROUTES.LOGIN} element={!isAuthenticated ? <LoginPage /> : <Navigate to={ROUTES.HOME} />} />
        <Route path={ROUTES.REGISTER} element={!isAuthenticated ? <RegisterPage /> : <Navigate to={ROUTES.HOME} />} />
        
        {/* 受保护路由 */}
        <Route path={ROUTES.DEFAULT} element={isAuthenticated ? <Layout /> : <Navigate to={ROUTES.LOGIN} />}>
          <Route index element={<Navigate to={ROUTES.HOME} />} />
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.TRIP_DETAIL} element={<TripLayoutPage />} />
          <Route path={ROUTES.AI_PLANNING} element={<AITripPlanningPage />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.API_KEYS} element={<ApiKeysPage />} />
        </Route>
        
        {/* 默认重定向 */}
        <Route path={ROUTES.WILDCARD} element={<Navigate to={isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN} />} />
      </Routes>
    </Router>
  )
}

export default App