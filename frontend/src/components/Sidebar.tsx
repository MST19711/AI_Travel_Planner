import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  MessageSquare,
  Search,
  Settings,
  PlusCircle
} from 'lucide-react'
import { NAV_ROUTES } from '../config/routes'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      name: '我的行程',
      path: NAV_ROUTES.HOME,
      icon: Home,
      description: '查看和管理您的旅行计划'
    },
    {
      name: 'AI规划',
      path: NAV_ROUTES.AI_PLANNING,
      icon: PlusCircle,
      description: '智能生成旅行计划'
    },
    {
      name: '智能聊天',
      path: NAV_ROUTES.CHAT,
      icon: MessageSquare,
      description: '与AI助手对话获取建议'
    },
    {
      name: '搜索',
      path: NAV_ROUTES.SEARCH,
      icon: Search,
      description: '搜索目的地和景点信息'
    },
    {
      name: '设置',
      path: NAV_ROUTES.SETTINGS,
      icon: Settings,
      description: '管理账户和API配置'
    }
  ]

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="p-6 overflow-y-auto h-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">导航菜单</h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon 
                  size={20} 
                  className={active ? 'text-blue-600' : 'text-gray-400'} 
                />
                <div className="flex-1">
                  <div className={`font-medium ${
                    active ? 'text-blue-800' : 'text-gray-900'
                  }`}>
                    {item.name}
                  </div>
                  <div className={`text-xs ${
                    active ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* 快速操作 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            快速操作
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={() => navigate(NAV_ROUTES.AI_PLANNING)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusCircle size={18} />
              <span className="font-medium">创建新行程</span>
            </button>
            
            <button
              onClick={() => navigate(NAV_ROUTES.SEARCH)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Search size={18} />
              <span className="font-medium">搜索目的地</span>
            </button>
          </div>
        </div>

      </div>
    </aside>
  )
}

export default Sidebar