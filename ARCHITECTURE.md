# RoundTable AI 架构文档

## 目录

1. [系统概述](#系统概述)
2. [整体架构](#整体架构)
3. [前端架构](#前端架构)
4. [后端架构](#后端架构)
5. [Agent 设计模式](#agent-设计模式)
6. [数据流](#数据流)
7. [API 接口](#api-接口)
8. [技术栈](#技术栈)
9. [目录结构](#目录结构)
10. [安全设计](#安全设计)

---

## 系统概述

RoundTable AI 是一个多 AI Agent 并行对话平台，允许用户同时与多个 AI 助手（Kimi、ChatGPT、Claude、DeepSeek）进行交互，并对比它们的回答。

### 核心特性

- ✅ **多 Agent 并行对话**：同时向多个 AI 发送消息，实时获取响应
- ✅ **流式响应**：使用 SSE (Server-Sent Events) 实现实时流式输出
- ✅ **会话管理**：支持创建、切换、保存多个对话会话
- ✅ **Agent 管理**：统一管理官方和自定义 AI Agent
- ✅ **凭证安全**：AES-256 加密存储 Token 和 Cookie
- ✅ **模块化设计**：基于模板方法模式的可扩展架构

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层 (React SPA)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI 组件层                                             │  │
│  │  ├─ 主工作台 (MainWorkbench)                          │  │
│  │  ├─ Agent 管理 (AgentManagement)                      │  │
│  │  ├─ 会话历史 (SessionHistory)                         │  │
│  │  └─ 系统设置 (SystemSettings)                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  服务层                                                │  │
│  │  ├─ API 客户端 (api.ts)                               │  │
│  │  ├─ SSE 处理 (chatApi.sendMessage)                    │  │
│  │  └─ 状态管理 (React Hooks)                            │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/SSE (REST API)
┌────────────────────┴────────────────────────────────────────┐
│                 后端层 (Node.js + Express)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Gateway (Express Routes)                         │  │
│  │  ├─ /api/agents/*     Agent 管理路由                  │  │
│  │  ├─ /api/chat         SSE 流式对话路由                │  │
│  │  └─ /api/sessions/*   会话管理路由                    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  业务逻辑层 (Agent 适配器)                            │  │
│  │  ├─ BaseAgent (抽象基类 - 模板方法模式)              │  │
│  │  ├─ KimiAgent (JWT Token 认证)                        │  │
│  │  ├─ ChatGPTAgent (Session + Bearer Token)             │  │
│  │  ├─ ClaudeAgent (Cookie + org 参数)                   │  │
│  │  └─ DeepSeekAgent (Bearer Token + Thinking)           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  数据持久化层                                          │  │
│  │  └─ StorageService (SQLite + AES-256 加密)            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 前端架构

### 技术选型

- **框架**：React 19.0.0
- **构建工具**：Vite 6.0.11
- **路由**：React Router DOM v7
- **样式**：CSS Modules + Tailwind CSS
- **TypeScript**：严格类型检查

### 页面结构

#### 1. 主工作台 (P-MAIN_WORKBENCH)

**路径**：`/main-workbench`

**功能**：
- 多 Agent 并行对话界面
- 实时流式响应显示
- 消息输入和发送
- Agent 选择和启用/禁用

#### 2. Agent 管理 (P-AGENT_MANAGEMENT)

**路径**：`/agent-management`

**功能**：
- **官方聊天助手**：显示后端 Agent (Kimi, ChatGPT, Claude, DeepSeek)
  - 登录状态显示（已登录/未登录）
  - 登录跳转链接
  - 状态刷新按钮
- **自定义 Agent**：用户创建的 Agent
  - 创建、编辑、删除
  - 启用/禁用
  - 配置管理
- 表格视图和卡片视图切换
- 搜索、筛选、排序功能

**数据结构**：
```typescript
interface AgentData {
  id: string;
  name: string;
  type: 'kimi' | 'chatgpt' | 'claude' | 'deepseek' | 'gpt' | 'gemini' | 'custom';
  typeName: string;
  description: string;
  status: 'active' | 'disabled';
  model: string;
  createdAt: string;
  rolePrompt: string;
  category: 'official' | 'custom';  // 区分官方和自定义
  isBackendAgent?: boolean;         // 是否为后端 Agent
  isLoggedIn?: boolean;              // 登录状态
  loginUrl?: string;                 // 登录 URL
  temperature?: number;
  maxTokens?: number;
}
```

#### 3. 会话历史 (P-SESSION_HISTORY)

**路径**：`/session-history`

**功能**：
- 查看所有历史会话
- 会话切换
- 会话重命名
- 会话删除
- 消息记录查看

#### 4. 系统设置 (P-SYSTEM_SETTINGS)

**路径**：`/system-settings`

**功能**：
- 主题设置
- 语言设置
- 通知设置
- 系统偏好

### API 客户端 (src/services/api.ts)

#### Agent API

```typescript
export const agentApi = {
  // 获取所有 Agent 列表（包含后端 Agent）
  async getAll(): Promise<{ agents: Agent[] }>

  // 获取指定 Agent 状态
  async getStatus(agentId: string): Promise<Agent>

  // 设置 Agent 登录凭证
  async login(agentId: string, credentials: any): Promise<{ success: boolean; status: Agent }>
}
```

#### Session API

```typescript
export const sessionApi = {
  // 获取所有会话
  async getAll(): Promise<{ sessions: Session[] }>

  // 获取指定会话
  async get(sessionId: string): Promise<Session>

  // 创建新会话
  async create(name: string, agents: string[]): Promise<Session>

  // 更新会话
  async update(sessionId: string, data: any): Promise<Session>

  // 删除会话
  async delete(sessionId: string): Promise<{ success: boolean }>
}
```

#### Chat API

```typescript
export const chatApi = {
  // 发送消息并接收 SSE 流式响应
  async sendMessage(
    message: string,
    agents: string[],
    sessionId: string,
    onMessage: (msg: StreamMessage) => void,
    onError?: (error: Error) => void
  ): Promise<void>
}
```

---

## 后端架构

### 技术选型

- **运行时**：Node.js v20+
- **框架**：Express.js
- **语言**：TypeScript (严格模式)
- **数据库**：SQLite (better-sqlite3)
- **加密**：crypto (AES-256-CBC)
- **HTTP 客户端**：axios
- **SSE 客户端**：eventsource

### 核心模块

#### 1. Express 服务器 (server/src/index.ts)

**功能**：
- 初始化 Express 应用
- 配置 CORS 中间件
- 注册路由
- 初始化 Agent 实例
- 错误处理

**关键代码**：
```typescript
export class RoundTableServer {
  private app: Express;
  private agents: Map<AgentType, BaseAgent>;
  private storageService: StorageService;

  constructor() {
    this.app = express();
    this.agents = new Map();
    this.storageService = new StorageService();
    this.initializeMiddleware();
    this.initializeAgents();
    this.initializeRoutes();
  }

  private initializeAgents(): void {
    this.agents.set('kimi', new KimiAgent());
    this.agents.set('chatgpt', new ChatGPTAgent());
    this.agents.set('claude', new ClaudeAgent());
    this.agents.set('deepseek', new DeepSeekAgent());
  }
}
```

#### 2. 路由层

##### Agent 路由 (server/src/routes/agents.ts)

```typescript
// GET /api/agents
// 获取所有 Agent 列表和状态
router.get('/agents', async (req, res) => {
  const agentList = await Promise.all(
    Array.from(agents.entries()).map(async ([id, agent]) => ({
      id,
      name: agent.constructor.name,
      isAvailable: await agent.checkAvailability(),
      isLoggedIn: /* 检查登录状态 */,
      loginUrl: agent.getLoginUrl()
    }))
  );
  res.json({ agents: agentList });
});

// GET /api/agents/:agentId/status
// 获取指定 Agent 状态

// POST /api/agents/:agentId/login
// 设置 Agent 登录凭证
```

##### 对话路由 (server/src/routes/chat.ts)

```typescript
// POST /api/chat
// SSE 流式对话
router.post('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { message, agents: agentIds, sessionId } = req.body;

  // 并行调用多个 Agent
  await Promise.all(
    agentIds.map(agentId => {
      const agent = agents.get(agentId);
      return agent.sendPrompt(
        message,
        (content: string, done: boolean) => {
          // 发送 SSE 事件
          res.write(`data: ${JSON.stringify({
            agentId,
            sessionId,
            content,
            done
          })}\n\n`);
        },
        { sessionId }
      );
    })
  );

  res.write('data: [DONE]\n\n');
  res.end();
});
```

##### 会话路由 (server/src/routes/sessions.ts)

```typescript
// GET /api/sessions          - 获取所有会话
// GET /api/sessions/:id      - 获取指定会话
// POST /api/sessions         - 创建新会话
// PUT /api/sessions/:id      - 更新会话
// DELETE /api/sessions/:id   - 删除会话
// GET /api/sessions/:id/messages - 获取会话消息
```

---

## Agent 设计模式

### 模板方法模式 (Template Method Pattern)

#### BaseAgent 抽象类

**文件**：`server/src/agents/BaseAgent.ts`

**核心设计**：
```typescript
export abstract class BaseAgent {
  // ========== 静态属性（子类定义） ==========
  protected static _id: AgentType;
  protected static _name: string;
  protected static _logoUrl?: string;
  protected static _loginUrl?: string;
  protected static _isAvailable: boolean = false;

  // ========== 抽象方法（子类必须实现） ==========

  // 检查 Agent 可用性
  protected abstract _checkAvailability(): Promise<boolean>;

  // 发送消息并处理响应（核心方法）
  protected abstract _sendPrompt(
    prompt: string,
    onUpdateResponse: (content: string, done: boolean) => void,
    callbackParam: CallbackParam
  ): Promise<void>;

  // 创建聊天上下文
  protected abstract createChatContext(): Promise<ChatContext>;

  // ========== 公共方法（统一接口） ==========

  // 发送消息（模板方法）
  public async sendPrompt(
    prompt: string,
    onUpdateResponse: (content: string, done: boolean) => void,
    callbackParam: CallbackParam
  ): Promise<void> {
    try {
      // 前置检查
      if (!this.credentials) {
        throw new Error(`${this.constructor.name}: Not logged in`);
      }

      // 调用子类实现
      await this._sendPrompt(prompt, onUpdateResponse, callbackParam);
    } catch (error) {
      // 统一错误处理
      console.error(`${this.constructor.name} error:`, error);
      onUpdateResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  // 获取 Agent 状态
  public async getStatus(): Promise<AgentStatus> {
    const isAvailable = await this._checkAvailability();
    return {
      id: (this.constructor as typeof BaseAgent)._id,
      name: (this.constructor as typeof BaseAgent)._name,
      logoUrl: (this.constructor as typeof BaseAgent)._logoUrl,
      loginUrl: (this.constructor as typeof BaseAgent)._loginUrl,
      isAvailable,
      isLoggedIn: !!this.credentials
    };
  }

  // 设置凭证
  public setCredentials(credentials: AgentCredentials): void {
    this.credentials = credentials;
  }

  // 获取聊天上下文
  public async getChatContext(
    sessionId: string,
    createIfNotExists: boolean = true
  ): Promise<ChatContext | null> {
    // 上下文管理逻辑
  }
}
```

#### 子类实现示例

##### KimiAgent

**特点**：JWT Token 双令牌机制，自动刷新

```typescript
export class KimiAgent extends BaseAgent {
  protected static _id: AgentType = 'kimi';
  protected static _name = 'Kimi';
  protected static _loginUrl = 'https://kimi.moonshot.cn/';

  private readonly BASE_URL = 'https://kimi.moonshot.cn/api';
  private accessToken?: string;
  private refreshToken?: string;

  // 实现抽象方法
  protected async _checkAvailability(): Promise<boolean> {
    return !!this.accessToken;
  }

  protected async _sendPrompt(
    prompt: string,
    onUpdateResponse: (content: string, done: boolean) => void,
    callbackParam: CallbackParam
  ): Promise<void> {
    // 1. 创建会话
    const chatContext = await this.getChatContext(callbackParam.sessionId);

    // 2. 发送消息
    const response = await axios.post(
      `${this.BASE_URL}/chat/${chatContext.conversationId}/completion/stream`,
      { messages: [...] },
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );

    // 3. 处理 SSE 响应
    const eventSource = new EventSource(response.url);
    eventSource.on('cmpl', (event) => {
      const data = JSON.parse(event.data);
      onUpdateResponse(data.text, false);
    });
    eventSource.on('all_done', () => {
      onUpdateResponse('', true);
    });
  }

  protected async createChatContext(): Promise<ChatContext> {
    // 创建新会话
  }

  // Token 刷新逻辑
  private async refreshAccessToken(): Promise<void> {
    // 使用 refresh_token 刷新 access_token
  }
}
```

##### ChatGPTAgent

**特点**：Session Cookie + Bearer Token，Sentinel Token

```typescript
export class ChatGPTAgent extends BaseAgent {
  protected static _id: AgentType = 'chatgpt';
  protected static _name = 'ChatGPT';
  protected static _loginUrl = 'https://chatgpt.com/';

  private readonly BASE_URL = 'https://chatgpt.com';
  private cookies?: string;
  private accessToken?: string;

  protected async _sendPrompt(...) {
    // 1. 获取 Sentinel Token
    const sentinelToken = await this.getSentinelToken();

    // 2. 发送消息
    const response = await axios.post(
      `${this.BASE_URL}/backend-api/conversation`,
      { messages: [...] },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Openai-Sentinel-Chat-Requirements-Token': sentinelToken
        }
      }
    );

    // 3. 处理 SSE 流式响应
  }

  private async getSentinelToken(): Promise<string> {
    // 获取 Sentinel Token
  }
}
```

##### ClaudeAgent

**特点**：Cookie + org 参数，UUID 会话管理

```typescript
export class ClaudeAgent extends BaseAgent {
  protected static _id: AgentType = 'claude';
  protected static _name = 'Claude';
  protected static _loginUrl = 'https://claude.ai/';

  private readonly BASE_URL = 'https://claude.ai/api';
  private cookies?: string;
  private org?: string;

  protected async _sendPrompt(...) {
    // 1. 创建会话（使用 UUID）
    const conversationUuid = uuidv4();

    // 2. 发送消息
    const response = await axios.post(
      `${this.BASE_URL}/organizations/${this.org}/chat_conversations/${conversationUuid}/completion`,
      { prompt, timezone: 'Asia/Shanghai' },
      { headers: { Cookie: this.cookies } }
    );

    // 3. 处理 SSE 响应（event: completion）
  }
}
```

##### DeepSeekAgent

**特点**：Bearer Token，Thinking 模式

```typescript
export class DeepSeekAgent extends BaseAgent {
  protected static _id: AgentType = 'deepseek';
  protected static _name = 'DeepSeek';
  protected static _loginUrl = 'https://chat.deepseek.com/';

  private readonly BASE_URL = 'https://chat.deepseek.com/api';
  private token?: string;

  protected async _sendPrompt(...) {
    // 发送消息
    const response = await axios.post(
      `${this.BASE_URL}/v0/chat/completions`,
      {
        messages: [...],
        stream: true
      },
      { headers: { Authorization: `Bearer ${this.token}` } }
    );

    // 处理 SSE 响应
    // 区分 type: "thinking" 和 type: "text"
    eventSource.on('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'text') {
        onUpdateResponse(data.content, false);
      }
      // thinking 可选择性显示
    });
  }
}
```

---

## 数据流

### 1. 用户发送消息流程

```
用户输入消息
    ↓
前端: chatApi.sendMessage(message, ['kimi', 'chatgpt'], sessionId, onMessage)
    ↓
HTTP POST /api/chat
    ↓
后端: 并行调用 Agent
    ├─ KimiAgent.sendPrompt(message, callback, { sessionId })
    │   ├─ 获取/创建 ChatContext
    │   ├─ 发送到 Kimi API
    │   └─ SSE 响应 → callback(content, done)
    │       └─ res.write(`data: {...}\n\n`) → 前端
    │
    └─ ChatGPTAgent.sendPrompt(message, callback, { sessionId })
        ├─ 获取 Sentinel Token
        ├─ 发送到 ChatGPT API
        └─ SSE 响应 → callback(content, done)
            └─ res.write(`data: {...}\n\n`) → 前端
    ↓
前端: onMessage({ agentId, content, done })
    ↓
UI 更新: 实时显示 Agent 响应
```

### 2. Agent 登录流程

```
用户访问 Agent 管理页面
    ↓
前端: agentApi.getAll()
    ↓
HTTP GET /api/agents
    ↓
后端: 返回 Agent 列表（包含登录状态）
    ↓
前端: 显示 Agent 卡片
    ├─ 已登录: 显示 "已登录" 标签
    └─ 未登录: 显示 "登录" 链接 → agent.loginUrl
    ↓
用户点击 "登录" → 新标签页打开 loginUrl
    ↓
用户手动登录 → 获取 Token/Cookie
    ↓
用户输入 Token/Cookie → 前端
    ↓
前端: agentApi.login(agentId, credentials)
    ↓
HTTP POST /api/agents/:agentId/login
    ↓
后端: agent.setCredentials(credentials)
    └─ StorageService.saveAgentConfig() → SQLite (加密)
    ↓
返回: { success: true, status: Agent }
    ↓
前端: 刷新 Agent 状态 → 显示 "已登录"
```

### 3. 会话持久化流程

```
用户创建新会话
    ↓
前端: sessionApi.create(name, agents)
    ↓
HTTP POST /api/sessions
    ↓
后端: StorageService.saveSession({ id, name, agents, ... })
    └─ SQLite: INSERT INTO sessions (...)
    ↓
返回: { id: uuid, name, agents, createdAt, ... }
    ↓
前端: 更新会话列表
```

---

## API 接口

### 完整 API 列表

| 方法 | 路径 | 功能 | 请求体 | 响应 |
|-----|------|------|-------|------|
| GET | `/health` | 健康检查 | - | `{ status: 'ok' }` |
| GET | `/api/agents` | 获取所有 Agent | - | `{ agents: Agent[] }` |
| GET | `/api/agents/:id/status` | 获取 Agent 状态 | - | `Agent` |
| POST | `/api/agents/:id/login` | 设置登录凭证 | `{ credentials }` | `{ success, status }` |
| POST | `/api/chat` | SSE 流式对话 | `{ message, agents, sessionId }` | SSE Stream |
| GET | `/api/sessions` | 获取所有会话 | - | `{ sessions: Session[] }` |
| GET | `/api/sessions/:id` | 获取指定会话 | - | `Session` |
| POST | `/api/sessions` | 创建新会话 | `{ name, agents }` | `Session` |
| PUT | `/api/sessions/:id` | 更新会话 | `{ name?, agents?, contexts? }` | `Session` |
| DELETE | `/api/sessions/:id` | 删除会话 | - | `{ success: boolean }` |
| GET | `/api/sessions/:id/messages` | 获取会话消息 | - | `{ messages: Message[] }` |

### SSE 消息格式

```typescript
// 聊天响应
data: {
  "agentId": "kimi",
  "sessionId": "session-uuid",
  "content": "你好！",
  "done": false
}

// 错误消息
data: {
  "agentId": "chatgpt",
  "sessionId": "session-uuid",
  "content": "",
  "done": true,
  "error": "Token expired"
}

// 结束标记
data: [DONE]
```

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|-----|------|------|
| React | 19.0.0 | UI 框架 |
| React Router DOM | 7.1.2 | 路由管理 |
| TypeScript | 5.6.2 | 类型安全 |
| Vite | 6.0.11 | 构建工具 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| CSS Modules | - | 组件样式隔离 |

### 后端

| 技术 | 版本 | 用途 |
|-----|------|------|
| Node.js | 20+ | 运行时 |
| Express | 4.21.2 | Web 框架 |
| TypeScript | 5.x | 类型安全 |
| better-sqlite3 | 11.8.1 | SQLite 数据库 |
| axios | 1.7.9 | HTTP 客户端 |
| eventsource | 2.0.2 | SSE 客户端 |
| uuid | 11.0.5 | UUID 生成 |
| crypto | 内置 | AES-256 加密 |
| cors | 2.8.5 | CORS 中间件 |
| dotenv | 16.4.7 | 环境变量 |

### 测试

| 技术 | 版本 | 用途 |
|-----|------|------|
| Playwright | 1.49.1 | E2E 测试 |

---

## 目录结构

```
round_table_ai/
├── server/                          # 后端服务
│   ├── src/
│   │   ├── agents/                  # Agent 实现
│   │   │   ├── BaseAgent.ts         # Agent 抽象基类 ✅
│   │   │   ├── KimiAgent.ts         # Kimi Agent (JWT Token) ✅
│   │   │   ├── ChatGPTAgent.ts      # ChatGPT Agent (Session + Bearer) ✅
│   │   │   ├── ClaudeAgent.ts       # Claude Agent (Cookie + org) ✅
│   │   │   └── DeepSeekAgent.ts     # DeepSeek Agent (Bearer + Thinking) ✅
│   │   ├── routes/                  # API 路由
│   │   │   ├── agents.ts            # Agent 路由 ✅
│   │   │   ├── chat.ts              # 对话路由 (SSE) ✅
│   │   │   └── sessions.ts          # 会话路由 ✅
│   │   ├── services/                # 服务层
│   │   │   └── StorageService.ts    # 存储服务 (SQLite + 加密) ✅
│   │   ├── types/                   # 类型定义
│   │   │   └── index.ts             # TypeScript 类型 ✅
│   │   └── index.ts                 # Express 服务器 ✅
│   ├── data/                        # 数据目录
│   │   └── database.db              # SQLite 数据库
│   ├── package.json                 # 依赖配置 ✅
│   ├── tsconfig.json                # TypeScript 配置 ✅
│   ├── .env                         # 环境变量 (gitignore)
│   └── README.md                    # 后端文档 ✅
│
├── src/                             # 前端代码
│   ├── services/                    # 服务层
│   │   └── api.ts                   # API 客户端 ✅
│   ├── components/                  # 通用组件
│   │   ├── ApiTest.tsx              # API 测试组件 ✅
│   │   └── ErrorBoundary.tsx        # 错误边界 ✅
│   ├── pages/                       # 页面组件
│   │   ├── p-main_workbench/        # 主工作台 ✅
│   │   ├── p-agent_management/      # Agent 管理 ✅
│   │   │   └── index.tsx            # 后端 Agent 集成完成 ✅
│   │   ├── p-session_history/       # 会话历史 ✅
│   │   └── p-system_settings/       # 系统设置 ✅
│   ├── router/                      # 路由配置
│   │   └── index.tsx                # 路由定义 ✅
│   ├── App.tsx                      # 根组件 ✅
│   └── main.tsx                     # 入口文件 ✅
│
├── docs/                            # 文档目录
│   ├── plan.md                      # 开发计划 ✅
│   ├── prd.md                       # 产品需求 ✅
│   ├── CHATALL_TECHNICAL_ANALYSIS.md  # 技术分析 ✅
│   ├── IMPLEMENTATION_SUMMARY.md    # 实现总结 ✅
│   └── ARCHITECTURE.md              # 架构文档 ✅ (当前文档)
│
├── test-api.mjs                     # API 测试脚本 ✅
├── test-agent-management.mjs        # Agent 管理页面测试 ✅
├── package.json                     # 前端依赖 ✅
├── tsconfig.json                    # 前端 TypeScript 配置 ✅
├── vite.config.ts                   # Vite 配置 ✅
├── tailwind.config.js               # Tailwind 配置 ✅
├── .gitignore                       # Git 忽略文件 ✅
└── README.md                        # 项目说明 ✅
```

---

## 安全设计

### 1. 凭证加密存储

**实现**：`server/src/services/StorageService.ts`

```typescript
export class StorageService {
  private readonly ENCRYPTION_KEY: string;
  private readonly ALGORITHM = 'aes-256-cbc';

  // AES-256 加密
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // AES-256 解密
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 2. CORS 配置

**实现**：`server/src/index.ts`

```typescript
this.app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### 3. 环境变量

**文件**：`server/.env`

```env
PORT=3001
ENCRYPTION_KEY=your-32-byte-hex-key-here
CORS_ORIGIN=http://localhost:5173
```

### 4. Token 过期处理

每个 Agent 实现了 Token 刷新机制：
- **KimiAgent**: 使用 refresh_token 自动刷新 access_token
- **ChatGPTAgent**: Session 定期刷新
- **ClaudeAgent**: Cookie 验证和更新
- **DeepSeekAgent**: Token 验证

---

## 扩展指南

### 添加新 Agent

1. **创建 Agent 类**

```typescript
// server/src/agents/NewAgent.ts
import { BaseAgent } from './BaseAgent';
import { AgentType, CallbackParam, ChatContext } from '../types';

export class NewAgent extends BaseAgent {
  protected static _id: AgentType = 'newagent';
  protected static _name = 'New Agent';
  protected static _loginUrl = 'https://newagent.com/login';

  protected async _checkAvailability(): Promise<boolean> {
    // 实现可用性检查
  }

  protected async _sendPrompt(
    prompt: string,
    onUpdateResponse: (content: string, done: boolean) => void,
    callbackParam: CallbackParam
  ): Promise<void> {
    // 实现消息发送逻辑
  }

  protected async createChatContext(): Promise<ChatContext> {
    // 实现会话创建逻辑
  }
}
```

2. **注册 Agent**

```typescript
// server/src/index.ts
private initializeAgents(): void {
  this.agents.set('kimi', new KimiAgent());
  this.agents.set('chatgpt', new ChatGPTAgent());
  this.agents.set('claude', new ClaudeAgent());
  this.agents.set('deepseek', new DeepSeekAgent());
  this.agents.set('newagent', new NewAgent()); // 新增
}
```

3. **更新类型定义**

```typescript
// server/src/types/index.ts
export type AgentType = 'kimi' | 'chatgpt' | 'claude' | 'deepseek' | 'newagent';
```

4. **更新前端**

```typescript
// src/pages/p-agent_management/index.tsx
// 添加到 agentDescriptions 和 agentModels
const agentDescriptions: Record<string, string> = {
  // ...
  newagent: 'New Agent 的描述'
};
```

---

## 性能优化

### 1. 并行请求

多个 Agent 并行处理用户消息：

```typescript
await Promise.all(
  agentIds.map(agentId => agent.sendPrompt(message, callback, { sessionId }))
);
```

### 2. 流式响应

使用 SSE 实现实时流式输出，避免等待完整响应：

```typescript
res.setHeader('Content-Type', 'text/event-stream');
res.write(`data: ${JSON.stringify({ content, done })}\n\n`);
```

### 3. 数据库索引

```sql
CREATE INDEX idx_sessions_created ON sessions(createdAt);
CREATE INDEX idx_messages_session ON messages(sessionId);
```

### 4. 缓存策略

- Agent 状态缓存（避免重复检查）
- Session 上下文缓存（减少数据库查询）

---

## 监控和日志

### 日志级别

- **INFO**: 正常操作（Agent 初始化、请求处理）
- **WARN**: 警告信息（Token 即将过期）
- **ERROR**: 错误信息（API 调用失败、数据库错误）

### 关键指标

- Agent 响应时间
- SSE 连接数
- Token 刷新频率
- 数据库查询性能

---

## 总结

RoundTable AI 采用了清晰的分层架构和设计模式：

- **前端**: React 组件化，API 客户端封装，SSE 流式响应
- **后端**: Express RESTful API，模板方法模式，Agent 适配器
- **数据**: SQLite 持久化，AES-256 加密，事务支持
- **安全**: CORS 配置，凭证加密，Token 管理

核心优势：
- ✅ **可扩展**: 添加新 Agent 只需继承 BaseAgent
- ✅ **可维护**: 清晰的模块划分和代码组织
- ✅ **高性能**: 并行处理、流式响应、缓存优化
- ✅ **安全**: 加密存储、CORS 保护、Token 刷新

---

**文档版本**: 1.0
**最后更新**: 2025-01-21
**维护者**: RoundTable AI Team
