import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Users, DollarSign, MapPin, ArrowLeft, Loader, Clock, Trash2, Search } from 'lucide-react'
import tripService from '../../services/tripService'
import { leafletService, PlaceSearchResult, RoutePlanResult } from '../../services/leafletService'
import MapComponent from '../../components/MapComponent'
import { Trip, Activity, MapMarker, MapLocation } from '../../types'

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
  const [selectedLocations, setSelectedLocations] = useState<MapMarker[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; tripId: number | null; tripTitle: string }>({
    show: false,
    tripId: null,
    tripTitle: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 从MapComponent迁移的状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPlanningRoute, setIsPlanningRoute] = useState(false)
  const [routeResult, setRouteResult] = useState<RoutePlanResult | null>(null)

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        setError(null)
        const tripData = await tripService.getTripById(parseInt(id))
        setTrip(tripData)
        
        // 按天分组活动
        if (tripData.activities && Array.isArray(tripData.activities) && tripData.activities.length > 0) {
          const grouped = groupActivitiesByDay(tripData.activities)
          setDayGroups(grouped)
        } else {
          setDayGroups([])
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

  // 获取行程的第一个活动国家代码
  const getFirstActivityCountryCode = (): string | null => {
    if (!trip?.activities || trip.activities.length === 0) {
      return null
    }
    
    try {
      // 按开始时间排序，找到第一个活动
      const sortedActivities = [...trip.activities].sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      })
      
      return sortedActivities[0]?.countryCode || null
    } catch (error) {
      console.error('获取国家代码失败:', error)
      return null
    }
  }

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
    
    // 如果活动有地址，自动触发搜索
    if (activity.location) {
      // 只清除搜索结果，保留已选择的地点
      setSearchResults([])
      setRouteResult(null)
      
      // 设置搜索关键词为活动地址
      setSearchKeyword(activity.location)
      
      // 延迟执行搜索，确保状态已更新
      setTimeout(() => {
        handleSearchSpecificPlace(activity.location || '', activity.countryCode || undefined)
      }, 100)
    }
  }

  const handleLocationSelected = (marker: MapMarker) => {
    setSelectedLocations(prev => {
      // 检查是否已经选择了该地点
      const isAlreadySelected = prev.some(loc => loc.id === marker.id);
      if (isAlreadySelected) {
        // 如果已经选择，则取消选择
        const filtered = prev.filter(loc => loc.id !== marker.id);
        
        // 清除所有标记并重新添加剩余的选中标记
        leafletService.clearMarkers();
        filtered.forEach(loc => {
          const location: MapLocation = {
            lng: loc.lng,
            lat: loc.lat
          }
          leafletService.addMarker(location, loc.title, loc.description || undefined, false);
        });
        
        return filtered;
      } else {
        // 如果未选择，则添加
        return [...prev, marker];
      }
    });
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

  const handleClearAllLocations = () => {
    setSelectedLocations([])
    setRouteResult(null)
    try {
      leafletService.clearSelectedMarkers()
    } catch (error) {
      console.error('清除选中标记失败:', error)
    }
  }

  const handleGenerateRoute = async (selectedLocationsForRoute?: MapMarker[]): Promise<RoutePlanResult> => {
    const locations = selectedLocationsForRoute || selectedLocations;
    
    if (locations.length < 2) {
      const errorResult: RoutePlanResult = {
        status: 'error',
        message: '请至少选择2个地点进行路线规划'
      };
      alert('请至少选择2个地点进行路线规划');
      return errorResult;
    }
    
    setIsPlanningRoute(true)
    try {
      console.log('开始规划路线，选中地点:', locations)
      // 将MapLocation数组转换为路线规划需要的格式
      const waypoints = locations.map(loc => ({
        lng: loc.lng,
        lat: loc.lat
      }))
      const result = await leafletService.planDrivingRoute(waypoints)
      console.log('路线规划结果:', result)
      setRouteResult(result)
      
      if (result.status === 'success') {
        console.log('路线规划成功，距离:', result.distance, '时间:', result.time)
        // 路线规划成功后，地图会自动显示路线，因为leaflet-routing-machine已经添加到地图上
      } else {
        console.log('路线规划失败:', result.message)
      }
      return result;
    } catch (error) {
      console.error('路线规划失败:', error)
      const errorResult: RoutePlanResult = {
        status: 'error',
        message: '路线规划失败: ' + (error as Error).message
      };
      alert('路线规划失败，请重试')
      return errorResult;
    } finally {
      setIsPlanningRoute(false)
    }
  }

  // 搜索特定活动地点
  const handleSearchSpecificPlace = async (placeName: string, countryCode?: string | undefined) => {
    if (!placeName.trim()) return

    setIsSearching(true)
    try {
      const results = await leafletService.searchPlaces(placeName, undefined, countryCode || undefined)
      setSearchResults(results)
      
      // 只清除搜索结果标记，保留已选择的地点标记
      // 通过清除所有标记然后重新添加已选择的地点来保持状态
      const currentSelectedLocations = [...selectedLocations];
      leafletService.clearMarkers()
      
      // 重新显示已选择的地点
      currentSelectedLocations.forEach(loc => {
        const location: MapLocation = {
          lng: loc.lng,
          lat: loc.lat
        }
        leafletService.addMarker(location, loc.title, loc.description || undefined, false)
      })
      
      // 为搜索结果添加标记
      results.forEach((result: PlaceSearchResult) => {
        const location: MapLocation = {
          lng: result.location.lng,
          lat: result.location.lat
        }
        leafletService.addMarker(location, result.name, result.address, true)
      })

      // 如果只有一个结果，自动聚焦到该位置
      if (results.length === 1) {
        const result = results[0]
        leafletService.setCenter(result.location.lng, result.location.lat, 15)
      }
    } catch (error) {
      console.error('搜索活动地点失败:', error)
      alert('搜索失败，请检查网络连接或API配置')
    } finally {
      setIsSearching(false)
    }
  }

  // 搜索地点
  const handleSearchPlaces = async () => {
    if (!searchKeyword.trim()) return

    setIsSearching(true)
    try {
      // 从活动位置中提取城市信息（如果包含城市）
      let city: string | undefined;
      if (searchKeyword.includes(',')) {
        const parts = searchKeyword.split(',');
        if (parts.length > 1) {
          city = parts[parts.length - 1].trim();
        }
      }
      
      const results = await leafletService.searchPlaces(searchKeyword, city, getFirstActivityCountryCode() || undefined)
      setSearchResults(results)
      
      // 只清除搜索结果标记，保留已选择的地点标记
      const currentSelectedLocations = [...selectedLocations];
      leafletService.clearMarkers()
      
      // 重新显示已选择的地点
      currentSelectedLocations.forEach(loc => {
        const location: MapLocation = {
          lng: loc.lng,
          lat: loc.lat
        }
        leafletService.addMarker(location, loc.title, loc.description || undefined, false)
      })
      
      // 为搜索结果添加标记
      results.forEach((result: PlaceSearchResult) => {
        const location: MapLocation = {
          lng: result.location.lng,
          lat: result.location.lat
        }
        leafletService.addMarker(location, result.name, result.address, true)
      })

      // 如果只有一个结果，自动聚焦到该位置
      if (results.length === 1) {
        const result = results[0]
        leafletService.setCenter(result.location.lng, result.location.lat, 15)
      }
    } catch (error) {
      console.error('搜索地点失败:', error)
      alert('搜索失败，请检查网络连接或API配置')
    } finally {
      setIsSearching(false)
    }
  }

  // 清除搜索
  const handleClearSearch = () => {
    setSearchKeyword('')
    setSearchResults([])
    try {
      leafletService.clearMarkers()
      
      // 重新显示已选择的地点标记
      if (selectedLocations.length > 0) {
        selectedLocations.forEach(loc => {
          const location: MapLocation = {
            lng: loc.lng,
            lat: loc.lat
          }
          leafletService.addMarker(location, loc.title, loc.description || undefined, false)
        })
      } else if (selectedActivity) {
        // 如果没有已选择的地点，才显示活动标记
        const location: MapLocation = {
          lng: selectedActivity.longitude || 116.397428,
          lat: selectedActivity.latitude || 39.90923
        }
        leafletService.addMarker(location, selectedActivity.title, selectedActivity.description || undefined, true)
      }
    } catch (error) {
      console.error('清除搜索失败:', error)
    }
  }

  // 清除路线 - 只清除路线，保留选中的地点
  const handleClearRoute = () => {
    setRouteResult(null)
    leafletService.clearRoute()
    
    // 不清除选中的地点，只清除路线
    // 选中的地点标记应该继续保持显示
    console.log('清除路线，保留选中的地点')
  }

  // 选择搜索结果中的地点
  const handleSelectSearchResult = (result: PlaceSearchResult) => {
    const marker: MapMarker = {
      id: `selected_${result.id}`,
      lng: result.location.lng,
      lat: result.location.lat,
      title: result.name,
      description: result.address,
      isSelectable: false
    };

    // 先清除搜索结果，避免后续操作被干扰
    setSearchResults([]);

    setSelectedLocations(prev => {
      // 检查是否已经选择了该地点
      const isAlreadySelected = prev.some(loc => loc.id === marker.id);
      if (isAlreadySelected) {
        // 如果已经选择，则取消选择
        const filtered = prev.filter(loc => loc.id !== marker.id);
        return filtered;
      } else {
        // 如果未选择，则添加
        const newSelectedLocations = [...prev, marker];
        return newSelectedLocations;
      }
    });

    // 地图自动跳转到选中的位置 - 延迟执行，等待状态更新
    setTimeout(() => {
      try {
        leafletService.setCenter(result.location.lng, result.location.lat, 15);
      } catch (error) {
        console.error('地图跳转失败:', error);
      }
    }, 100);
  }

  // 清除所有
  const handleClearAll = () => {
    setSearchResults([])
    setSelectedLocations([])
    setRouteResult(null)
    try {
      leafletService.clearRoute()
      leafletService.clearMarkers()
      leafletService.clearSelectedMarkers()
      
      // 重新显示活动标记
      if (selectedActivity) {
        const location: MapLocation = {
          lng: selectedActivity.longitude || 116.397428,
          lat: selectedActivity.latitude || 39.90923
        }
        leafletService.addMarker(location, selectedActivity.title, selectedActivity.description || undefined, true)
      }
    } catch (error) {
      console.error('清除所有标记失败:', error)
    }
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
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
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
            
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">{trip.title}</h1>
              {trip.description && (
                <p className="text-gray-600 text-sm truncate">{trip.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 flex-shrink-0">
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

      {/* 主要内容区域 - 两栏布局 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧活动列表 */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
          {/* 基本信息卡片 - 固定高度 */}
          <div className="p-4 pb-0 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">出行人数</p>
                    <p className="font-medium text-gray-900 text-sm truncate">{trip.participants || 0}人</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">预算</p>
                    <p className="font-medium text-gray-900 text-sm truncate">¥{trip.budget?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 滚动列表区域 */}
          <div className="flex-1 overflow-y-auto p-4 pt-3">
            {/* 按天分组的活动列表 */}
            {dayGroups.length > 0 ? (
              <div className="space-y-3">
                {dayGroups.map((dayGroup, dayIndex) => (
                  <div key={dayGroup.date} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* 日期标题 */}
                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-blue-900 text-sm">
                          第 {dayIndex + 1} 天
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-600">
                            {new Date(dayGroup.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                            {dayGroup.activities.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 当天活动列表 */}
                    <div className="divide-y divide-gray-100">
                      {dayGroup.activities.map((activity, activityIndex) => (
                        <div
                          key={activity.id}
                          className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedActivity?.id === activity.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleActivityClick(activity)}
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-medium text-xs">
                                {activityIndex + 1}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-gray-900 text-xs leading-tight truncate">
                                  {activity.title}
                                </h4>
                                {activity.startTime && (
                                  <div className="flex items-center space-x-1 text-gray-500 text-xs flex-shrink-0 ml-1">
                                    <Clock size={12} />
                                    <span className="whitespace-nowrap">{formatTime(activity.startTime)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {activity.description && (
                                <p className="text-gray-600 text-xs mb-1 line-clamp-1">
                                  {activity.description}
                                </p>
                              )}
                              
                              {activity.location && (
                                <div className="flex items-center space-x-1 text-gray-500 text-xs">
                                  <MapPin size={10} />
                                  <span className="truncate">{activity.location}</span>
                                </div>
                              )}
                              
                              {activity.cost && (
                                <div className="mt-1 text-xs">
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
              <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">暂无活动安排</h3>
                <p className="text-gray-500 text-xs">此行程还没有具体的活动安排</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧地图区域 */}
        <div className="flex-1 bg-white flex">
          {/* 地图容器 */}
          <div className="flex-1 bg-gray-100 min-h-0">
            <MapComponent
              containerId={`trip-map-${id || 'default'}`}
              activities={selectedActivity ? [selectedActivity] : []}
              selectedActivity={selectedActivity}
              externalSelectedLocations={selectedLocations}  // 传递已选择的地点
              externalRouteResult={routeResult}  // 传递路线规划结果
              onLocationSelected={handleLocationSelected}
              onRequestRoutePlan={handleGenerateRoute}  // 传递路线规划回调
              height="100%"
              showControls={false}  // 禁用MapComponent的控制面板
              countryCode={getFirstActivityCountryCode()}
            />
          </div>
          
          {/* 右侧信息面板 */}
          <div className="w-72 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
            {/* 搜索功能 */}
            <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-900 mb-2">搜索地点</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索地点..."
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchPlaces()}
                />
                <button
                  onClick={handleSearchPlaces}
                  disabled={isSearching}
                  className="px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-xs"
                >
                  {isSearching ? '搜索中' : '搜索'}
                </button>
                <button
                  onClick={handleClearSearch}
                  className="px-2 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs"
                >
                  清除
                </button>
              </div>
            </div>
            
            {/* 内容区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">搜索结果 ({searchResults.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-2 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleSelectSearchResult(result)}
                      >
                        <div className="font-medium text-xs truncate">{result.name}</div>
                        <div className="text-gray-600 text-xs truncate">{result.address}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{result.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 选中的地点列表 */}
              <div className="px-4 py-3">
                {selectedLocations.length > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h4 className="font-medium text-blue-900 mb-1 text-sm">已选择的地点 ({selectedLocations.length})</h4>
                      <p className="text-blue-700 text-xs">点击地点可移除选择</p>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedLocations.map((location, index) => (
                        <div key={location.id} className="bg-white border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-medium text-xs">{index + 1}</span>
                                </div>
                                <h5 className="font-medium text-gray-900 text-xs truncate">{location.title}</h5>
                              </div>
                              {location.description && (
                                <p className="text-gray-600 text-xs mb-1 truncate">{location.description}</p>
                              )}
                              {location.description && (
                                <div className="flex items-center space-x-1 text-gray-500 text-xs">
                                  <MapPin size={10} />
                                  <span className="truncate">{location.description}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleLocationSelected(location)}
                              className="text-red-500 hover:text-red-700 text-xs p-1 ml-2 flex-shrink-0"
                              title="移除地点"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 路线规划结果 */}
                    {routeResult && (
                      <div className={`p-3 rounded-md ${
                        routeResult.status === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <h4 className="font-medium mb-1 text-sm">
                          {routeResult.status === 'success' ? '路线规划成功' : '路线规划失败'}
                        </h4>
                        {routeResult.status === 'success' && (
                          <div className="text-xs space-y-1">
                            {routeResult.distance && (
                              <div>距离: {(routeResult.distance / 1000).toFixed(1)}公里</div>
                            )}
                            {routeResult.time && (
                              <div>时间: {Math.ceil(routeResult.time / 60)}分钟</div>
                            )}
                            {routeResult.tolls && (
                              <div>过路费: ¥{routeResult.tolls}</div>
                            )}
                          </div>
                        )}
                        {routeResult.status === 'error' && (
                          <div className="text-red-700 text-xs">{routeResult.message}</div>
                        )}
                      </div>
                    )}
                    
                    {/* 导航操作按钮 */}
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleGenerateRoute()}
                        disabled={isPlanningRoute || selectedLocations.length < 2}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-md transition-colors disabled:bg-gray-400 text-xs"
                      >
                        {isPlanningRoute ? '规划中...' : '规划路线'}
                      </button>
                      <button
                        onClick={handleClearRoute}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-3 rounded-md transition-colors text-xs"
                      >
                        清除路线
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      搜索地点或选择地点
                    </h3>
                    <p className="text-gray-500 text-xs">
                      {selectedActivity
                        ? `已选择活动"${selectedActivity.title}"，正在搜索相关地点...`
                        : '点击左侧活动自动搜索地点，或使用上方搜索框搜索地点，或在地图上点击地点图标来选择地点'}
                    </p>
                  </div>
                )}
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