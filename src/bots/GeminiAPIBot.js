import LangChainBot from './LangChainBot'
import store from '@/store'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

/**
 * Gemini API Bot 实现
 * 特点：
 * - 基于 LangChain Google GenAI
 * - 支持多种模型
 * - 流式响应
 */
export default class GeminiAPIBot extends LangChainBot {
  static _brandId = 'geminiApi'
  static _className = 'GeminiAPIBot'
  static _model = 'gemini-2.0-flash-exp'
  static _logoFilename = 'gemini-logo.png'

  /**
   * 检查可用性 - 需要 API Key
   */
  async _checkAvailability() {
    return !!store.state.geminiApi.apiKey
  }

  /**
   * 设置 LangChain 模型
   */
  _setupModel() {
    const config = store.state.geminiApi

    return new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      modelName: this.constructor._model,
      temperature: config.temperature,
      topK: config.topK,
      topP: config.topP,
      streaming: true
    })
  }

  /**
   * 获取历史轮数配置
   */
  getPastRounds() {
    return store.state.geminiApi.pastRounds || 5
  }
}
