// 高德地图JavaScript桥接文件
let map = null;
let markers = [];
let routes = [];
let selectedMarkers = new Set();

// 初始化高德地图
function initAmap(apiKey) {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载了高德地图API
    if (window.AMap) {
      createMap(apiKey);
      resolve();
      return;
    }

    // 加载高德地图JS API
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${
        apiKey}&plugin=AMap.Driving,AMap.Transit,AMap.PlaceSearch`;
    script.onload = function() {
      createMap(apiKey);
      resolve();
    };
    script.onerror = function() {
      reject(new Error('加载高德地图API失败'));
    };
    document.head.appendChild(script);
  });
}

// 创建地图
function createMap(apiKey) {
  const container = document.getElementById('map-container');
  if (!container) {
    console.error('地图容器未找到');
    return;
  }

  map = new AMap.Map('map-container', {
    zoom: 13,
    center: [116.397428, 39.90923],  // 北京天安门
    zoomEnable: true,
    dragEnable: true,
    resizeEnable: true,
    viewMode: '2D'
  });

  console.log('高德地图初始化完成');
}

// 创建标记点
function createMarker(lng, lat, content, id, isSelectable = true) {
  if (!map) return null;

  const marker = new AMap.Marker({
    position: new AMap.LngLat(lng, lat),
    content: content || createDefaultMarkerContent(),
    offset: new AMap.Pixel(-10, -10),
    bubble: true,
    cursor: 'pointer',
    draggable: false,
    raiseOnDrag: false,
    visible: true,
    zIndex: 100
  });

  if (isSelectable) {
    marker.on('click', function(e) {
      const markerId = id || `${lng},${lat}`;

      if (selectedMarkers.has(markerId)) {
        // 取消选择
        selectedMarkers.delete(markerId);
        marker.setContent(createDefaultMarkerContent());
        if (window.onMarkerDeselected) {
          window.onMarkerDeselected(
              {id: markerId, lng: lng, lat: lat, content: content});
        }
      } else {
        // 选择标记点
        selectedMarkers.add(markerId);
        marker.setContent(createSelectedMarkerContent());
        if (window.onMarkerSelected) {
          window.onMarkerSelected(
              {id: markerId, lng: lng, lat: lat, content: content});
        }
      }
    });
  }

  marker.addTo(map);
  markers.push({marker: marker, id: id || `${lng},${lat}`});

  return marker;
}

// 创建默认标记点内容
function createDefaultMarkerContent() {
  return '<div style="width:20px;height:20px;background:red;border-radius:50%;border:2px solid white;"></div>';
}

// 创建选中状态的标记点内容
function createSelectedMarkerContent() {
  return '<div style="width:20px;height:20px;background:blue;border-radius:50%;border:2px solid white;"></div>';
}

// 清除所有标记点
function clearMarkers() {
  markers.forEach(item => {
    item.marker.remove();
  });
  markers = [];
  selectedMarkers.clear();
}

// 清除特定标记点
function removeMarker(id) {
  const index = markers.findIndex(item => item.id === id);
  if (index !== -1) {
    markers[index].marker.remove();
    markers.splice(index, 1);
    selectedMarkers.delete(id);
  }
}

// 显示/隐藏标记点
function toggleMarkerVisibility(visible) {
  markers.forEach(item => {
    item.marker.setVisible(visible);
  });
}

// 驾车路线规划
function createDrivingRoute(
    startLng, startLat, endLng, endLat, waypoints = [], showTraffic = true) {
  return new Promise((resolve, reject) => {
    if (!map) {
      reject(new Error('地图未初始化'));
      return;
    }

    // 清除之前的路线
    clearRoutes();

    const driving = new AMap.Driving({
      map: map,
      policy: AMap.DrivingPolicy.LEAST_TIME,
      hideMarkers: false,
      showTraffic: showTraffic,
      zIndex: 10
    });

    const start = new AMap.LngLat(startLng, startLat);
    const end = new AMap.LngLat(endLng, endLat);

    // 如果有途经点
    let searchOptions = [start, end];
    if (waypoints.length > 0) {
      const waypointLngLats =
          waypoints.map(wp => new AMap.LngLat(wp.lng, wp.lat));
      searchOptions = [start, ...waypointLngLats, end];
    }

    driving.search(searchOptions, function(status, result) {
      if (status === 'complete') {
        routes.push(driving);
        resolve({
          status: 'success',
          distance: result.routes[0].distance,
          time: result.routes[0].time,
          tolls: result.routes[0].tolls || 0,
          steps: result.routes[0].steps
        });
      } else {
        reject(new Error('路线规划失败: ' + result));
      }
    });
  });
}

// 公共交通路线规划
function createTransitRoute(startLng, startLat, endLng, endLat, city = '北京') {
  return new Promise((resolve, reject) => {
    if (!map) {
      reject(new Error('地图未初始化'));
      return;
    }

    // 清除之前的路线
    clearRoutes();

    const transit = new AMap.Transit({
      map: map,
      policy: AMap.TransitPolicy.LEAST_TIME,
      city: city,
      hideMarkers: false,
      zIndex: 10
    });

    const start = new AMap.LngLat(startLng, startLat);
    const end = new AMap.LngLat(endLng, endLat);

    transit.search(start, end, function(status, result) {
      if (status === 'complete') {
        routes.push(transit);
        resolve({
          status: 'success',
          distance: result.routes[0].distance,
          time: result.routes[0].time,
          cost: result.routes[0].cost || 0,
          segments: result.routes[0].segments
        });
      } else {
        reject(new Error('公共交通路线规划失败: ' + result));
      }
    });
  });
}

// 清除所有路线
function clearRoutes() {
  routes.forEach(route => {
    route.clear();
  });
  routes = [];
}

// 地点搜索
function searchPlaces(keyword, city, callback) {
  if (!map) {
    callback({status: 'error', message: '地图未初始化'});
    return;
  }

  const placeSearch = new AMap.PlaceSearch({
    city: city || '全国',
    pageSize: 20,
    pageIndex: 1,
    map: map,
    citylimit: true
  });

  placeSearch.search(keyword, function(status, result) {
    if (status === 'complete') {
      const pois = result.poiList.pois.map(
          poi => ({
            id: poi.id,
            name: poi.name,
            address: poi.address,
            location: {lng: poi.location.lng, lat: poi.location.lat},
            type: poi.type,
            city: poi.cityname,
            district: poi.adname
          }));
      callback({status: 'success', results: pois});
    } else {
      callback({status: 'error', message: result});
    }
  });
}

// 设置地图中心点
function setCenter(lng, lat) {
  if (map) {
    map.setCenter([lng, lat]);
  }
}

// 设置地图缩放级别
function setZoom(zoom) {
  if (map) {
    map.setZoom(zoom);
  }
}

// 获取选中的标记点
function getSelectedMarkers() {
  return Array.from(selectedMarkers);
}

// 清除选中的标记点
function clearSelectedMarkers() {
  // 重置所有标记点为未选中状态
  markers.forEach(item => {
    if (selectedMarkers.has(item.id)) {
      item.marker.setContent(createDefaultMarkerContent());
    }
  });
  selectedMarkers.clear();
}

// 导出函数到全局作用域
window.initAmap = initAmap;
window.createMarker = createMarker;
window.clearMarkers = clearMarkers;
window.removeMarker = removeMarker;
window.toggleMarkerVisibility = toggleMarkerVisibility;
window.createDrivingRoute = createDrivingRoute;
window.createTransitRoute = createTransitRoute;
window.clearRoutes = clearRoutes;
window.searchPlaces = searchPlaces;
window.setCenter = setCenter;
window.setZoom = setZoom;
window.getSelectedMarkers = getSelectedMarkers;
window.clearSelectedMarkers = clearSelectedMarkers;