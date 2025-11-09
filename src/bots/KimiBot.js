import AsyncLock from 'async-lock'
import Bot from './Bot'
import axios from 'axios'
import store from '@/store'
import { SSE } from 'sse.js'

/**
 * Kimi (月之暗面) Bot 实现
 * 特点：
 * - 基于 Token 认证
 * - 支持 Token 自动刷新
 * - SSE 流式响应
 * - 支持联网搜索
 */
export default class KimiBot extends Bot {
  static _brandId = 'kimi'
  static _className = 'KimiBot'
  static _model = 'moonshot-v1'
  static _logoFilename = 'kimi-logo.png'
  static _loginUrl = 'https://kimi.moonshot.cn/'
  static _lock = new AsyncLock()

  /**
   * 获取认证头
   */
  getAuthHeader() {
    return {
      headers: {
        Authorization: `Bearer ${store.state.kimi?.access_token}`
      }
    }
  }

  /**
   * 刷新 Token
   */
  async refreshTokens() {
    const currentRefreshToken = store.state.kimi?.refresh_token

    if (!currentRefreshToken) {
      throw new Error('没有 refresh_token，请重新登录')
    }

    console.log('[Kimi] 正在刷新 token...')
    const refreshUrl = 'https://kimi.moonshot.cn/api/auth/token/refresh'

    try {
      const response = await axios.get(refreshUrl, {
        headers: {
          Authorization: `Bearer ${currentRefreshToken}`
        }
      })

      const newAccessToken = response.data?.access_token
      const newRefreshToken = response.data?.refresh_token

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Token 刷新响应无效')
      }

      // 更新 store 中的 token
      store.commit('setKimi', {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      })

      console.log('[Kimi] Token 刷新成功')

      return response.data
    } catch (error) {
      console.error('[Kimi] Token 刷新失败:', error.message)
      throw error
    }
  }

  /**
   * 检查可用性 - 尝试刷新 Token
   */
  async _checkAvailability() {
    const hasTokens = !!(store.state.kimi?.access_token && store.state.kimi?.refresh_token)

    if (!hasTokens) {
      console.log('[Kimi] 没有保存的 token')
      return false
    }

    try {
      await this.refreshTokens()
      return true
    } catch (error) {
      console.error('[Kimi] Token 刷新失败:', error.message)
      return false
    }
  }

  /**
   * 创建新的对话上下文
   */
  async createChatContext() {
    try {
      const response = await axios.post(
        'https://kimi.moonshot.cn/api/chat',
        {
          is_example: false,
          name: 'RoundTable AI'
        },
        this.getAuthHeader()
      )

      return {
        chat: response.data?.id
      }
    } catch (error) {
      console.error('Error creating Kimi chat context:', error)
      throw error
    }
  }

  /**
   * 发送提示 - 核心实现
   */
  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    const context = await this.getChatContext()

    if (!context?.chat) {
      throw new Error('无法创建对话上下文')
    }

    return new Promise((resolve, reject) => {
      const headers = this.getAuthHeader().headers
      headers['Content-Type'] = 'application/json'

      try {
        const source = new SSE(
          `https://kimi.moonshot.cn/api/chat/${context.chat}/completion/stream`,
          {
            headers,
            payload: JSON.stringify({
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              refs: [],
              use_search: store.state.kimi.enableSearch
            }),
            withCredentials: true
          }
        )

        let searchInfo = '' // 搜索信息
        let mainContent = '' // 正文内容

        source.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data)

            // 处理搜索事件
            if (data.event === 'search_plus') {
              if (data.msg?.type === 'start_res') {
                searchInfo += '> 正在搜索...\n'
              } else if (data.msg?.type === 'get_res') {
                const { successNum, title, url } = data.msg
                searchInfo += `> 找到 ${successNum} 条结果: [${title}](${url})\n`
              }
            }
            // 处理内容事件
            else if (data.event === 'cmpl') {
              mainContent += data.text
            }

            // 组合并输出
            const content = searchInfo ? `${searchInfo}\n${mainContent}` : mainContent

            if (data.event === 'all_done') {
              onUpdateResponse(callbackParam, {
                content,
                done: true
              })
              resolve()
            } else {
              onUpdateResponse(callbackParam, {
                content,
                done: false
              })
            }
          } catch (error) {
            console.error('Parse SSE error:', error)
          }
        })

        source.addEventListener('error', (event) => {
          console.error('SSE error:', event)
          reject(new Error('连接错误'))
        })

        source.stream()
      } catch (error) {
        reject(error)
      }
    })
  }
}
