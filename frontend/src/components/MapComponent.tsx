import React, { useEffect, useRef, useState } from 'react'
import { leafletService, PlaceSearchResult, RoutePlanResult } from '../services/leafletService'
import { MapMarker, MapLocation, Activity } from '../types'

interface MapComponentProps {
  containerId: string
  activities?: Activity[]
  selectedActivity?: Activity | null
  externalSelectedLocations?: MapMarker[]  // 新增：外部传入的已选择地点列表
  onLocationSelected?: (marker: MapMarker) => void
  onRoutePlanned?: (result: RoutePlanResult) => void
  height?: string
  showControls?: boolean
  countryCode?: string | null  // 新增：国家代码，用于设置地图默认中心
}

const MapComponent: React.FC<MapComponentProps> = ({
  containerId,
  activities = [],
  selectedActivity = null,
  externalSelectedLocations = [],
  onLocationSelected,
  onRoutePlanned,
  height = '100%',
  showControls = true,
  countryCode = null
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [selectedLocations, setSelectedLocations] = useState<MapMarker[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPlanningRoute, setIsPlanningRoute] = useState(false)
  const [routeResult, setRouteResult] = useState<RoutePlanResult | null>(null)
  const [containerReady, setContainerReady] = useState(false)

  // 使用ref来跟踪地图实例，避免重复初始化
  const mapInitializedRef = useRef(false)
  
  // 检查容器是否准备好
  useEffect(() => {
    const checkContainer = () => {
      if (mapContainerRef.current) {
        setContainerReady(true)
      }
    }
    
    // 立即检查
    checkContainer()
    
    // 如果容器还没准备好，等待一下再检查
    if (!containerReady) {
      const timer = setTimeout(checkContainer, 10)
      return () => clearTimeout(timer)
    }
  }, [])
  
  // 初始化地图
  useEffect(() => {
    if (!containerReady) return
    
    let isMounted = true
    
    const initMap = async () => {
      try {
        if (!isMounted || mapInitializedRef.current) return
        
        // 根据国家代码设置默认中心
        let center: [number, number] = [116.397428, 39.90923]; // 默认北京
        if (countryCode) {
          try {
            center = leafletService.getCountryCenter(countryCode);
          } catch (error) {
            console.warn('获取国家中心坐标失败，使用默认坐标:', error)
          }
        }
        
        // 等待地图完全初始化
        await leafletService.initializeMap(containerId, {
          zoom: 13,
          center: center
        })
        
        if (isMounted) {
          mapInitializedRef.current = true
          setIsMapReady(true)

          // 设置全局回调函数
          ;(window as any).onLocationSelected = (marker: MapMarker) => {
            if (isMounted) {
              setSelectedLocations(prev => [...prev, marker])
              onLocationSelected?.(marker)
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('初始化地图失败:', error)
          setIsMapReady(false)
          mapInitializedRef.current = false
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      
      // 先销毁地图，然后再重置标志
      try {
        leafletService.destroy()
      } catch (error) {
        console.error('清理地图时出错:', error)
      }
      
      // 最后重置初始化标志
      mapInitializedRef.current = false
    }
  }, [containerReady, containerId, onLocationSelected, countryCode])

  // 根据活动更新地图标记
  useEffect(() => {
    if (!isMapReady || !activities.length) return

    const updateMarkers = async () => {
      try {
        // 清除现有标记
        leafletService.clearMarkers()

        // 为每个活动添加标记
        for (const activity of activities) {
          if (activity.location) {
            // 这里可以添加地理编码逻辑，暂时使用默认坐标
            const location: MapLocation = {
              lng: activity.longitude || 116.397428,
              lat: activity.latitude || 39.90923
            }
            leafletService.addMarker(location, activity.title, activity.description || undefined, true)
          }
        }
      } catch (error) {
        console.error('更新地图标记失败:', error)
      }
    }

    updateMarkers()
  }, [isMapReady, activities])

  // 处理选中的活动
  useEffect(() => {
    if (!isMapReady) return
    
    if (!selectedActivity) {
      // 如果没有选中的活动，只清除搜索结果，保留已选择的地点
      setSearchResults([])
      return
    }

    if (selectedActivity.location) {
      // 搜索选中的活动地点，使用活动对应的国家代码
      const searchSelectedActivity = async () => {
        try {
          setIsSearching(true)
          const results = await leafletService.searchPlaces(
            selectedActivity.location!,
            undefined,
            selectedActivity.countryCode || undefined
          )
          setSearchResults(results)
          
          // 清除搜索结果标记，但保留已选择的地点
          leafletService.clearMarkers()
          
          // 重新显示已选择的地点
          if (selectedLocations.length > 0) {
            selectedLocations.forEach(loc => {
              const location: MapLocation = {
                lng: loc.lng,
                lat: loc.lat
              }
              leafletService.addMarker(location, loc.title, loc.description || undefined, false)
            })
          }
          
          // 为搜索结果添加标记
          for (const result of results) {
            const location: MapLocation = {
              lng: result.location.lng,
              lat: result.location.lat
            }
            leafletService.addMarker(location, result.name, result.address, true)
          }

          // 如果只有一个结果，自动聚焦到该位置
          if (results.length === 1) {
            const result = results[0]
            leafletService.setCenter(result.location.lng, result.location.lat, 15)
          }
        } catch (error) {
          console.error('搜索活动地点失败:', error)
        } finally {
          setIsSearching(false)
        }
      }
      
      searchSelectedActivity()
    }
  }, [isMapReady, selectedActivity?.id, selectedActivity?.location, selectedActivity?.countryCode, selectedLocations])

  // 监听外部传入的已选择地点变化，同步地图标记
  useEffect(() => {
    if (!isMapReady) return

    // 清除所有标记
    leafletService.clearMarkers()
    
    // 为外部传入的已选择地点添加标记
    if (externalSelectedLocations.length > 0) {
      externalSelectedLocations.forEach(loc => {
        const location: MapLocation = {
          lng: loc.lng,
          lat: loc.lat
        }
        leafletService.addMarker(location, loc.title, loc.description || undefined, false)
      })
    }
    
    // 更新内部状态
    setSelectedLocations(externalSelectedLocations)
  }, [isMapReady, externalSelectedLocations])

  // 搜索地点
  const handleSearchPlaces = async (keyword?: string, countryCode?: string | null) => {
    const searchTerm = keyword || searchKeyword
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      // 从活动位置中提取城市信息（如果包含城市）
      let city: string | undefined;
      if (searchTerm.includes(',')) {
        const parts = searchTerm.split(',');
        if (parts.length > 1) {
          city = parts[parts.length - 1].trim();
        }
      }
      
      const results = await leafletService.searchPlaces(searchTerm, city, countryCode || undefined)
      setSearchResults(results)
      
      // 清除现有标记
      leafletService.clearMarkers()
      
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
      
      // 重新显示已选择的地点
      if (selectedLocations.length > 0) {
        selectedLocations.forEach(loc => {
          const location: MapLocation = {
            lng: loc.lng,
            lat: loc.lat
          }
          leafletService.addMarker(location, loc.title, loc.description || undefined, false)
        })
      } else if (activities.length) {
        // 如果没有已选择的地点，才显示活动标记
        activities.forEach(activity => {
          if (activity.location) {
            const location: MapLocation = {
              lng: activity.longitude || 116.397428,
              lat: activity.latitude || 39.90923
            }
            leafletService.addMarker(location, activity.title, activity.description || undefined, true)
          }
        })
      }
    } catch (error) {
      console.error('清除搜索失败:', error)
    }
  }

  // 规划路线
  const handlePlanRoute = async () => {
    if (selectedLocations.length < 2) {
      alert('请至少选择2个地点进行路线规划')
      return
    }

    setIsPlanningRoute(true)
    try {
      const result = await leafletService.planDrivingRoute(selectedLocations)
      setRouteResult(result)
      onRoutePlanned?.(result)
    } catch (error) {
      console.error('路线规划失败:', error)
      alert('路线规划失败，请重试')
    } finally {
      setIsPlanningRoute(false)
    }
  }

  // 清除路线
  const handleClearRoute = () => {
    setRouteResult(null)
    // 保存当前选中的地点，然后清空状态
    const currentLocations = [...selectedLocations];
    setSelectedLocations([])
    leafletService.clearSelectedMarkers()
    
    // 重新显示已选择的地点标记
    if (currentLocations.length > 0) {
      leafletService.clearMarkers();
      currentLocations.forEach(loc => {
        const location: MapLocation = {
          lng: loc.lng,
          lat: loc.lat
        }
        leafletService.addMarker(location, loc.title, loc.description || undefined, false);
      });
      // 恢复选中地点状态
      setSelectedLocations(currentLocations);
    }
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

  // 清除所有选择
  const handleClearAll = () => {
    setSearchResults([])
    setSelectedLocations([])
    setRouteResult(null)
    try {
      leafletService.clearMarkers()
      leafletService.clearSelectedMarkers()
    } catch (error) {
      console.error('清除所有标记失败:', error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 控制面板 */}
      {showControls && (
        <div className="bg-white border-b border-gray-200 p-4 space-y-3 flex-shrink-0">
          {/* 搜索栏 */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索地点..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearchPlaces()}
            />
            <button
              onClick={() => handleSearchPlaces()}
              disabled={isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSearching ? '搜索中...' : '搜索'}
            </button>
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              清除
            </button>
          </div>

          {/* 选中的地点列表 */}
          {selectedLocations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">已选择的地点 ({selectedLocations.length})</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePlanRoute}
                    disabled={isPlanningRoute || selectedLocations.length < 2}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isPlanningRoute ? '规划中...' : '规划路线'}
                  </button>
                  <button
                    onClick={handleClearRoute}
                    className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                  >
                    清除路线
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedLocations.map((location, index) => (
                  <div key={location.id} className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">
                      {index + 1}. {location.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 路线规划结果 */}
          {routeResult && (
            <div className={`p-3 rounded-lg ${
              routeResult.status === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <h4 className="font-medium mb-2">
                {routeResult.status === 'success' ? '路线规划成功' : '路线规划失败'}
              </h4>
              {routeResult.status === 'success' && (
                <div className="text-sm space-y-1">
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
                <div className="text-red-700 text-sm">{routeResult.message}</div>
              )}
            </div>
          )}

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">搜索结果 ({searchResults.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSelectSearchResult(result)}
                  >
                    <div className="font-medium text-sm">{result.name}</div>
                    <div className="text-gray-600 text-xs">{result.address}</div>
                    <div className="text-gray-500 text-xs mt-1">{result.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 地图容器 */}
      <div
        ref={mapContainerRef}
        id={containerId}
        style={{ height }}
        className="flex-1 bg-gray-100"
      >
        {!isMapReady && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载地图...</p>
            </div>
          </div>
        )}
      </div>

      {/* 清除所有按钮 */}
      {showControls && (searchResults.length > 0 || selectedLocations.length > 0 || routeResult) && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
          >
            清除所有
          </button>
        </div>
      )}
    </div>
  )
}

export default MapComponent