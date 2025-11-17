import React from 'react'
import { useNavigate } from 'react-router-dom'

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>
        
        <div className="space-y-6">
          {/* 账户设置 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">账户设置</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">个人信息</div>
                <div className="text-sm text-gray-500">管理您的个人资料信息</div>
              </button>
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">修改密码</div>
                <div className="text-sm text-gray-500">更新您的登录密码</div>
              </button>
            </div>
          </div>

          {/* API密钥设置 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API密钥管理</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/settings/api-keys')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-gray-900">API密钥配置</div>
                <div className="text-sm text-gray-500">配置高德地图、OpenAI等API密钥</div>
              </button>
            </div>
          </div>

          {/* 应用设置 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">应用设置</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">通知设置</div>
                <div className="text-sm text-gray-500">管理应用通知偏好</div>
              </button>
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">隐私设置</div>
                <div className="text-sm text-gray-500">管理您的隐私偏好</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage