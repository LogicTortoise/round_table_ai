import Bot from './Bot'
import store from '@/store'

/**
 * LangChain Bot 基类
 * 用于基于 LangChain 的 AI Bot实现
 */
export default class LangChainBot extends Bot {
  /**
   * 子类必须实现 - 设置 LangChain 模型
   */
  _setupModel() {
    throw new Error('子类必须实现 _setupModel 方法')
  }

  /**
   * 获取历史对话轮数
   */
  getPastRounds() {
    const brandId = this.constructor._brandId
    return store.state[brandId]?.pastRounds || 5
  }

  /**
   * 发送提示 - LangChain 实现
   */
  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    try {
      // 1. 初始化模型
      const model = this._setupModel()

      // 2. 获取历史消息
      let context = await this.getChatContext()
      let messages = context || []

      // 3. 限制历史轮数（每轮包含 human + ai 两条消息）
      const pastRounds = this.getPastRounds()
      if (messages.length > pastRounds * 2) {
        messages = messages.slice(-pastRounds * 2)
      }

      // 4. 添加当前用户消息
      messages.push({
        type: 'human',
        data: { content: prompt }
      })

      // 5. 转换为 LangChain 格式
      const langchainMessages = messages.map(msg => {
        if (msg.type === 'human') {
          return { role: 'user', content: msg.data.content }
        } else if (msg.type === 'ai') {
          return { role: 'assistant', content: msg.data.content }
        }
        return msg
      })

      // 6. 调用模型（流式响应）
      let responseText = ''

      const stream = await model.stream(langchainMessages)

      for await (const chunk of stream) {
        const content = chunk?.content || chunk?.text || ''
        responseText += content

        onUpdateResponse(callbackParam, {
          content: responseText,
          done: false
        })
      }

      // 7. 保存对话历史
      messages.push({
        type: 'ai',
        data: { content: responseText }
      })
      await this.setChatContext(messages)

      // 8. 标记完成
      onUpdateResponse(callbackParam, {
        content: responseText,
        done: true
      })
    } catch (error) {
      console.error('LangChain error:', error)
      throw error
    }
  }

  /**
   * 创建新的对话上下文
   */
  async createChatContext() {
    return [] // 空的消息历史数组
  }
}
