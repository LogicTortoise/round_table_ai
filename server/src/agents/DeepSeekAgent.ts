import axios from 'axios';
import EventSource from 'eventsource';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import {
  AgentType,
  ChatContext,
  StreamCallbackParam,
  StreamResponse,
  DeepSeekCredentials
} from '../types';

/**
 * DeepSeek Agent
 *
 * 认证方式：Bearer Token
 * API 文档参考：CHATALL_TECHNICAL_ANALYSIS.md 第 4.3 节
 */
export class DeepSeekAgent extends BaseAgent {
  protected static _id: AgentType = 'deepseek';
  protected static _name = 'DeepSeek';
  protected static _logoUrl = '/logos/deepseek.svg';
  protected static _loginUrl = 'https://chat.deepseek.com/';

  private readonly BASE_URL = 'https://chat.deepseek.com/api';

  /**
   * 检查 Agent 是否可用
   */
  protected async _checkAvailability(): Promise<boolean> {
    try {
      const credentials = this.credentials as DeepSeekCredentials;

      if (!credentials?.token) {
        return false;
      }

      // 简单验证：尝试访问 API
      // DeepSeek 没有专门的验证接口，我们在实际发送消息时验证
      return true;
    } catch (error) {
      console.error('[DeepSeek] Error checking availability:', error);
      return false;
    }
  }

  /**
   * 创建新的会话上下文
   */
  protected async createChatContext(): Promise<ChatContext> {
    return {
      chatId: uuidv4(),
      parentMessageId: uuidv4()
    };
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
        const credentials = this.credentials as DeepSeekCredentials;
        const context = await this.getChatContext(callbackParam.sessionId);

        if (!context) {
          throw new Error('No chat context available');
        }

        const url = `${this.BASE_URL}/v0/chat/completions`;

        const payload = {
          message: prompt,
          model: 'deepseek_chat',
          stream: true,
          chat_session_id: context.chatId,
          parent_message_id: context.parentMessageId,
          thinking_enabled: true,
          search_enabled: false
        };

        const eventSource = new EventSource(url, {
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
            'x-app-version': '20241129.1',
            'x-client-platform': 'web',
            'x-client-version': '1.5.0'
          },
          method: 'POST',
          body: JSON.stringify(payload)
        });

        let fullText = '';
        let thinkingText = '';
        let newChatId: string | null = null;
        let newMessageId: string | null = null;
        const showThinking = true; // 可以从配置中获取

        eventSource.onmessage = (event) => {
          try {
            if (event.data === '[DONE]') {
              // 更新 context
              if (newChatId && newMessageId) {
                this.setChatContext(callbackParam.sessionId, {
                  chatId: newChatId,
                  parentMessageId: newMessageId
                });
              }

              onUpdateResponse(callbackParam, {
                content: fullText,
                done: true
              });
              eventSource.close();
              resolve();
              return;
            }

            const data = JSON.parse(event.data);

            // 提取会话信息
            if (data.chat_id) {
              newChatId = data.chat_id;
            }
            if (data.message_id) {
              newMessageId = data.message_id;
            }

            // 处理思考过程
            if (data.type === 'thinking' && data.content) {
              thinkingText += data.content;

              if (showThinking) {
                const displayText = `**[Thinking]**\n${thinkingText}\n\n${fullText}`;
                onUpdateResponse(callbackParam, {
                  content: displayText,
                  done: false
                });
              }
            }

            // 处理实际回答
            if (data.type === 'text' && data.content) {
              fullText += data.content;

              let displayText = fullText;
              if (showThinking && thinkingText) {
                displayText = `**[Thinking]**\n${thinkingText}\n\n${fullText}`;
              }

              onUpdateResponse(callbackParam, {
                content: displayText,
                done: false
              });
            }
          } catch (error) {
            console.error('[DeepSeek] Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('[DeepSeek] SSE error:', error);
          eventSource.close();

          onUpdateResponse(callbackParam, {
            content: fullText || '',
            done: true,
            error: 'Connection error. Please try again.'
          });
          reject(error);
        };
      } catch (error) {
        console.error('[DeepSeek] Error sending prompt:', error);
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
