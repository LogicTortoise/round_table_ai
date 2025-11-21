/**
 * Agent 类型定义
 */
export type AgentType = 'kimi' | 'chatgpt' | 'claude' | 'deepseek';

/**
 * Agent 配置
 */
export interface AgentConfig {
  id: AgentType;
  name: string;
  logoUrl?: string;
  loginUrl?: string;
  isEnabled: boolean;
  credentials?: any;
  settings?: Record<string, any>;
}

/**
 * Agent 状态
 */
export interface AgentStatus {
  id: AgentType;
  isAvailable: boolean;
  isLoggedIn: boolean;
  error?: string;
}

/**
 * 会话上下文（每个 Agent 独立维护）
 */
export interface ChatContext {
  [key: string]: any;
}

/**
 * 消息
 */
export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  agentId?: AgentType;
  content: string;
  timestamp: Date;
}

/**
 * 会话
 */
export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  lastActivityAt: Date;
  agents: AgentType[];
  contexts: Record<AgentType, ChatContext>;
}

/**
 * SSE 响应回调参数
 */
export interface StreamCallbackParam {
  agentId: AgentType;
  sessionId: string;
}

/**
 * SSE 响应数据
 */
export interface StreamResponse {
  content: string;
  done: boolean;
  error?: string;
}

/**
 * Agent 凭证类型
 */
export interface KimiCredentials {
  access_token: string;
  refresh_token: string;
}

export interface ChatGPTCredentials {
  cookies: string;
  accessToken?: string;
}

export interface ClaudeCredentials {
  cookies: string;
  org: string;
}

export interface DeepSeekCredentials {
  token: string;
}

export type AgentCredentials =
  | KimiCredentials
  | ChatGPTCredentials
  | ClaudeCredentials
  | DeepSeekCredentials;
