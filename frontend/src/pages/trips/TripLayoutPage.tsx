import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Users, DollarSign, MapPin, ArrowLeft, Loader, Clock, Navigation, Trash2 } from 'lucide-react'
import tripService from '../../services/tripService'
import { Trip, Activity } from '../../types'

// 按天分组的活动类型
interface DayGroup {
  date: string
  displayDate: string
  activities: Activity[]
}

const TripLayoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; tripId: number | null; tripTitle: string }>({
    show: false,
    tripId: null,
    tripTitle: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        setError(null)
        const tripData = await tripService.getTripById(parseInt(id))
        setTrip(tripData)
        
        // 按天分组活动
        if (tripData.activities && tripData.activities.length > 0) {
          const grouped = groupActivitiesByDay(tripData.activities)
          setDayGroups(grouped)
        }
      } catch (err: any) {
        console.error('获取行程详情失败:', err)
        
        // 检查是否为JSON解析错误
        if (err.message?.includes('JSON') || err.message?.includes('解析') ||
            err.response?.data?.includes('JSON') || err.response?.data?.includes('解析')) {
          setError('行程数据格式错误，无法解析JSON数据。请检查行程数据格式或联系管理员。')
        } else if (err.response?.status === 404) {
          setError('行程不存在或已被删除')
        } else if (err.response?.status === 401) {
          setError('登录已过期，请重新登录')
        } else {
          setError('获取行程详情失败，请检查网络连接或重新登录')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [id])

  // 按天分组活动
  const groupActivitiesByDay = (activities: Activity[]): DayGroup[] => {
    const groups: { [key: string]: Activity[] } = {}
    
    activities.forEach(activity => {
      if (!activity.startTime) return
      
      const date = new Date(activity.startTime)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })

    // 转换为数组并按日期排序
    return Object.entries(groups)
      .map(([dateKey, activities]) => ({
        date: dateKey,
        displayDate: new Date(dateKey).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        }),
        activities: activities.sort((a, b) => {
          if (!a.startTime || !b.startTime) return 0
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const getStatusText = (status?: string) => {
    const statusMap: { [key: string]: string } = {
      'planning': '规划中',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status || 'planning'] || status || '规划中'
  }

  const getStatusColor = (status?: string) => {
    const colorMap: { [key: string]: string } = {
      'planning': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colorMap[status || 'planning'] || 'bg-blue-100 text-blue-800'
  }

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
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
      
      // 删除成功后返回首页
      navigate('/home')
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">正在加载行程详情...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-6">{error || '行程不存在'}</p>
          <button
            onClick={() => navigate('/home')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>返回行程列表</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">{trip.title}</h1>
              {trip.description && (
                <p className="text-gray-600 text-sm">{trip.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDeleteTrip(trip.id, trip.title)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="删除行程"
            >
              <Trash2 size={18} />
            </button>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
              {getStatusText(trip.status)}
            </span>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
              <span>({getDays(trip.startDate, trip.endDate)}天)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 左右分栏 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧行程列表 */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* 基本信息卡片 - 固定高度 */}
          <div className="p-6 pb-0 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">出行人数</p>
                    <p className="font-medium text-gray-900">{trip.participants || 0}人</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-500">预算</p>
                    <p className="font-medium text-gray-900">¥{trip.budget?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 滚动列表区域 */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {/* 按天分组的活动列表 */}
            {dayGroups.length > 0 ? (
              <div className="space-y-4">
                {dayGroups.map((dayGroup, dayIndex) => (
                  <div key={dayGroup.date} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* 日期标题 */}
                    <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-blue-900">
                          第 {dayIndex + 1} 天 · {dayGroup.displayDate}
                        </h3>
                        <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {dayGroup.activities.length} 个活动
                        </span>
                      </div>
                    </div>
                    
                    {/* 当天活动列表 */}
                    <div className="divide-y divide-gray-100">
                      {dayGroup.activities.map((activity, activityIndex) => (
                        <div
                          key={activity.id}
                          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedActivity?.id === activity.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleActivityClick(activity)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-medium text-sm">
                                {activityIndex + 1}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                  {activity.title}
                                </h4>
                                {activity.startTime && (
                                  <div className="flex items-center space-x-1 text-gray-500 text-sm flex-shrink-0 ml-2">
                                    <Clock size={14} />
                                    <span>{formatTime(activity.startTime)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {activity.description && (
                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                  {activity.description}
                                </p>
                              )}
                              
                              {activity.location && (
                                <div className="flex items-center space-x-1 text-gray-500 text-sm">
                                  <MapPin size={14} />
                                  <span className="truncate">{activity.location}</span>
                                </div>
                              )}
                              
                              {activity.cost && (
                                <div className="mt-2 text-sm">
                                  <span className="text-green-600 font-medium">
                                    ¥{activity.cost.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活动安排</h3>
                <p className="text-gray-500">此行程还没有具体的活动安排</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧地图区域 */}
        <div className="flex-1 bg-white">
          <div className="h-full flex flex-col">
            {/* 地图标题栏 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedActivity ? selectedActivity.title : '行程地图'}
                </h2>
                {selectedActivity && (
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    清除选择
                  </button>
                )}
              </div>
              
              {selectedActivity && (
                <div className="mt-2">
                  {selectedActivity.description && (
                    <p className="text-gray-600 text-sm mb-1">{selectedActivity.description}</p>
                  )}
                  {selectedActivity.location && (
                    <div className="flex items-center space-x-1 text-gray-500 text-sm">
                      <MapPin size={14} />
                      <span>{selectedActivity.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 地图容器 */}
            <div className="flex-1 bg-gray-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">地图功能</h3>
                  <p className="text-gray-600 max-w-md">
                    {selectedActivity 
                      ? `正在显示 "${selectedActivity.title}" 的位置`
                      : '点击左侧活动查看地图位置'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    地图集成功能正在开发中...
                  </p>
                </div>
              </div>
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

export default TripLayoutPage