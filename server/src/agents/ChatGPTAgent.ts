import axios from 'axios';
import EventSource from 'eventsource';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import {
  AgentType,
  ChatContext,
  StreamCallbackParam,
  StreamResponse,
  ChatGPTCredentials
} from '../types';

/**
 * ChatGPT Agent
 *
 * 认证方式：Session Cookie + Bearer Token
 * API 文档参考：CHATALL_TECHNICAL_ANALYSIS.md 第 4.2 节
 *
 * 注意：这是一个简化版本，不包含 Arkose Labs 验证
 */
export class ChatGPTAgent extends BaseAgent {
  protected static _id: AgentType = 'chatgpt';
  protected static _name = 'ChatGPT';
  protected static _logoUrl = '/logos/chatgpt.svg';
  protected static _loginUrl = 'https://chatgpt.com/';

  private readonly BASE_URL = 'https://chatgpt.com';
  private accessToken?: string;

  /**
   * 检查 Agent 是否可用
   */
  protected async _checkAvailability(): Promise<boolean> {
    try {
      const credentials = this.credentials as ChatGPTCredentials;

      if (!credentials?.cookies) {
        return false;
      }

      // 获取 session 和 accessToken
      const response = await axios.get(`${this.BASE_URL}/api/auth/session`, {
        headers: {
          Cookie: credentials.cookies
        },
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ChatGPT] Error checking availability:', error);
      return false;
    }
  }

  /**
   * 获取 Sentinel token
   */
  private async getSentinelToken(): Promise<string | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const response = await axios.post(
        `${this.BASE_URL}/backend-api/sentinel/chat-requirements`,
        undefined,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.token;
    } catch (error) {
      console.error('[ChatGPT] Error getting sentinel token:', error);
      return null;
    }
  }

  /**
   * 创建新的会话上下文
   */
  protected async createChatContext(): Promise<ChatContext> {
    return {
      conversationId: null,
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
        const credentials = this.credentials as ChatGPTCredentials;
        const context = await this.getChatContext(callbackParam.sessionId);

        if (!context) {
          throw new Error('No chat context available');
        }

        // 获取 sentinel token
        const sentinelToken = await this.getSentinelToken();

        if (!sentinelToken) {
          throw new Error('Failed to get sentinel token');
        }

        const url = `${this.BASE_URL}/backend-api/conversation`;

        const payload = {
          action: 'next',
          conversation_mode: {
            kind: 'primary_assistant'
          },
          messages: [
            {
              id: uuidv4(),
              author: { role: 'user' },
              content: {
                content_type: 'text',
                parts: [prompt]
              }
            }
          ],
          conversation_id: context.conversationId,
          parent_message_id: context.parentMessageId,
          model: 'auto',
          history_and_training_disabled: false
        };

        const eventSource = new EventSource(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Openai-Sentinel-Chat-Requirements-Token': sentinelToken,
            'Content-Type': 'application/json',
            Cookie: credentials.cookies
          },
          method: 'POST',
          body: JSON.stringify(payload)
        });

        let fullText = '';
        let newConversationId: string | null = null;
        let newMessageId: string | null = null;

        eventSource.onmessage = (event) => {
          try {
            if (event.data === '[DONE]') {
              // 更新 context
              if (newConversationId && newMessageId) {
                this.setChatContext(callbackParam.sessionId, {
                  conversationId: newConversationId,
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

            // 提取 conversation_id
            if (data.conversation_id) {
              newConversationId = data.conversation_id;
            }

            // 提取消息内容
            if (data.message?.content?.content_type === 'text') {
              const parts = data.message.content.parts || [];
              fullText = parts.join('');
              newMessageId = data.message.id;

              onUpdateResponse(callbackParam, {
                content: fullText,
                done: false
              });
            }

            // 处理引用
            if (data.message?.metadata?.citations) {
              const citations = data.message.metadata.citations;
              let citationText = '\n\n**引用：**\n';
              citations.forEach((cite: any, index: number) => {
                citationText += `${index + 1}. [${cite.metadata.title}](${cite.metadata.url})\n`;
              });
              fullText += citationText;

              onUpdateResponse(callbackParam, {
                content: fullText,
                done: false
              });
            }
          } catch (error) {
            console.error('[ChatGPT] Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('[ChatGPT] SSE error:', error);
          eventSource.close();

          onUpdateResponse(callbackParam, {
            content: fullText || '',
            done: true,
            error: 'Connection error. Please try again.'
          });
          reject(error);
        };
      } catch (error) {
        console.error('[ChatGPT] Error sending prompt:', error);
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
