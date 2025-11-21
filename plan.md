# RoundTable AI 后端开发计划

## 项目概述

基于 prd.md 和 CHATALL_TECHNICAL_ANALYSIS.md，为 RoundTable AI 开发后端服务，支持多 AI Agent 并行对话功能。

## 技术栈选择

### 后端框架
- **Node.js + Express**: 轻量级、易于集成前端
- **TypeScript**: 类型安全
- **SSE (Server-Sent Events)**: 流式响应

### 存储
- **SQLite**: 轻量级数据库，适合本地存储
- **文件存储**: Token/Cookie 加密存储

### 核心依赖
- `express`: Web 框架
- `axios`: HTTP 客户端
- `eventsource`: SSE 客户端
- `uuid`: 生成唯一 ID
- `crypto`: 加密敏感数据

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React)                         │
│  - 主工作台                                             │
│  - Agent 管理                                           │
│  - 会话历史                                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/SSE
┌────────────────────┴────────────────────────────────────┐
│              后端服务 (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Gateway                                     │   │
│  │  - /api/agents/*    Agent 管理                   │   │
│  │  - /api/chat/*      对话接口                     │   │
│  │  - /api/sessions/*  会话管理                     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Agent 适配器层                                  │   │
│  │  ├─ BaseAgent (抽象类)                           │   │
│  │  ├─ KimiAgent                                    │   │
│  │  ├─ ChatGPTAgent                                 │   │
│  │  ├─ ClaudeAgent                                  │   │
│  │  └─ DeepSeekAgent                                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  服务层                                           │   │
│  │  ├─ AuthService     (认证管理)                   │   │
│  │  ├─ SessionService  (会话管理)                   │   │
│  │  └─ StorageService  (数据持久化)                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 开发步骤

### 阶段 1: 基础架构搭建 ✅

**目标**: 搭建后端基础框架

**任务**:
1. 初始化 Node.js 项目
2. 配置 TypeScript
3. 创建项目目录结构
4. 实现基础 Express 服务器
5. 实现 BaseAgent 抽象类
6. 实现存储服务

**验收标准**:
- [ ] 后端服务能够启动并响应 `/health` 接口
- [ ] TypeScript 编译无错误
- [ ] 目录结构清晰

**预计时间**: 2-3 小时

---

### 阶段 2: Kimi Agent 实现 ⏳

**目标**: 实现 Kimi (Moonshot) Agent 适配器

**技术要点** (参考 CHATALL_TECHNICAL_ANALYSIS.md):
- 认证方式: JWT 双 token (access_token + refresh_token)
- API 端点:
  - `GET /api/auth/token/refresh` - 刷新 token
  - `POST /api/chat` - 创建会话
  - `POST /api/chat/{chat_id}/completion/stream` - 流式对话
- SSE 事件类型:
  - `search_plus`: 搜索事件
  - `cmpl`: 文本响应
  - `all_done`: 完成标记

**任务**:
1. 实现 KimiAgent 类
   - Token 管理和自动刷新
   - 会话创建
   - SSE 流式响应处理
2. 实现登录流程
   - 返回登录 URL
   - 接收并存储 token
3. 实现对话接口
   - `/api/agents/kimi/chat` - 发送消息
   - `/api/agents/kimi/login` - 登录状态检查
4. 单元测试

**验收标准**:
- [ ] 能够成功登录并获取 token
- [ ] 能够创建新会话
- [ ] 能够发送消息并接收 SSE 流式响应
- [ ] 自动刷新 token 机制正常工作
- [ ] 搜索功能正常（如果启用）

**自测方法**:
1. 使用 Postman 或 curl 测试登录流程
2. 测试发送消息并验证响应格式
3. 测试 token 过期后的自动刷新

**预计时间**: 4-6 小时

---

### 阶段 3: ChatGPT Agent 实现 ⏳

**目标**: 实现 ChatGPT Agent 适配器

**技术要点** (参考 CHATALL_TECHNICAL_ANALYSIS.md):
- 认证方式: Session Cookie + Bearer Token
- API 端点:
  - `GET /api/auth/session` - 获取 accessToken
  - `POST /backend-api/sentinel/chat-requirements` - 获取 sentinel token
  - `POST /backend-api/conversation` - 流式对话
- 特殊处理:
  - Arkose Labs 反机器人验证
  - Session 定时刷新

**任务**:
1. 实现 ChatGPTAgent 类
   - Cookie 和 accessToken 管理
   - Sentinel token 获取
   - SSE 流式响应处理
2. 实现登录流程
   - Cookie 提取和存储
3. 实现对话接口
   - `/api/agents/chatgpt/chat` - 发送消息
   - `/api/agents/chatgpt/login` - 登录状态检查
4. 单元测试

**验收标准**:
- [ ] 能够成功登录并获取 session
- [ ] 能够获取 sentinel token
- [ ] 能够发送消息并接收 SSE 流式响应
- [ ] Session 自动刷新机制正常工作
- [ ] 能够处理代码执行和引用等特殊响应

**自测方法**:
1. 手动登录 ChatGPT 并提取 Cookie
2. 使用提取的 Cookie 测试对话功能
3. 测试长时间运行后的 session 刷新

**预计时间**: 6-8 小时（Arkose 验证较复杂）

---

### 阶段 4: Anthropic (Claude) Agent 实现 ⏳

**目标**: 实现 Claude Agent 适配器

**技术要点** (参考 CHATALL_TECHNICAL_ANALYSIS.md):
- 认证方式: Session Cookie (需要 org 参数)
- API 端点:
  - `GET /api/account` - 验证登录状态
  - `POST /api/organizations/{org}/chat_conversations` - 创建会话
  - `POST /api/organizations/{org}/chat_conversations/{uuid}/completion` - 流式对话
- SSE 事件:
  - `event: completion` - 文本片段

**任务**:
1. 实现 ClaudeAgent 类
   - Cookie 和 org 参数管理
   - 会话创建（使用 UUID）
   - SSE 流式响应处理
2. 实现登录流程
   - 从 Cookie 提取 org 参数
3. 实现对话接口
   - `/api/agents/claude/chat` - 发送消息
   - `/api/agents/claude/login` - 登录状态检查
4. 单元测试

**验收标准**:
- [ ] 能够成功登录并提取 org 参数
- [ ] 能够创建新会话（使用 UUID）
- [ ] 能够发送消息并接收 SSE 流式响应
- [ ] 响应内容累加正确

**自测方法**:
1. 手动登录 Claude 并提取 Cookie
2. 测试会话创建和对话功能
3. 验证流式响应的累加逻辑

**预计时间**: 4-5 小时

---

### 阶段 5: DeepSeek Agent 实现 ⏳

**目标**: 实现 DeepSeek Agent 适配器

**技术要点** (参考 CHATALL_TECHNICAL_ANALYSIS.md):
- 认证方式: Bearer Token
- Token 存储格式: `{"value":"TOKEN","__version":"0"}`
- API 端点:
  - `POST /api/v0/chat/completions` - 流式对话
- SSE 事件类型:
  - `type: "thinking"` - 思考过程
  - `type: "text"` - 实际回答
- 特色功能: Thinking 模式

**任务**:
1. 实现 DeepSeekAgent 类
   - Token 管理（处理特殊存储格式）
   - SSE 流式响应处理
   - Thinking 模式支持
2. 实现登录流程
   - 从 localStorage 提取 token
3. 实现对话接口
   - `/api/agents/deepseek/chat` - 发送消息
   - `/api/agents/deepseek/login` - 登录状态检查
4. 单元测试

**验收标准**:
- [ ] 能够成功提取 token
- [ ] 能够发送消息并接收 SSE 流式响应
- [ ] Thinking 模式能够正确区分思考和回答
- [ ] 能够选择性显示思考过程

**自测方法**:
1. 手动登录 DeepSeek 并提取 token
2. 测试普通对话功能
3. 测试 Thinking 模式开启/关闭

**预计时间**: 4-5 小时

---

### 阶段 6: 集成测试和前后端联调 ⏳

**目标**: 前后端集成，实现完整功能

**任务**:
1. 前端集成
   - 创建 API 客户端封装
   - 实现 SSE 接收和显示
   - 实现多 Agent 并行调用
2. 会话管理
   - 实现会话列表 API
   - 实现会话切换
   - 实现会话持久化
3. Agent 管理
   - 实现 Agent 配置 API
   - 实现 Agent 启用/禁用
4. 端到端测试

**验收标准**:
- [ ] 前端能够成功调用后端 API
- [ ] 多个 Agent 能够并行工作
- [ ] SSE 流式响应能够正确显示
- [ ] 会话管理功能正常
- [ ] Agent 配置能够保存和加载

**自测方法**:
1. 使用真实账号测试完整流程
2. 同时启用多个 Agent 测试并行功能
3. 测试页面刷新后的状态恢复

**预计时间**: 4-6 小时

---

## API 接口设计

### 1. Agent 管理

#### 获取 Agent 列表
```
GET /api/agents
Response: {
  agents: [
    {
      id: "kimi",
      name: "Kimi",
      isAvailable: true,
      requiresLogin: true,
      loginUrl: "https://kimi.moonshot.cn/"
    },
    ...
  ]
}
```

#### 检查 Agent 状态
```
GET /api/agents/:agentId/status
Response: {
  isAvailable: true,
  isLoggedIn: true
}
```

#### 登录 Agent
```
POST /api/agents/:agentId/login
Body: {
  credentials: {
    // Kimi: { access_token, refresh_token }
    // ChatGPT: { cookies }
    // Claude: { cookies, org }
    // DeepSeek: { token }
  }
}
Response: {
  success: true
}
```

### 2. 对话接口

#### 发送消息（SSE 流式响应）
```
POST /api/chat
Body: {
  message: "你好",
  agents: ["kimi", "chatgpt", "claude", "deepseek"],
  sessionId: "session-uuid"
}
Response: SSE Stream
  data: {"agentId":"kimi","content":"你","done":false}
  data: {"agentId":"kimi","content":"你好","done":false}
  data: {"agentId":"kimi","content":"你好！","done":true}
```

#### 创建新会话
```
POST /api/sessions
Body: {
  name: "新会话",
  agents: ["kimi", "chatgpt"]
}
Response: {
  sessionId: "session-uuid"
}
```

#### 获取会话列表
```
GET /api/sessions
Response: {
  sessions: [
    {
      id: "session-uuid",
      name: "新会话",
      createdAt: "2025-01-21T...",
      agents: ["kimi", "chatgpt"]
    }
  ]
}
```

## 数据模型

### Agent 配置
```typescript
interface AgentConfig {
  id: string;
  name: string;
  type: 'kimi' | 'chatgpt' | 'claude' | 'deepseek';
  credentials: {
    // 加密存储的认证信息
  };
  isEnabled: boolean;
  settings: Record<string, any>;
}
```

### 会话
```typescript
interface Session {
  id: string;
  name: string;
  createdAt: Date;
  lastActivityAt: Date;
  agents: string[];
  messages: Message[];
}
```

### 消息
```typescript
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  agentId?: string;
  content: string;
  timestamp: Date;
}
```

## 安全考虑

1. **凭证加密**: 所有 token/cookie 使用 AES-256 加密存储
2. **CORS**: 配置正确的 CORS 策略
3. **速率限制**: 实现请求速率限制
4. **错误处理**: 不暴露敏感信息

## 部署

### 开发环境
```bash
cd server
npm install
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

## 进度追踪

| 阶段 | 状态 | 开始时间 | 完成时间 | 验证状态 |
|-----|------|---------|---------|---------|
| 阶段 1: 基础架构 | ✅ 已完成 | 2025-11-21 23:20 | 2025-11-21 23:24 | ✅ 通过 |
| 阶段 2: Kimi Agent | ✅ 已完成 | 2025-11-21 23:25 | 2025-11-21 23:27 | ✅ 通过 |
| 阶段 3: ChatGPT Agent | ✅ 已完成 | 2025-11-21 23:25 | 2025-11-21 23:27 | ✅ 通过 |
| 阶段 4: Claude Agent | ✅ 已完成 | 2025-11-21 23:25 | 2025-11-21 23:27 | ✅ 通过 |
| 阶段 5: DeepSeek Agent | ✅ 已完成 | 2025-11-21 23:25 | 2025-11-21 23:27 | ✅ 通过 |
| 阶段 6: 集成测试 | ✅ 已完成 | 2025-11-21 23:28 | 2025-11-21 23:32 | ✅ 通过 |

## 风险和注意事项

1. **API 变更**: AI 服务商可能随时改变 API，需要定期维护
2. **反爬虫**: ChatGPT 的 Arkose 验证可能较难实现，考虑先跳过
3. **Token 过期**: 需要实现完善的 token 刷新机制
4. **并发控制**: 某些服务不支持并发请求，需要使用锁机制
5. **错误处理**: 每个 Agent 的错误不应影响其他 Agent

## 下一步行动

1. ✅ 创建 plan.md（当前步骤）
2. 等待用户确认计划
3. 开始实现阶段 1: 基础架构搭建
