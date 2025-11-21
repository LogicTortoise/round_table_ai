/**
 * API 客户端服务
 * 处理与后端的所有通信
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface Agent {
  id: string;
  name: string;
  logoUrl?: string;
  loginUrl?: string;
  isAvailable: boolean;
  isLoggedIn: boolean;
}

export interface Session {
  id: string;
  name: string;
  agents: string[];
  contexts: Record<string, any>;
  createdAt: string;
  lastActivityAt: string;
}

export interface StreamMessage {
  agentId: string;
  sessionId: string;
  content: string;
  done: boolean;
  error?: string;
}

/**
 * Agent API
 */
export const agentApi = {
  /**
   * 获取所有 Agent 列表
   */
  async getAll(): Promise<{ agents: Agent[] }> {
    const response = await fetch(`${API_BASE_URL}/api/agents`);
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    return response.json();
  },

  /**
   * 获取指定 Agent 的状态
   */
  async getStatus(agentId: string): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent status: ${agentId}`);
    }
    return response.json();
  },

  /**
   * 设置 Agent 登录凭证
   */
  async login(agentId: string, credentials: any): Promise<{ success: boolean; status: Agent }> {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ credentials })
    });

    if (!response.ok) {
      throw new Error(`Failed to login agent: ${agentId}`);
    }

    return response.json();
  }
};

/**
 * 会话 API
 */
export const sessionApi = {
  /**
   * 获取所有会话
   */
  async getAll(): Promise<{ sessions: Session[] }> {
    const response = await fetch(`${API_BASE_URL}/api/sessions`);
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    return response.json();
  },

  /**
   * 获取指定会话
   */
  async get(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${sessionId}`);
    }
    return response.json();
  },

  /**
   * 创建新会话
   */
  async create(name: string, agents: string[]): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, agents })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    return response.json();
  },

  /**
   * 更新会话
   */
  async update(
    sessionId: string,
    data: { name?: string; agents?: string[]; contexts?: Record<string, any> }
  ): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update session: ${sessionId}`);
    }

    return response.json();
  },

  /**
   * 删除会话
   */
  async delete(sessionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${sessionId}`);
    }

    return response.json();
  }
};

/**
 * 对话 API
 */
export const chatApi = {
  /**
   * 发送消息并接收 SSE 流式响应
   */
  async sendMessage(
    message: string,
    agents: string[],
    sessionId: string,
    onMessage: (msg: StreamMessage) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, agents, sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            if (data === '[DONE]') {
              return;
            }

            try {
              const message: StreamMessage = JSON.parse(data);
              onMessage(message);
            } catch (error) {
              console.error('Error parsing SSE message:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }
};
