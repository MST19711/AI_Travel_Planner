import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { userService } from '../../services/userService'
import { llmService } from '../../services/llmService'
import { LLMConfig, AIPlanningState, LLMStreamResponse, Trip } from '../../types'
import { tripService } from '../../services/tripService'

const AITripPlanningPage: React.FC = () => {
  const { user: _user } = useAuthStore()
  const [planningState, setPlanningState] = useState<AIPlanningState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    error: undefined,
    previewContent: '',
    retryCount: 0
  })
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(null)
  const [userInput, setUserInput] = useState('')
  const [existingTrip, setExistingTrip] = useState<Trip | null>(null)
  const [generatedTripData, setGeneratedTripData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadLlmConfig()
  }, [])

  const loadLlmConfig = async () => {
    try {
      const apiKeys = await userService.getApiKeys()
      if (apiKeys.openaiApiKey) {
        setLlmConfig({
          apiKey: apiKeys.openaiApiKey,
          baseUrl: apiKeys.openaiBaseUrl || 'https://api.deepseek.com',
          model: apiKeys.openaiModel || 'deepseek-chat'
        })
        llmService.setConfig({
          apiKey: apiKeys.openaiApiKey,
          baseUrl: apiKeys.openaiBaseUrl || 'https://api.deepseek.com',
          model: apiKeys.openaiModel || 'deepseek-chat'
        })
      }
    } catch (error) {
      console.error('加载LLM配置失败:', error)
    }
  }

  const handleStreamUpdate = (response: LLMStreamResponse) => {
    setPlanningState(prev => ({
      ...prev,
      previewContent: response.content,
      currentStep: response.isComplete ? '解析完成' : '生成中...',
      progress: response.isComplete ? 100 : Math.min(prev.progress + 10, 90)
    }))
  }

  const generateTripPlan = async () => {
    if (!userInput.trim()) {
      setPlanningState(prev => ({ ...prev, error: '请输入旅行需求' }))
      return
    }

    if (!llmConfig) {
      setPlanningState(prev => ({ ...prev, error: '请先配置LLM API密钥' }))
      return
    }

    setPlanningState({
      isGenerating: true,
      progress: 0,
      currentStep: '初始化...',
      error: undefined,
      previewContent: '',
      retryCount: 0
    })

    try {
      const result = await llmService.generateTripPlan(
        {
          prompt: userInput,
          existingTripData: existingTrip?.activities || null
        },
        handleStreamUpdate,
        3
      )

      if (result.success && result.tripData) {
        setPlanningState(prev => ({
          ...prev,
          isGenerating: false,
          progress: 100,
          currentStep: '生成完成',
          retryCount: result.retryCount || 0
        }))
        
        // 保存生成的行程数据，等待用户手动保存
        setGeneratedTripData(result.tripData)
        
      } else {
        setPlanningState(prev => ({
          ...prev,
          isGenerating: false,
          error: result.error || '生成行程计划失败',
          retryCount: result.retryCount || 0
        }))
      }
    } catch (error) {
      setPlanningState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : '生成行程计划时发生错误'
      }))
    }
  }

  const saveTrip = async () => {
    if (!generatedTripData) {
      alert('请先生成行程计划')
      return
    }

    setIsSaving(true)
    try {
      // 创建新行程 - 包含完整的activities数据
      const newTrip = await tripService.createTrip({
        title: generatedTripData.title,
        description: generatedTripData.description || '',
        startDate: generatedTripData.startDate,
        endDate: generatedTripData.endDate,
        budget: generatedTripData.budget || null,
        participants: generatedTripData.participants || null,
        preferences: generatedTripData.preferences ? JSON.stringify(generatedTripData.preferences) : null,
        activities: generatedTripData.activities || []  // 添加activities数据
      })

      alert(`行程 "${newTrip.title}" 保存成功！`)
      setGeneratedTripData(null)
      
    } catch (error) {
      console.error('保存行程失败:', error)
      alert('保存行程失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setUserInput('')
    setExistingTrip(null)
    setGeneratedTripData(null)
    setPlanningState({
      isGenerating: false,
      progress: 0,
      currentStep: '',
      error: undefined,
      previewContent: '',
      retryCount: 0
    })
  }

  const formatPreviewContent = (content: string) => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return JSON.stringify(parsed, null, 2)
      }
      return content
    } catch {
      return content
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          AI智能行程规划
        </h1>

        {!llmConfig && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              请先前往 <a href="/settings/api-keys" className="underline">设置页面</a> 配置LLM API密钥
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                旅行需求描述
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="例如：我想去日本东京，5天行程，预算5000元，喜欢美食和购物，2人同行"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={planningState.isGenerating}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={generateTripPlan}
                disabled={planningState.isGenerating || !llmConfig}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {planningState.isGenerating ? '生成中...' : '生成行程计划'}
              </button>
              <button
                onClick={saveTrip}
                disabled={!generatedTripData || isSaving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {isSaving ? '保存中...' : '保存行程'}
              </button>
              <button
                onClick={resetForm}
                disabled={planningState.isGenerating}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                重置
              </button>
            </div>

            {/* 进度指示器 */}
            {planningState.isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{planningState.currentStep}</span>
                  <span>{planningState.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${planningState.progress}%` }}
                  ></div>
                </div>
                {planningState.retryCount > 0 && (
                  <p className="text-sm text-orange-600">
                    正在进行第 {planningState.retryCount} 次重试...
                  </p>
                )}
              </div>
            )}

            {/* 错误信息 */}
            {planningState.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{planningState.error}</p>
              </div>
            )}
          </div>

          {/* 预览区域 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">实时预览</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[300px] max-h-[500px] overflow-auto">
              {planningState.previewContent ? (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {formatPreviewContent(planningState.previewContent)}
                </pre>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {planningState.isGenerating ? '正在生成行程计划...' : '预览区域将实时显示AI生成的行程计划'}
                </p>
              )}
            </div>

            {/* 重试信息 */}
            {planningState.retryCount > 0 && !planningState.isGenerating && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-700 text-sm">
                  经过 {planningState.retryCount} 次重试后生成成功
                </p>
              </div>
            )}

            {/* 保存提示 */}
            {generatedTripData && !isSaving && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  ✓ 行程已生成，请检查预览内容，满意后点击"保存行程"按钮
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">使用说明：</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 详细描述您的旅行需求，包括目的地、天数、预算、人数和偏好</li>
            <li>• AI将根据您的需求生成详细的行程计划</li>
            <li>• 如果JSON解析失败，系统会自动重试最多3次</li>
            <li>• 生成完成后，请检查预览内容，满意后点击"保存行程"按钮</li>
            <li>• 保存后的行程将添加到您的行程列表中</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AITripPlanningPage