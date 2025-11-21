import {
  AgentType,
  AgentStatus,
  ChatContext,
  StreamCallbackParam,
  StreamResponse,
  AgentCredentials
} from '../types';

/**
 * BaseAgent 抽象类
 *
 * 设计模式：模板方法模式
 * 参考 ChatALL 的 Bot 基类设计
 *
 * 核心职责：
 * 1. 定义统一的 Agent 接口
 * 2. 管理 Agent 的生命周期
 * 3. 提供通用的工具方法
 */
export abstract class BaseAgent {
  // ==================== 静态属性（子类必须定义） ====================

  /**
   * Agent 唯一标识
   */
  protected static _id: AgentType;

  /**
   * Agent 显示名称
   */
  protected static _name: string;

  /**
   * Logo URL
   */
  protected static _logoUrl?: string;

  /**
   * 登录页面 URL
   */
  protected static _loginUrl?: string;

  /**
   * 是否可用（静态缓存）
   */
  protected static _isAvailable: boolean = false;

  // ==================== 实例属性 ====================

  /**
   * 认证凭证
   */
  protected credentials?: AgentCredentials;

  /**
   * 会话上下文存储（sessionId -> context）
   */
  protected contexts: Map<string, ChatContext> = new Map();

  // ==================== 抽象方法（子类必须实现） ====================

  /**
   * 检查 Agent 是否可用
   *
   * 实现要点：
   * - 检查是否已登录
   * - 检查凭证是否有效
   * - 更新 _isAvailable 静态属性
   *
   * @returns Promise<boolean>
   */
  protected abstract _checkAvailability(): Promise<boolean>;

  /**
   * 发送消息并接收流式响应
   *
   * 实现要点：
   * - 构造请求参数
   * - 发起 SSE 请求
   * - 处理流式响应
   * - 调用 onUpdateResponse 回调
   *
   * @param prompt 用户输入
   * @param onUpdateResponse 流式响应回调
   * @param callbackParam 回调参数
   * @returns Promise<void>
   */
  protected abstract _sendPrompt(
    prompt: string,
    onUpdateResponse: (param: StreamCallbackParam, response: StreamResponse) => void,
    callbackParam: StreamCallbackParam
  ): Promise<void>;

  /**
   * 创建新的会话上下文
   *
   * 实现要点：
   * - 调用 Agent API 创建新会话
   * - 返回会话上下文对象
   *
   * @returns Promise<ChatContext>
   */
  protected abstract createChatContext(): Promise<ChatContext>;

  // ==================== 公共方法 ====================

  /**
   * 获取 Agent ID
   */
  public getId(): AgentType {
    return (this.constructor as typeof BaseAgent)._id;
  }

  /**
   * 获取 Agent 名称
   */
  public getName(): string {
    return (this.constructor as typeof BaseAgent)._name;
  }

  /**
   * 获取 Logo URL
   */
  public getLogoUrl(): string | undefined {
    return (this.constructor as typeof BaseAgent)._logoUrl;
  }

  /**
   * 获取登录 URL
   */
  public getLoginUrl(): string | undefined {
    return (this.constructor as typeof BaseAgent)._loginUrl;
  }

  /**
   * 获取 Agent 状态
   */
  public async getStatus(): Promise<AgentStatus> {
    try {
      const isAvailable = await this._checkAvailability();
      return {
        id: this.getId(),
        isAvailable,
        isLoggedIn: this.credentials !== undefined
      };
    } catch (error) {
      return {
        id: this.getId(),
        isAvailable: false,
        isLoggedIn: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 设置认证凭证
   */
  public setCredentials(credentials: AgentCredentials): void {
    this.credentials = credentials;
    // 重置可用性状态，强制下次检查
    (this.constructor as typeof BaseAgent)._isAvailable = false;
  }

  /**
   * 获取认证凭证
   */
  public getCredentials(): AgentCredentials | undefined {
    return this.credentials;
  }

  /**
   * 获取或创建会话上下文
   *
   * @param sessionId 会话ID
   * @param createIfNotExists 如果不存在是否创建
   * @returns Promise<ChatContext | null>
   */
  public async getChatContext(
    sessionId: string,
    createIfNotExists: boolean = true
  ): Promise<ChatContext | null> {
    let context = this.contexts.get(sessionId);

    if (!context && createIfNotExists) {
      context = await this.createChatContext();
      this.contexts.set(sessionId, context);
    }

    return context || null;
  }

  /**
   * 设置会话上下文
   */
  public setChatContext(sessionId: string, context: ChatContext): void {
    this.contexts.set(sessionId, context);
  }

  /**
   * 清除会话上下文
   */
  public clearChatContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  /**
   * 发送消息（公共接口）
   *
   * @param prompt 用户输入
   * @param sessionId 会话ID
   * @param onUpdateResponse 流式响应回调
   * @returns Promise<void>
   */
  public async sendPrompt(
    prompt: string,
    sessionId: string,
    onUpdateResponse: (param: StreamCallbackParam, response: StreamResponse) => void
  ): Promise<void> {
    const callbackParam: StreamCallbackParam = {
      agentId: this.getId(),
      sessionId
    };

    try {
      // 检查可用性
      const isAvailable = await this._checkAvailability();
      if (!isAvailable) {
        onUpdateResponse(callbackParam, {
          content: '',
          done: true,
          error: 'Agent is not available. Please login first.'
        });
        return;
      }

      // 调用子类实现的发送方法
      await this._sendPrompt(prompt, onUpdateResponse, callbackParam);
    } catch (error) {
      console.error(`[${this.getId()}] Error sending prompt:`, error);
      onUpdateResponse(callbackParam, {
        content: '',
        done: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 包装错误消息为可折叠区域（Markdown 格式）
   */
  protected wrapError(message: string): string {
    return `<details>\n<summary>❌ Error</summary>\n\n${message}\n\n</details>`;
  }

  /**
   * 包装提示消息
   */
  protected wrapInfo(message: string): string {
    return `> ℹ️ ${message}\n\n`;
  }
}
