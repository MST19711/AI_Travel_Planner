import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { RegisterRequest } from '../../types'
import { MapPin, User, Mail, Lock, AlertCircle, Shield } from 'lucide-react'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
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

    // 验证密码确认
    if (formData.password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }

    // 验证密码强度
    if (formData.password.length < 6) {
      setError('密码长度至少6位')
      setIsLoading(false)
      return
    }

    try {
      if (authMethod === 'srp') {
        setError('SRP认证功能正在开发中，请使用不安全密码传输')
        setIsLoading(false)
        return
      }

      await authService.register(formData)
      
      // 注册成功后跳转到登录页面
      navigate('/login', {
        state: {
          message: '注册成功！请使用您的账号登录',
          username: formData.username
        }
      })
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">注册账号</h1>
          <p className="text-gray-600">创建您的AI旅行规划师账号</p>
        </div>

        {/* 注册表单 */}
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

            {/* 邮箱输入框 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="请输入邮箱地址"
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
                  placeholder="请输入密码（至少6位）"
                />
              </div>
            </div>

            {/* 确认密码输入框 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="请再次输入密码"
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

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  注册中...
                </div>
              ) : (
                '注册'
              )}
            </button>

            {/* 登录链接 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                已有账号？{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage