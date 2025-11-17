// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  token: string|null
  user: User|null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  username: string
  token_type?: string
  is_insecure_auth?: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  username: string
  email: string
  message?: string
}

// 行程相关类型
export interface Trip {
  id: number
  title: string
  description: string|null
  startDate: string
  endDate: string
  budget: number|null
  participants: number|null
  preferences: string|null
  activities: Activity[]|null
  createdAt: string
  updatedAt: string
  countryCode?: string|null
  status?: string
}

export interface Activity {
  id: number
  tripId: number
  title: string
  description: string|null
  location: string|null
  countryCode: string|null
  latitude: number|null
  longitude: number|null
  startTime: string|null
  endTime: string|null
  cost: number|null
  category: string|null
  createdAt: string
  updatedAt: string
}

export interface TripCreateRequest {
  title: string
  description?: string|null
  startDate: string
  endDate: string
  budget?: number|null
  participants?: number|null
  preferences?: string|null
  activities?: Activity[]  // 添加activities字段
}

export interface TripUpdateRequest {
  title?: string
  description?: string|null
  startDate?: string
  endDate?: string
  budget?: number|null
  participants?: number|null
  preferences?: string|null
}

// API密钥相关类型
export interface ApiKeys {
  amapApiKey?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiModel?: string
  glmApiKey?: string
  xunfeiAppId?: string
  xunfeiApiSecret?: string
  xunfeiApiKey?: string
}

export interface EncryptedApiKeys {
  amapApiKey?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiModel?: string
  glmApiKey?: string
  xunfeiAppId?: string
  xunfeiApiSecret?: string
  xunfeiApiKey?: string
}

// AI相关类型
export interface AITripPlanRequest {
  destination: string
  duration: number
  budget: number
  participants: number
  preferences: string[]
  startDate: string
  existingTripData?: any  // 已有的行程数据，用于修改现有行程
}

export interface AITripPlanResponse {
  plan: string
  activities: Activity[]
  budgetBreakdown: BudgetBreakdown
}

export interface BudgetBreakdown {
  accommodation: number
  transportation: number
  food: number
  activities: number
  other: number
}

// LLM流式响应相关类型
export interface LLMStreamResponse {
  content: string
  isComplete: boolean
  error?: string
}

export interface LLMPlanRequest {
  prompt: string
  maxRetries?: number
  existingTripData?: any
}

export interface LLMPlanResponse {
  success: boolean
  tripData?: any
  error?: string
  retryCount?: number
}

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

// AI规划状态类型
export interface AIPlanningState {
  isGenerating: boolean
  progress: number
  currentStep: string
  error?: string
  previewContent: string
  retryCount: number
}

// 聊天相关类型
export interface ChatMessage {
  id: string
  role: 'user'|'assistant'
  content: string
  timestamp: string
}

export interface ChatRequest {
  message: string
  context?: string
}

export interface ChatResponse {
  message: string
  timestamp: string
}

// 搜索相关类型
export interface SearchRequest {
  query: string
  context?: string
}

export interface SearchResponse {
  results: SearchResult[]
}

export interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  relevance: number
}

// 通用响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 地图相关类型
export interface MapLocation {
  lng: number
  lat: number
  zoom?: number
}

export interface MapMarker {
  id: string
  lng: number
  lat: number
  title: string
  description?: string
  isSelectable?: boolean
}