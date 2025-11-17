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

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  // 应用启动时检查认证状态
  useEffect(() => {
    checkAuth()
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
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/home" />} />
        
        {/* 受保护路由 */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/home" />} />
          <Route path="home" element={<HomePage />} />
          <Route path="trips/:id" element={<TripLayoutPage />} />
          <Route path="plan" element={<AITripPlanningPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/api-keys" element={<ApiKeysPage />} />
        </Route>
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App