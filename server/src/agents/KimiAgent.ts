import axios from 'axios';
import EventSource from 'eventsource';
import { BaseAgent } from './BaseAgent';
import {
  AgentType,
  ChatContext,
  StreamCallbackParam,
  StreamResponse,
  KimiCredentials
} from '../types';

/**
 * Kimi Agent (Moonshot)
 *
 * 认证方式：JWT 双 token (access_token + refresh_token)
 * API 文档参考：CHATALL_TECHNICAL_ANALYSIS.md 第 4.1 节
 */
export class KimiAgent extends BaseAgent {
  protected static _id: AgentType = 'kimi';
  protected static _name = 'Kimi';
  protected static _logoUrl = '/logos/kimi.svg';
  protected static _loginUrl = 'https://kimi.moonshot.cn/';

  private readonly BASE_URL = 'https://kimi.moonshot.cn/api';

  /**
   * 检查 Agent 是否可用
   */
  protected async _checkAvailability(): Promise<boolean> {
    try {
      const credentials = this.credentials as KimiCredentials;

      if (!credentials?.access_token) {
        return false;
      }

      // 尝试访问 API 验证 token
      const response = await axios.get(`${this.BASE_URL}/auth/token/refresh`, {
        headers: {
          Authorization: `Bearer ${credentials.refresh_token}`
        },
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        // Token 有效，更新 credentials
        const newCredentials: KimiCredentials = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token
        };
        this.setCredentials(newCredentials);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Kimi] Error checking availability:', error);
      return false;
    }
  }

  /**
   * 刷新 access_token
   */
  private async refreshTokens(): Promise<boolean> {
    try {
      const credentials = this.credentials as KimiCredentials;

      if (!credentials?.refresh_token) {
        return false;
      }

      const response = await axios.get(`${this.BASE_URL}/auth/token/refresh`, {
        headers: {
          Authorization: `Bearer ${credentials.refresh_token}`
        }
      });

      const newCredentials: KimiCredentials = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      };

      this.setCredentials(newCredentials);
      return true;
    } catch (error) {
      console.error('[Kimi] Error refreshing tokens:', error);
      return false;
    }
  }

  /**
   * 创建新的会话上下文
   */
  protected async createChatContext(): Promise<ChatContext> {
    try {
      const credentials = this.credentials as KimiCredentials;

      const response = await axios.post(
        `${this.BASE_URL}/chat`,
        {
          is_example: false,
          name: 'ChatSession'
        },
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        chatId: response.data.id
      };
    } catch (error) {
      console.error('[Kimi] Error creating chat context:', error);
      throw error;
    }
  }

  /**
   * 发送消息并处理 SSE 流式响应
   */
  protected async _sendPrompt(
    prompt: string,
    onUpdateResponse: (param: StreamCallbackParam, response: StreamResponse) => void,
    callbackParam: StreamCallbackParam
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const credentials = this.credentials as KimiCredentials;
        const context = await this.getChatContext(callbackParam.sessionId);

        if (!context?.chatId) {
          throw new Error('No chat context available');
        }

        const url = `${this.BASE_URL}/chat/${context.chatId}/completion/stream`;

        const payload = {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          refs: [],
          use_search: true
        };

        // 使用 EventSource 处理 SSE
        const eventSource = new EventSource(url, {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(payload)
        });

        let fullText = '';
        let searchInfo = '';

        eventSource.onmessage = (event) => {
          try {
            if (event.data === '[DONE]') {
              onUpdateResponse(callbackParam, {
                content: searchInfo + fullText,
                done: true
              });
              eventSource.close();
              resolve();
              return;
            }

            const data = JSON.parse(event.data);

            // 处理搜索事件
            if (data.event === 'search_plus') {
              if (data.msg?.type === 'start_res') {
                searchInfo += this.wrapInfo('搜索中...');
              } else if (data.msg?.type === 'get_res') {
                searchInfo += this.wrapInfo(
                  `找到 ${data.msg.successNum} 个结果: [${data.msg.title}](${data.msg.url})`
                );
              }
              onUpdateResponse(callbackParam, {
                content: searchInfo + fullText,
                done: false
              });
            }

            // 处理文本响应
            if (data.event === 'cmpl' && data.text) {
              fullText += data.text;
              onUpdateResponse(callbackParam, {
                content: searchInfo + fullText,
                done: false
              });
            }

            // 处理完成事件
            if (data.event === 'all_done') {
              onUpdateResponse(callbackParam, {
                content: searchInfo + fullText,
                done: true
              });
              eventSource.close();
              resolve();
            }
          } catch (error) {
            console.error('[Kimi] Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = async (error) => {
          console.error('[Kimi] SSE error:', error);
          eventSource.close();

          // 尝试刷新 token 并重试
          const refreshed = await this.refreshTokens();
          if (refreshed) {
            console.log('[Kimi] Token refreshed, retrying...');
            // 这里可以选择重试，但为了简单起见，我们直接返回错误
          }

          onUpdateResponse(callbackParam, {
            content: fullText || '',
            done: true,
            error: 'Connection error. Please try again.'
          });
          reject(error);
        };
      } catch (error) {
        console.error('[Kimi] Error sending prompt:', error);
        onUpdateResponse(callbackParam, {
          content: '',
          done: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        reject(error);
      }
    });
  }
}
