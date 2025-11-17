import {LLMConfig, LLMPlanRequest, LLMPlanResponse, LLMStreamResponse} from '../types'

class LLMService {
  private config: LLMConfig|null = null

  setConfig(config: LLMConfig) {
    this.config = config
  }

  async generateTripPlan(
      request: LLMPlanRequest, onStream?: (response: LLMStreamResponse) => void,
      maxRetries: number = 3): Promise<LLMPlanResponse> {
    if (!this.config) {
      throw new Error('LLM配置未设置')
    }

    let retryCount = 0
    let lastError: string|undefined

    while (retryCount <= maxRetries) {
      try {
        const tripData = await this.generatePlanWithRetry(request, onStream)
        return {
          success: true, tripData, retryCount
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : '未知错误'
        retryCount++

            if (retryCount <= maxRetries) {
          console.log(`第 ${retryCount} 次重试生成行程计划...`)
          if (onStream) {
            onStream({
              content: `\n\n⚠️ 解析失败，正在第 ${
                  retryCount} 次重试...\n错误信息: ${lastError}\n\n`,
              isComplete: false
            })
          }
        }
      }
    }

    return {
      success: false, error: lastError, retryCount
    }
  }

  private async generatePlanWithRetry(
      request: LLMPlanRequest,
      onStream?: (response: LLMStreamResponse) => void): Promise<any> {
    const prompt = this.buildPrompt(request)
    let fullContent = ''

    try {
      const response = await fetch(`${this.config!.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config!.apiKey}`
        },
        body: JSON.stringify({
          model: this.config!.model,
          messages: [{role: 'user', content: prompt}],
          stream: true,
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(
            `API请求失败: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

            const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              if (onStream) {
                onStream({content: fullContent, isComplete: true})
              }

              return this.parseTripData(fullContent)
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content
                fullContent += content

                if (onStream) {
                  onStream({content: fullContent, isComplete: false})
                }
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }

      return this.parseTripData(fullContent)

    } catch (error) {
      throw new Error(
          `LLM调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private buildPrompt(request: LLMPlanRequest): string {
    const {prompt, existingTripData} = request

    let systemPrompt =
        `你是一个专业的旅行规划AI助手。请根据用户需求生成详细的旅行计划，并以JSON格式返回。

要求：
1. 返回格式必须是有效的JSON，包含以下字段：
   - title: 行程标题
   - description: 行程描述
   - startDate: 开始日期 (ISO格式)
   - endDate: 结束日期 (ISO格式)
   - budget: 总预算 (人民币)
   - participants: 出行人数
   - preferences: 用户偏好 (包含food、activities、accommodation)
   - activities: 活动安排数组

2. 每个活动必须包含：
   - title: 活动标题
   - description: 活动描述
   - location: 具体地点
   - city: 城市名称
   - countryCode: 国家代码 (ISO 3166-1 alpha-2)
   - startTime: 开始时间 (ISO格式)
   - endTime: 结束时间 (ISO格式)
   - estimatedCost: 预估费用，使用人民币
   - notes: 备注

3. 确保所有时间逻辑合理，费用在预算范围内。

4. 使用中文描述，但JSON字段名使用英文。`

    if (existingTripData) {
      systemPrompt += `\n\n现有行程数据：${
          JSON.stringify(
              existingTripData, null,
              2)}\n请基于现有行程进行修改，而不是创建全新的行程。`
    }

    return `${systemPrompt}\n\n用户需求：${
        prompt}\n\n请直接返回JSON格式的行程计划，不要包含其他说明文字：`
  }

  private parseTripData(content: string): any {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法从响应中提取JSON数据')
    }

    try {
      const tripData = JSON.parse(jsonMatch[0])

      const requiredFields = ['title', 'startDate', 'endDate'];
      for (const field of requiredFields) {
        if (!tripData[field]) {
          throw new Error(`缺少必需字段: ${field}`)
        }
      }

      if (tripData.activities && Array.isArray(tripData.activities)) {
        for (const activity of tripData.activities) {
          if (!activity.title) {
            throw new Error('活动缺少标题字段')
          }
          if (activity.countryCode &&
              !/^[A-Z]{2}$/.test(activity.countryCode)) {
            throw new Error(`无效的国家代码: ${activity.countryCode}`)
          }
        }
      }

      return tripData
    } catch (error) {
      throw new Error(`JSON解析失败: ${
          error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  validateTripData(tripData: any): {isValid: boolean; errors: string[]} {
    const errors: string[] = []

                             if (!tripData.title) errors.push('缺少行程标题');
    if (!tripData.startDate) errors.push('缺少开始日期');
    if (!tripData.endDate) errors.push('缺少结束日期');

    try {
      const startDate = new Date(tripData.startDate);
      const endDate = new Date(tripData.endDate);
      if (endDate < startDate) errors.push('结束日期不能早于开始日期');
    } catch {
      errors.push('日期格式无效');
    }

    if (tripData.budget !== undefined && tripData.budget < 0) {
      errors.push('预算不能为负数')
    }

    if (tripData.activities && Array.isArray(tripData.activities)) {
      tripData.activities.forEach((activity: any, index: number) => {
        if (!activity.title) errors.push(`活动 ${index + 1} 缺少标题`)
          if (activity.countryCode &&
              !/^[A-Z]{2}$/.test(activity.countryCode)) {
            errors.push(`活动 ${index + 1} 的国家代码格式无效`)
          }
        if (activity.estimatedCost !== undefined &&
            activity.estimatedCost < 0) {
          errors.push(`活动 ${index + 1} 的费用不能为负数`)
        }
      })
    }

    return {
      isValid: errors.length === 0, errors
    }
  }
}

export const llmService = new LLMService()
export default llmService