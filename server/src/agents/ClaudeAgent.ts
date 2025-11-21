import axios from 'axios';
import EventSource from 'eventsource';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import {
  AgentType,
  ChatContext,
  StreamCallbackParam,
  StreamResponse,
  ClaudeCredentials
} from '../types';

/**
 * Claude Agent (Anthropic)
 *
 * 认证方式：Session Cookie + org 参数
 * API 文档参考：CHATALL_TECHNICAL_ANALYSIS.md 第 4.4 节
 */
export class ClaudeAgent extends BaseAgent {
  protected static _id: AgentType = 'claude';
  protected static _name = 'Claude';
  protected static _logoUrl = '/logos/claude.svg';
  protected static _loginUrl = 'https://claude.ai/';

  private readonly BASE_URL = 'https://claude.ai/api';

  /**
   * 检查 Agent 是否可用
   */
  protected async _checkAvailability(): Promise<boolean> {
    try {
      const credentials = this.credentials as ClaudeCredentials;

      if (!credentials?.cookies || !credentials?.org) {
        return false;
      }

      // 验证 session
      const response = await axios.get(`${this.BASE_URL}/account`, {
        headers: {
          Cookie: credentials.cookies
        },
        validateStatus: (status) => status < 500
      });

      return response.status === 200;
    } catch (error) {
      console.error('[Claude] Error checking availability:', error);
      return false;
    }
  }

  /**
   * 创建新的会话上下文
   */
  protected async createChatContext(): Promise<ChatContext> {
    try {
      const credentials = this.credentials as ClaudeCredentials;
      const uuid = uuidv4();

      const response = await axios.post(
        `${this.BASE_URL}/organizations/${credentials.org}/chat_conversations`,
        {
          name: '',
          uuid
        },
        {
          headers: {
            Cookie: credentials.cookies,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        uuid: response.data.uuid
      };
    } catch (error) {
      console.error('[Claude] Error creating chat context:', error);
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
        const credentials = this.credentials as ClaudeCredentials;
        const context = await this.getChatContext(callbackParam.sessionId);

        if (!context?.uuid) {
          throw new Error('No chat context available');
        }

        const url = `${this.BASE_URL}/organizations/${credentials.org}/chat_conversations/${context.uuid}/completion`;

        const payload = {
          attachments: [],
          files: [],
          prompt,
          timezone: 'Asia/Shanghai'
        };

        const eventSource = new EventSource(url, {
          headers: {
            Cookie: credentials.cookies,
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(payload)
        });

        let fullText = '';

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.completion) {
              fullText += data.completion;
              onUpdateResponse(callbackParam, {
                content: fullText,
                done: false
              });
            }

            // Claude 的 SSE 在连接关闭时自动结束
          } catch (error) {
            console.error('[Claude] Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('[Claude] SSE error:', error);
          eventSource.close();

          onUpdateResponse(callbackParam, {
            content: fullText,
            done: true
          });

          // 如果有内容，认为是成功的
          if (fullText) {
            resolve();
          } else {
            onUpdateResponse(callbackParam, {
              content: '',
              done: true,
              error: 'Connection error. Please try again.'
            });
            reject(error);
          }
        };

        // 设置超时检测（Claude 可能不发送明确的结束信号）
        let lastUpdateTime = Date.now();
        const checkInterval = setInterval(() => {
          const now = Date.now();
          if (now - lastUpdateTime > 3000 && fullText) {
            // 3 秒没有新数据且有内容，认为完成
            clearInterval(checkInterval);
            eventSource.close();
            onUpdateResponse(callbackParam, {
              content: fullText,
              done: true
            });
            resolve();
          }
        }, 1000);

        // 更新最后更新时间
        const originalOnMessage = eventSource.onmessage;
        eventSource.onmessage = (event) => {
          lastUpdateTime = Date.now();
          if (originalOnMessage) {
            originalOnMessage.call(eventSource, event);
          }
        };
      } catch (error) {
        console.error('[Claude] Error sending prompt:', error);
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
