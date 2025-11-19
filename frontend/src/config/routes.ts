/**
 * 路由配置常量
 * 统一管理所有路由路径，避免硬编码
 */

// 基础路由路径
export const ROUTES = {
  // 公开路由
  LOGIN: '/login',
  REGISTER: '/register',

  // 受保护路由
  HOME: '/home',
  TRIP_DETAIL: '/trips/:id',
  AI_PLANNING: '/plan',
  CHAT: '/chat',
  SEARCH: '/search',
  SETTINGS: '/settings',
  API_KEYS: '/settings/api-keys',

  // 默认路由
  DEFAULT: '/',
  WILDCARD: '*',
} as const

    // 导航链接路径（用于导航组件）
    export const NAV_ROUTES = {
  HOME: '/home',
  AI_PLANNING: '/plan',
  CHAT: '/chat',
  SEARCH: '/search',
  SETTINGS: '/settings',
  API_KEYS: '/settings/api-keys',
} as const

    // 路由生成器函数
    export const routeBuilder = {
  // 生成行程详情路由
  tripDetail: (id: string|number) => `/trips/${id}`,

  // 生成设置子路由
  settings: {
    apiKeys: () => '/settings/api-keys',
  },
} as const

    // 类型定义
    export type RouteKey = keyof typeof ROUTES
export type NavRouteKey = keyof typeof NAV_ROUTES