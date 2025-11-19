import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { ApiKeys } from '../../types'
import userService from '../../services/userService'

const ApiKeysPage: React.FC = () => {
  const { user: _user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openaiBaseUrl: 'https://api.deepseek.com',
    openaiModel: 'deepseek-chat'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const keys = await userService.getApiKeys()
      setApiKeys(keys)
    } catch (error) {
      console.error('获取API密钥失败:', error)
      setMessage('获取API密钥失败')
    }
  }

  const handleSave = async (section: string) => {
    setIsLoading(true)
    setMessage('')

    try {
      await userService.updateApiKeys(apiKeys)
      setMessage(`${section}配置保存成功`)
    } catch (error) {
      console.error('保存API密钥失败:', error)
      setMessage('保存API密钥失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">API密钥配置</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* LLM API配置 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">大语言模型 (LLM) 配置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API密钥
                </label>
                <input
                  type="password"
                  value={apiKeys.openaiApiKey || ''}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  placeholder="请输入LLM API密钥"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API基础URL
                </label>
                <input
                  type="text"
                  value={apiKeys.openaiBaseUrl || 'https://api.deepseek.com'}
                  onChange={(e) => handleInputChange('openaiBaseUrl', e.target.value)}
                  placeholder="https://api.deepseek.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">默认使用DeepSeek API</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称
                </label>
                <input
                  type="text"
                  value={apiKeys.openaiModel || 'deepseek-chat'}
                  onChange={(e) => handleInputChange('openaiModel', e.target.value)}
                  placeholder="deepseek-chat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">默认使用deepseek-chat模型</p>
              </div>
              <button
                onClick={() => handleSave('LLM')}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>

          {/* 地图API说明 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">地图服务</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                本项目已切换至使用 <strong>Leaflet + OpenStreetMap</strong> 方案，这是一个完全免费且无需注册的地图服务。
              </p>
              <p className="text-blue-800 mt-2">
                OpenStreetMap是一个由全球志愿者共同维护的免费地图项目，类似于维基百科的地图版本。
              </p>
              <p className="text-blue-800 mt-2">
                无需配置任何API密钥即可使用地图的完整功能，包括地点搜索、标记和路线规划。
              </p>
              <p className="text-blue-800 mt-2">
                <strong>注意：</strong>公共交通路线规划功能正在开发中，目前暂不可用。
              </p>
            </div>
          </div>

          {/* 智谱AI API */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">智谱AI API</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API密钥
                </label>
                <input
                  type="password"
                  value={apiKeys.glmApiKey || ''}
                  onChange={(e) => handleInputChange('glmApiKey', e.target.value)}
                  placeholder="请输入智谱AI API密钥"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => handleSave('智谱AI')}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>

          {/* 讯飞语音API */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">讯飞语音API</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App ID
                </label>
                <input
                  type="password"
                  value={apiKeys.xunfeiAppId || ''}
                  onChange={(e) => handleInputChange('xunfeiAppId', e.target.value)}
                  placeholder="请输入讯飞语音App ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret
                </label>
                <input
                  type="password"
                  value={apiKeys.xunfeiApiSecret || ''}
                  onChange={(e) => handleInputChange('xunfeiApiSecret', e.target.value)}
                  placeholder="请输入讯飞语音API Secret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.xunfeiApiKey || ''}
                  onChange={(e) => handleInputChange('xunfeiApiKey', e.target.value)}
                  placeholder="请输入讯飞语音API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => handleSave('讯飞语音')}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeysPage