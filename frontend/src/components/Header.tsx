import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 
  MapPin, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = () => {
    navigate('/search')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const handleProfile = () => {
    navigate('/settings')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo和标题 */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex items-center ml-4 lg:ml-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">
                AI旅行规划师
              </h1>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-left text-gray-500 hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                搜索目的地、景点、美食...
              </button>
            </div>
          </div>

          {/* 右侧功能区 */}
          <div className="flex items-center space-x-4">
            {/* 通知按钮 */}
            <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <Bell size={20} />
            </button>

            {/* 用户头像和菜单 */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.username}
                </span>
              </button>

              {/* 下拉菜单 */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleProfile}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User size={16} className="mr-2" />
                    个人资料
                  </button>
                  <button
                    onClick={handleSettings}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings size={16} className="mr-2" />
                    设置
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-2" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-2">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                我的行程
              </button>
              <button
                onClick={() => navigate('/plan')}
                className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                AI规划
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                智能聊天
              </button>
              <button
                onClick={() => navigate('/search')}
                className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                搜索
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header