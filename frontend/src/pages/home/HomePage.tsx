import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Plus, MapPin, Calendar, Users, DollarSign, Loader, Trash2 } from 'lucide-react'
import tripService from '../../services/tripService'
import { Trip } from '../../types'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; tripId: number | null; tripTitle: string }>({
    show: false,
    tripId: null,
    tripTitle: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取行程数据
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const tripsData = await tripService.getTrips(1, 10)
        setTrips(tripsData)
      } catch (err) {
        console.error('获取行程列表失败:', err)
        setError('获取行程列表失败，请检查网络连接或重新登录')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrips()
  }, [])

  const handleCreateTrip = () => {
    navigate('/plan')
  }

  const handleViewTrip = (tripId: number) => {
    navigate(`/trips/${tripId}`)
  }

  const handleViewMap = (tripId: number) => {
    navigate(`/trips/${tripId}/map`)
  }

  const handleDeleteTrip = (tripId: number, tripTitle: string) => {
    setDeleteConfirm({
      show: true,
      tripId,
      tripTitle
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.tripId) return
    
    try {
      setIsDeleting(true)
      await tripService.deleteTrip(deleteConfirm.tripId)
      
      // 从列表中移除已删除的行程
      setTrips(trips.filter(trip => trip.id !== deleteConfirm.tripId))
      
      // 关闭确认对话框
      setDeleteConfirm({ show: false, tripId: null, tripTitle: '' })
    } catch (error) {
      console.error('删除行程失败:', error)
      alert('删除行程失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, tripId: null, tripTitle: '' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const getDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const getCountryName = (countryCode: string | null | undefined) => {
    if (!countryCode) return '未知'
    const countryNames: { [key: string]: string } = {
      'CN': '中国',
      'US': '美国',
      'JP': '日本',
      'KR': '韩国',
      'TH': '泰国',
      'SG': '新加坡',
      'MY': '马来西亚',
      'ID': '印度尼西亚',
      'VN': '越南',
      'PH': '菲律宾',
      'IN': '印度',
      'AU': '澳大利亚',
      'GB': '英国',
      'FR': '法国',
      'DE': '德国',
      'IT': '意大利',
      'ES': '西班牙',
      'CA': '加拿大',
      'BR': '巴西',
      'RU': '俄罗斯',
    }
    return countryNames[countryCode] || countryCode
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            欢迎回来，{user?.username}！
          </h1>
          <p className="text-blue-100 text-lg">
            准备好规划您的下一次精彩旅程了吗？
          </p>
          <button
            onClick={handleCreateTrip}
            className="mt-6 bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>创建新行程</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧用户信息和统计 */}
        <div className="lg:col-span-1">
          {/* 用户信息卡片 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.username}
                </h3>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">已规划行程</span>
                <span className="font-semibold text-gray-900">{trips.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">访问国家</span>
                <span className="font-semibold text-gray-900">
                  {new Set(trips.map(trip => trip.countryCode || '').filter(code => code !== '')).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总预算</span>
                <span className="font-semibold text-gray-900">
                  ¥{trips.reduce((sum, trip) => sum + (trip.budget || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/plan')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <span className="font-medium">AI智能规划</span>
                <Plus size={18} />
              </button>
              <button
                onClick={() => navigate('/search')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
              >
                <span className="font-medium">搜索目的地</span>
                <MapPin size={18} />
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                <span className="font-medium">智能聊天</span>
                <span className="text-lg">💬</span>
              </button>
            </div>
          </div>
        </div>

        {/* 右侧行程列表 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">我的行程</h2>
                <span className="text-gray-500">{trips.length} 个行程</span>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-500">正在加载行程数据...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
                  <p className="text-gray-500 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    重新加载
                  </button>
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">还没有行程</h3>
                  <p className="text-gray-500 mb-6">开始规划您的第一次旅行吧！</p>
                  <button
                    onClick={handleCreateTrip}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    创建第一个行程
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {trip.title}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {trip.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-500 mt-3">
                            <div className="flex items-center space-x-1">
                              <Calendar size={16} />
                              <span>
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span>{getDays(trip.startDate, trip.endDate)}天</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users size={16} />
                              <span>{trip.participants || 0}人</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign size={16} />
                              <span>¥{trip.budget?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin size={16} />
                              <span>{getCountryName(trip.countryCode)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleViewMap(trip.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="查看地图"
                          >
                            <MapPin size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id, trip.title)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除行程"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handleViewTrip(trip.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">删除行程</h3>
                <p className="text-gray-600 text-sm">此操作不可撤销</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              确定要删除行程 "<span className="font-semibold">{deleteConfirm.tripTitle}</span>" 吗？
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting && <Loader className="w-4 h-4 animate-spin" />}
                <span>{isDeleting ? '删除中...' : '确认删除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage