import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'
import { LoginRequest } from '../../types'
import { MapPin, User, Lock, AlertCircle, Shield } from 'lucide-react'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [authMethod, setAuthMethod] = useState<'insecure' | 'srp'>('insecure')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (authMethod === 'srp') {
        setError('SRP认证功能正在开发中，请使用不安全密码传输')
        setIsLoading(false)
        return
      }

      const response = await authService.login(formData)
      // 确保token正确存储到zustand和localStorage
      await login(response.access_token, {
        id: 0, // 后端暂时不返回用户ID，使用默认值
        username: response.username,
        email: `${response.username}@example.com`, // 后端暂时不返回邮箱，使用默认值
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      
      navigate('/home')
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码')
    } finally {
      setIsLoading(false)
    }
  }

  const isSecureConnection = window.location.protocol === 'https:'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/标题区域 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI旅行规划师</h1>
          <p className="text-gray-600">智能规划您的完美旅程</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入框 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {/* 连接安全状态 */}
            <div className={`p-4 rounded-lg border ${
              isSecureConnection 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center">
                {isSecureConnection ? (
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${
                  isSecureConnection ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {isSecureConnection 
                    ? '安全连接 (HTTPS)' 
                    : '不安全连接 (HTTP) - 密码明文传输'
                  }
                </span>
              </div>
            </div>

            {/* 认证方式选择 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">认证方式</h3>
              
              {/* 不安全密码传输选项 */}
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  id="insecure"
                  name="authMethod"
                  checked={authMethod === 'insecure'}
                  onChange={() => setAuthMethod('insecure')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="insecure" className="ml-2 text-sm text-gray-700">
                  不安全密码传输
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-4 ml-6">
                密码明文传输（开发测试用）
                {!isSecureConnection && authMethod === 'insecure' && (
                  <span className="text-red-500 font-medium ml-1">
                    警告：当前连接不安全，密码可能被截获
                  </span>
                )}
              </p>

              {/* SRP认证选项 */}
              <div className="bg-gray-100 rounded p-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="srp"
                    name="authMethod"
                    checked={authMethod === 'srp'}
                    onChange={() => setAuthMethod('srp')}
                    className="text-blue-600 focus:ring-blue-500"
                    disabled
                  />
                  <label htmlFor="srp" className="ml-2 text-sm text-gray-500">
                    SRP安全认证
                  </label>
                </div>
                <p className="text-xs text-orange-600 ml-6 mt-1">
                  安全远程密码协议（开发中，敬请期待）
                </p>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  登录中...
                </div>
              ) : (
                '登录'
              )}
            </button>

            {/* 注册链接 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                还没有账号？{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  立即注册
                </Link>
              </p>
            </div>

            {/* 忘记密码 */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => alert('忘记密码功能开发中...')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                忘记密码？
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage