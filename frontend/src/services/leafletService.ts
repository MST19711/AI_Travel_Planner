// 导入leaflet-routing-machine的CSS样式
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import L from 'leaflet';

import {ExtendedRoutePlanResult, MapLocation, MapMarker, TransportMode} from '../types';

// 添加自定义CSS样式来调整导航信息窗口位置
const customRoutingStyles = `
  /* 调整导航信息窗口位置，避免遮挡地图中心 */
  .leaflet-routing-container {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    bottom: auto !important;
    left: auto !important;
    width: 300px !important;
    max-height: 30vh !important; 
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
    z-index: 1000 !important;
  }
  
  /* 直接调整路线说明列表（表格）的高度，而不是外层容器 */
  .leaflet-routing-alt {
    max-height: 30vh !important; /* 使用视口高度的30% */
    min-height: 300px !important; /* 设置最小高度 */
    overflow-y: auto !important;
    font-size: 13px !important;
    padding: 8px !important;
    background: transparent !important;
  }
  
  /* 修复最小化状态的显示问题 */
  .leaflet-routing-alt-minimized {
    max-height: 64px !important;
    min-height: 64px !important;
    overflow: hidden !important;
    cursor: pointer !important;
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
  }
  
  /* 确保最小化状态下的内容正确显示 */
  .leaflet-routing-alt-minimized {
    display: none !important;
  }
  
  /* 确保内部table也被正确限制高度 */
  .leaflet-routing-alt table {
    max-height: 25vh !important; /* 继承父容器的高度限制 */
    overflow-y: auto !important;
    display: block !important; /* 确保表格可以正确应用高度限制 */
  }
  
  /* 确保表格行可以正确显示 */
  .leaflet-routing-alt tbody {
    display: block !important;
    max-height: calc(30vh - 65px) !important; /* 减去padding和其他元素的高度 */
    overflow-y: auto !important;
  }
  
  /* 调整路线说明容器样式 */
  .leaflet-routing-itinerary {
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    font-size: 13px !important;
  }
  
  /* 调整路线说明表格样式 */
  .leaflet-routing-itinerary table {
    margin: 0 !important;
    width: 100% !important;
  }
  
  /* 调整路线说明行样式 */
  .leaflet-routing-itinerary tr {
    border-bottom: 1px solid #eee !important;
  }
  
  /* 调整路线说明单元格样式 */
  .leaflet-routing-itinerary td {
    padding: 4px 6px !important;
    vertical-align: top !important;
  }
  
  /* 调整弹出窗口样式，避免遮挡路线 */
  .custom-popup {
    margin-left: 20px !important;
    margin-top: -50px !important;
  }
  
  /* 调整路线标记样式 */
  .leaflet-routing-geocoder {
    display: none !important;
  }
`;

// 注入自定义样式到页面
const injectCustomStyles = () => {
  if (document.getElementById('leaflet-routing-custom-styles')) {
    return;  // 样式已存在
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'leaflet-routing-custom-styles';
  styleElement.innerHTML = customRoutingStyles;
  document.head.appendChild(styleElement);
};

// 动态导入leaflet-routing-machine，确保L已经定义
let leafletRoutingMachine: any = null;
const loadRoutingMachine = async () => {
  if (!leafletRoutingMachine) {
    leafletRoutingMachine = await import('leaflet-routing-machine');
  }
  return leafletRoutingMachine;
};

// 地点搜索结果
export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  location: {lng: number; lat: number;};
  type: string;
  distance?: number;
  city?: string;
  district?: string;
}

// 修复Leaflet默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

class LeafletService {
  private isInitialized = false;
  private mapInstance: L.Map|null = null;
  private markers: L.Marker[] = [];
  private selectedMarkers: MapMarker[] = [];
  private routingControl: any = null;
  private tileLayer: L.TileLayer|null = null;

  // 国家代码到中心坐标的映射表
  private countryCenterMap: {[key: string]: [number, number]} = {
    'CN': [116.397428, 39.90923],  // 中国 - 北京
    'JP': [139.6917, 35.6895],     // 日本 - 东京
    'US': [-74.0060, 40.7128],     // 美国 - 纽约
    'FR': [2.3522, 48.8566],       // 法国 - 巴黎
    'GB': [-0.1276, 51.5074],      // 英国 - 伦敦
    'DE': [13.4050, 52.5200],      // 德国 - 柏林
    'IT': [12.4964, 41.9028],      // 意大利 - 罗马
    'ES': [-3.7038, 40.4168],      // 西班牙 - 马德里
    'KR': [126.9780, 37.5665],     // 韩国 - 首尔
    'TH': [100.5018, 13.7563],     // 泰国 - 曼谷
    'SG': [103.8198, 1.3521],      // 新加坡
    'MY': [101.6869, 3.1390],      // 马来西亚 - 吉隆坡
    'ID': [106.8456, -6.2088],     // 印度尼西亚 - 雅加达
    'AU': [151.2093, -33.8688],    // 澳大利亚 - 悉尼
    'CA': [-75.6972, 45.4215],     // 加拿大 - 渥太华
    'BR': [-47.9292, -15.7801],    // 巴西 - 巴西利亚
    'RU': [37.6173, 55.7558],      // 俄罗斯 - 莫斯科
    'IN': [77.2090, 28.6139],      // 印度 - 新德里
    'ZA': [28.0473, -26.2041],     // 南非 - 约翰内斯堡
    'MX': [-99.1332, 19.4326],     // 墨西哥 - 墨西哥城
    'EG': [31.2357, 30.0444],      // 埃及 - 开罗
    'TR': [28.9784, 41.0082],      // 土耳其 - 伊斯坦布尔
    'AE': [55.2708, 25.2048],      // 阿联酋 - 迪拜
    'SA': [46.6753, 24.7136],      // 沙特阿拉伯 - 利雅得
    'VN': [105.8342, 21.0278],     // 越南 - 河内
    'PH': [120.9842, 14.5995],     // 菲律宾 - 马尼拉
    'TW': [121.5654, 25.0330],     // 台湾 - 台北
    'HK': [114.1694, 22.3193],     // 香港
    'MO': [113.5439, 22.1987],     // 澳门
  };

  // 初始化服务
  async initialize(): Promise<boolean> {
    try {
      // 注入自定义样式
      injectCustomStyles();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('初始化Leaflet地图服务失败:', error);
      return false;
    }
  }

  // 初始化地图
  async initializeMap(containerId: string, options: any = {}): Promise<L.Map> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Leaflet地图服务未初始化');
      }
    }

    try {
      // 检查容器是否存在
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`地图容器 ${containerId} 不存在`);
      }

      // 如果地图实例已存在，先销毁它
      if (this.mapInstance) {
        this.destroy();
      }

      // 检查容器是否已经被Leaflet使用
      if ((container as any)._leaflet_id) {
        // 容器已被使用，先清理
        delete (container as any)._leaflet_id;
      }

      const defaultOptions = {
        zoom: 13,
        center: [39.90923, 116.397428] as [number, number],  // 北京 [lat, lng]
        ...options
      };

      // 如果传入了center，需要转换格式 [lng, lat] -> [lat, lng]
      if (options.center && Array.isArray(options.center)) {
        defaultOptions.center =
            [options.center[1], options.center[0]] as [number, number];
      }

      // 初始化地图
      this.mapInstance = L.map(container, defaultOptions);

      // 添加OpenStreetMap底图
      this.tileLayer =
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             maxZoom: 19,
             attribution:
                 '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
           }).addTo(this.mapInstance);

      return this.mapInstance;
    } catch (error) {
      console.error('初始化地图失败:', error);
      throw new Error('地图初始化失败: ' + (error as Error).message);
    }
  }

  // 搜索地点 - 使用Nominatim API
  async searchPlaces(keyword: string, city?: string, countryCode?: string):
      Promise<PlaceSearchResult[]> {
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    try {
      // 构建搜索查询
      let query = keyword;
      if (city) {
        query += `, ${city}`;
      }
      if (countryCode) {
        const countryNames: {[key: string]: string} = {
          'CN': 'China',
          'JP': 'Japan',
          'US': 'United States',
          'FR': 'France',
          'GB': 'United Kingdom',
          'DE': 'Germany',
          'IT': 'Italy',
          'ES': 'Spain',
          'KR': 'South Korea',
          'TH': 'Thailand',
          'SG': 'Singapore',
          'MY': 'Malaysia',
          'ID': 'Indonesia',
          'AU': 'Australia',
          'CA': 'Canada',
          'BR': 'Brazil',
          'RU': 'Russia',
          'IN': 'India',
          'ZA': 'South Africa',
          'MX': 'Mexico',
          'EG': 'Egypt',
          'TR': 'Turkey',
          'AE': 'United Arab Emirates',
          'SA': 'Saudi Arabia',
          'VN': 'Vietnam',
          'PH': 'Philippines',
          'TW': 'Taiwan',
          'HK': 'Hong Kong',
          'MO': 'Macau'
        };
        if (countryNames[countryCode]) {
          query += `, ${countryNames[countryCode]}`;
        }
      }

      const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${
              encodeURIComponent(query)}&limit=20`);
      const data = await response.json();

      return data.map(
          (item: any) => ({
            id: item.place_id.toString(),
            name: item.display_name.split(',')[0],
            address: item.display_name,
            location: {lng: parseFloat(item.lon), lat: parseFloat(item.lat)},
            type: item.type || 'unknown',
            city: item.address?.city || item.address?.town ||
                item.address?.village,
            district: item.address?.suburb || item.address?.district
          }));
    } catch (error) {
      console.error('搜索地点时出错:', error);
      throw new Error('搜索失败: ' + (error as Error).message);
    }
  }

  // 添加标记点
  addMarker(
      location: MapLocation, title: string, description?: string,
      isSelectable: boolean = true): MapMarker {
    if (!this.mapInstance) {
      throw new Error('地图未初始化');
    }

    if (!location || typeof location.lng !== 'number' ||
        typeof location.lat !== 'number') {
      throw new Error('无效的坐标位置');
    }

    try {
      const marker =
          L.marker([location.lat, location.lng]).addTo(this.mapInstance);

      // 添加弹出窗口
      if (title || description) {
        const popupContent = `
          <div style="padding: 8px; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; font-weight: bold;">${title}</h4>
            ${
            description ?
                `<p style="margin: 0; color: #666;">${description}</p>` :
                ''}
            ${
            isSelectable ? `
              <div style="margin-top: 8px;">
                <button onclick="window.selectLocation('${title}', ${
                               location.lng}, ${location.lat})"
                        style="padding: 4px 8px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                  选择此地点
                </button>
              </div>
            ` :
                           ''}
          </div>
        `;
        // 设置弹出窗口偏移量和行为，避免遮挡路线
        marker.bindPopup(popupContent, {
          offset: L.point(30, -60),  // 向右偏移30像素，向上偏移60像素
          autoPan: false,  // 禁用自动平移，避免地图移动导致路线被遮挡
          closeOnClick: false,        // 点击其他地方不关闭弹出窗口
          className: 'custom-popup',  // 添加自定义类名用于样式调整
          minWidth: 200,              // 设置最小宽度
          maxWidth: 250               // 设置最大宽度
        });
      }

      // 添加点击事件
      if (isSelectable) {
        marker.on('click', () => {
          // 自动打开弹出窗口，但不移动地图中心
          marker.openPopup();

          // 手动调整地图视图，让地点略微向左下移动一点
          const map = this.mapInstance;
          if (map) {
            const currentCenter = map.getCenter();
            const zoom = map.getZoom();
            // 将地图中心向左下移动一点，让弹出窗口不遮挡路线
            const offsetLat =
                -0.002 * Math.pow(2, 15 - zoom);  // 根据缩放级别调整偏移
            const offsetLng = 0.003 * Math.pow(2, 15 - zoom);
            map.setView(
                [currentCenter.lat + offsetLat, currentCenter.lng + offsetLng],
                zoom, {animate: true, duration: 0.5});
          }
        });
      }

      this.markers.push(marker);

      const mapMarker: MapMarker = {
        id: `marker_${Date.now()}_${Math.random()}`,
        lng: location.lng,
        lat: location.lat,
        title: title,
        description: description,
        isSelectable: isSelectable
      };

      return mapMarker;
    } catch (error) {
      console.error('添加标记失败:', error);
      throw new Error('添加标记失败: ' + (error as Error).message);
    }
  }

  // 选择地点
  selectLocation(title: string, lng: number, lat: number): MapMarker {
    const marker: MapMarker = {
      id: `selected_${Date.now()}_${Math.random()}`,
      lng: lng,
      lat: lat,
      title: title,
      isSelectable: false
    };

    this.selectedMarkers.push(marker);

    // 触发选择事件
    if ((window as any).onLocationSelected) {
      (window as any).onLocationSelected(marker);
    }

    return marker;
  }

  // 清除所有标记点
  clearMarkers(): void {
    try {
      this.markers.forEach(marker => {
        this.safeRemoveMarker(marker);
      });
      this.markers = [];
    } catch (error) {
      console.error('清除标记失败:', error);
    }
  }

  // 清除选中的标记点
  clearSelectedMarkers(): void {
    this.selectedMarkers = [];
  }

  // 清除路线
  clearRoute(): void {
    if (this.mapInstance) {
      try {
        // 清除手动绘制的路线图层
        if ((this.mapInstance as any)._routeLayer) {
          this.mapInstance.removeLayer((this.mapInstance as any)._routeLayer);
          (this.mapInstance as any)._routeLayer = null;
        }

        // 清除路由控制
        if (this.routingControl) {
          this.mapInstance.removeControl(this.routingControl);
          this.routingControl = null;
        }
      } catch (e) {
        console.warn('移除路线控制时出错:', e);
      }
    }
  }

  // 获取选中的地点
  getSelectedLocations(): MapMarker[] {
    return this.selectedMarkers;
  }

  // 规划路线 - 支持不同交通方式
  async planRoute(
      waypoints: MapLocation[],
      transportMode: TransportMode = 'driving',
      ): Promise<ExtendedRoutePlanResult> {
    if (!this.mapInstance) {
      throw new Error('地图未初始化');
    }

    if (waypoints.length < 2) {
      throw new Error('至少需要2个途经点');
    }

    try {
      // 动态导入leaflet-routing-machine
      await loadRoutingMachine();

      // 清除之前的路线，但保留地图状态
      this.clearRoute();

      // 确保地图实例存在且有效
      if (!this.mapInstance) {
        throw new Error('地图未初始化');
      }

      if (transportMode === 'transit') {
        // 公共交通路线规划
        return await this.planTransitRoute(
            waypoints[0], waypoints[waypoints.length - 1]);
      }

      // 驾车、步行、骑行路线规划
      const routeColor = transportMode === 'walking' ? '#4CAF50' :
          transportMode === 'cycling'                ? '#FF9800' :
                                                       '#3388ff';

      // 转换坐标格式 [lng, lat] -> [lat, lng]
      const latLngWaypoints =
          waypoints.map(point => L.latLng(point.lat, point.lng));

      console.log(`开始创建${transportMode}路线控制，途经点:`, latLngWaypoints);

      // 创建路线控制 - 启用路线显示，修复显示问题
      this.routingControl =
          (L as any)
              .Routing
              .control({
                waypoints: latLngWaypoints,
                lineOptions:
                    {styles: [{color: routeColor, weight: 6, opacity: 0.8}]},
                show: true,                 // 启用路线说明面板
                addWaypoints: false,        // 不添加途经点标记
                routeWhileDragging: false,  // 禁用拖拽时重新规划
                fitSelectedRoutes: false,  // 禁用自动缩放，避免地图视图被改变
                createMarker: function(_i: any, waypoint: any, _n: any) {
                  // 自定义标记，避免点击时地图中心移动
                  const marker = L.marker(waypoint.latLng, {
                    draggable: false,
                    icon: L.divIcon({
                      className: 'leaflet-routing-icon',
                      html: `<div style="background-color: ${
                          routeColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6]
                    })
                  });
                  return marker;
                },
                router: (L as any).Routing.osrmv1(
                    {serviceUrl: 'https://router.project-osrm.org/route/v1'})
              })
              .addTo(this.mapInstance);

      console.log('路由控制已添加到地图，等待路线计算...');

      return new Promise((resolve) => {
        let resolved = false;

        // 监听路线计算完成事件
        this.routingControl.on('routesfound', (e: any) => {
          if (resolved) return;
          resolved = true;

          const routes = e.routes;
          console.log('路线计算完成事件触发，路线数据:', routes);

          if (routes && routes.length > 0) {
            const summary = routes[0].summary;

            console.log(
                '路线规划成功 - 距离:', summary.totalDistance,
                '米, 时间:', summary.totalTime, '秒');

            resolve({
              status: 'success',
              distance: summary.totalDistance,
              time: summary.totalTime,
              steps: routes[0].waypoints,
              transportMode: transportMode
            });
          } else {
            console.warn('未找到路线');
            resolve({
              status: 'error',
              message: '未找到路线',
              transportMode: transportMode
            });
          }
        });

        // 监听路线计算错误事件
        this.routingControl.on('routingerror', (e: any) => {
          if (resolved) return;
          resolved = true;

          console.error('路线规划错误:', e);
          resolve({
            status: 'error',
            message: '路线规划失败: ' + (e.error?.message || '未知错误'),
            transportMode: transportMode
          });
        });

        // 设置超时
        setTimeout(() => {
          if (resolved) return;
          resolved = true;

          console.warn('路线规划超时');
          resolve({
            status: 'error',
            message: '路线规划超时',
            transportMode: transportMode
          });
        }, 30000);
      });
    } catch (error) {
      console.error('路线规划失败:', error);
      return {
        status: 'error',
        message: '路线规划失败: ' + (error as Error).message,
        transportMode: transportMode
      };
    }
  }

  // 规划公交路线 - 功能未完善
  async planTransitRoute(
      _start: MapLocation,
      _end: MapLocation,
      ): Promise<ExtendedRoutePlanResult> {
    return {
      status: 'error',
      message: '公共交通路线规划功能正在开发中，请稍后使用',
      transportMode: 'transit'
    };
  }


  // 设置地图中心点
  setCenter(lng: number, lat: number, zoom?: number): void {
    if (!this.mapInstance) {
      throw new Error('地图未初始化');
    }

    if (typeof lng !== 'number' || typeof lat !== 'number') {
      throw new Error('无效的坐标');
    }

    try {
      this.mapInstance.setView([lat, lng], zoom || this.mapInstance.getZoom());
    } catch (error) {
      console.error('设置地图中心失败:', error);
      throw new Error('设置地图中心失败: ' + (error as Error).message);
    }
  }

  // 根据国家代码获取中心坐标
  getCountryCenter(countryCode: string): [number, number] {
    return this.countryCenterMap[countryCode] ||
        [116.397428, 39.90923];  // 默认返回北京 [lng, lat]
  }

  // 销毁地图
  destroy(): void {
    try {
      // 先清除所有标记，避免在销毁地图时出现DOM错误
      this.markers.forEach(marker => {
        try {
          if (marker && this.mapInstance && this.mapInstance.hasLayer(marker)) {
            marker.remove();
          }
        } catch (e) {
          // 忽略标记移除错误
        }
      });
      this.markers = [];
      this.selectedMarkers = [];

      // 清除路线控制
      if (this.routingControl && this.mapInstance) {
        try {
          this.mapInstance.removeControl(this.routingControl);
        } catch (e) {
          // 忽略路线控制移除错误
        }
        this.routingControl = null;
      }

      // 清理瓦片图层引用
      if (this.tileLayer) {
        this.tileLayer = null;
      }

      // 最后销毁地图实例
      if (this.mapInstance) {
        try {
          // 使用off移除所有事件监听器
          this.mapInstance.off();
          // 停止所有动画
          this.mapInstance.stop();
          // 移除地图实例
          this.mapInstance.remove();
        } catch (e) {
          // 忽略地图销毁错误，但记录日志
          console.warn('销毁地图实例时出错:', e);
        }
        this.mapInstance = null;
      }
    } catch (error) {
      console.error('销毁地图时出错:', error);
    }
  }

  // 安全地移除标记
  private safeRemoveMarker(marker: L.Marker): void {
    try {
      if (marker && this.mapInstance) {
        // 检查标记是否在地图上
        try {
          if (this.mapInstance.hasLayer(marker)) {
            this.mapInstance.removeLayer(marker);
          }
        } catch (e) {
          // 如果hasLayer检查失败，尝试直接移除
          try {
            this.mapInstance.removeLayer(marker);
          } catch (e2) {
            console.warn('移除标记时出错:', e2);
          }
        }
      }
    } catch (error) {
      console.warn('移除标记时出错:', error);
    }
  }
}

// 全局选择地点函数
(window as any).selectLocation = (title: string, lng: number, lat: number) => {
  try {
    leafletService.selectLocation(title, lng, lat);
  } catch (error) {
    console.error('选择地点时出错:', error);
  }
};

export const leafletService = new LeafletService();