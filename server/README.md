# RoundTable AI 后端服务

## 项目结构

```
server/
├── src/
│   ├── agents/          # Agent 适配器
│   │   └── BaseAgent.ts # Agent 基类
│   ├── routes/          # API 路由
│   │   ├── agents.ts    # Agent 管理路由
│   │   ├── chat.ts      # 对话路由
│   │   └── sessions.ts  # 会话管理路由
│   ├── services/        # 服务层
│   │   └── StorageService.ts  # 存储服务
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts
│   └── index.ts         # 入口文件
├── data/                # 数据目录（SQLite 数据库）
├── .env                 # 环境变量
├── package.json
└── tsconfig.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

### 构建生产版本

```bash
npm run build
npm start
```

## API 接口

### 健康检查

```
GET /health
```

### Agent 管理

#### 获取所有 Agent 列表

```
GET /api/agents
```

#### 获取指定 Agent 状态

```
GET /api/agents/:agentId/status
```

#### 设置 Agent 登录凭证

```
POST /api/agents/:agentId/login
Content-Type: application/json

{
  "credentials": {
    // Agent 特定的凭证格式
  }
}
```

### 对话

#### 发送消息（SSE 流式响应）

```
POST /api/chat
Content-Type: application/json

{
  "message": "你好",
  "agents": ["kimi", "chatgpt", "claude", "deepseek"],
  "sessionId": "session-uuid"
}
```

### 会话管理

#### 获取所有会话

```
GET /api/sessions
```

#### 获取指定会话

```
GET /api/sessions/:id
```

#### 创建新会话

```
POST /api/sessions
Content-Type: application/json

{
  "name": "新会话",
  "agents": ["kimi", "chatgpt"]
}
```

#### 更新会话

```
PUT /api/sessions/:id
Content-Type: application/json

{
  "name": "更新的会话名称",
  "agents": ["kimi", "claude"]
}
```

#### 删除会话

```
DELETE /api/sessions/:id
```

#### 获取会话消息

```
GET /api/sessions/:id/messages
```

## 环境变量

在 `.env` 文件中配置：

```
PORT=3001
NODE_ENV=development
DB_PATH=./data/roundtable.db
ENCRYPTION_KEY=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

## 测试

### 测试健康检查

```bash
curl http://localhost:3001/health
```

### 测试创建会话

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name":"测试会话","agents":["kimi","chatgpt"]}'
```

### 测试获取会话列表

```bash
curl http://localhost:3001/api/sessions
```

## Agent 设计模式

参考 ChatALL 的设计，使用模板方法模式：

### BaseAgent 抽象类

```typescript
export abstract class BaseAgent {
  // 子类必须实现的抽象方法
  protected abstract _checkAvailability(): Promise<boolean>;
  protected abstract _sendPrompt(
    prompt: string,
    onUpdateResponse: (param: StreamCallbackParam, response: StreamResponse) => void,
    callbackParam: StreamCallbackParam
  ): Promise<void>;
  protected abstract createChatContext(): Promise<ChatContext>;

  // 公共接口
  public async sendPrompt(...): Promise<void>
  public async getStatus(): Promise<AgentStatus>
  public setCredentials(credentials: AgentCredentials): void
  public getChatContext(sessionId: string): Promise<ChatContext | null>
}
```

### 实现新的 Agent

1. 继承 `BaseAgent` 类
2. 实现三个抽象方法：
   - `_checkAvailability()`: 检查 Agent 是否可用
   - `_sendPrompt()`: 发送消息并处理 SSE 流式响应
   - `createChatContext()`: 创建新的会话上下文

示例：

```typescript
export class KimiAgent extends BaseAgent {
  protected static _id: AgentType = 'kimi';
  protected static _name = 'Kimi';
  protected static _loginUrl = 'https://kimi.moonshot.cn/';

  protected async _checkAvailability(): Promise<boolean> {
    // 实现逻辑
  }

  protected async _sendPrompt(...): Promise<void> {
    // 实现 SSE 流式响应
  }

  protected async createChatContext(): Promise<ChatContext> {
    // 创建会话
  }
}
```

## 数据库

使用 SQLite 存储数据，包括：

- `agent_configs`: Agent 配置（凭证加密存储）
- `sessions`: 会话信息
- `messages`: 消息记录

StorageService 提供统一的数据访问接口。

## 下一步

- [ ] 实现 Kimi Agent 适配器
- [ ] 实现 ChatGPT Agent 适配器
- [ ] 实现 Claude Agent 适配器
- [ ] 实现 DeepSeek Agent 适配器
- [ ] 前后端集成
- [ ] 完善错误处理
- [ ] 添加单元测试
