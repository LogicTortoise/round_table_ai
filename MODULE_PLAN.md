# RoundTable AI 模块规划

## 概述

本文档详细规划了 RoundTable AI 各个页面的功能模块，按优先级 (P0/P1/P2) 划分，指导前端开发工作。

---

## 优先级定义

- **P0**: 核心功能，必须实现，阻塞发布
- **P1**: 重要功能，显著提升用户体验
- **P2**: 增强功能，可后续迭代

---

## 1. 主工作台 (P-MAIN_WORKBENCH)

**路径**: `/main-workbench`

**状态**: 🟡 待完善

### P0 功能（核心对话功能）

#### 1.1 Agent 选择面板 ✅ (已有 UI)

**功能**:
- [ ] 从后端获取 Agent 列表 (agentApi.getAll())
- [ ] 显示 Agent 卡片（头像、名称、状态）
- [ ] Agent 勾选/取消勾选
- [ ] 显示登录状态（已登录/未登录）
- [ ] 未登录时禁用勾选，提示需要登录
- [ ] 至少选择一个 Agent 才能发送消息

**数据流**:
```typescript
useEffect(() => {
  const loadAgents = async () => {
    const { agents } = await agentApi.getAll();
    setAgents(agents);
  };
  loadAgents();
}, []);

// 存储用户选择的 Agent
const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
```

#### 1.2 消息输入区 ✅ (已有 UI)

**功能**:
- [x] 多行文本输入框
- [ ] 快捷键支持（Ctrl+Enter / Cmd+Enter 发送）
- [ ] 字符计数器
- [ ] 发送按钮（禁用条件：无选中 Agent 或输入为空）
- [ ] 文件上传按钮 (P1)
- [ ] 清空按钮

**实现**:
```typescript
const [message, setMessage] = useState('');

const handleSend = async () => {
  if (!message.trim() || selectedAgents.length === 0) return;

  // 创建或获取当前 session
  const sessionId = currentSessionId || (await createNewSession()).id;

  // 发送消息
  await chatApi.sendMessage(
    message,
    selectedAgents,
    sessionId,
    (msg: StreamMessage) => {
      // 处理流式响应
      updateAgentResponse(msg.agentId, msg.content, msg.done);
    }
  );

  setMessage('');
};
```

#### 1.3 多 Agent 响应区 (核心)

**功能**:
- [ ] 左右分栏布局（可调整宽度）
- [ ] 每个 Agent 独立响应区域
- [ ] 实时流式响应展示
- [ ] 响应状态指示
  - 等待中：Loading 动画
  - 响应中：打字机效果
  - 完成：完成标记
  - 错误：错误提示
- [ ] Markdown 渲染（代码高亮、表格、链接）
- [ ] 代码块复制按钮
- [ ] 响应重新生成按钮

**数据结构**:
```typescript
interface AgentResponse {
  agentId: string;
  content: string;
  status: 'waiting' | 'streaming' | 'done' | 'error';
  error?: string;
}

const [responses, setResponses] = useState<Map<string, AgentResponse>>(new Map());

const updateAgentResponse = (agentId: string, content: string, done: boolean) => {
  setResponses(prev => {
    const newMap = new Map(prev);
    newMap.set(agentId, {
      agentId,
      content,
      status: done ? 'done' : 'streaming'
    });
    return newMap;
  });
};
```

**UI 组件**:
```tsx
<div className="response-grid">
  {selectedAgents.map(agentId => (
    <AgentResponseCard
      key={agentId}
      agent={agents.find(a => a.id === agentId)}
      response={responses.get(agentId)}
    />
  ))}
</div>
```

#### 1.4 会话管理 ✅ (左侧边栏)

**功能**:
- [ ] 创建新会话按钮
  - 自动保存到后端 (sessionApi.create())
  - 生成默认名称（如"新会话 2025-01-21"）
- [ ] 会话列表显示
  - 会话名称
  - 参与的 Agent
  - 最后活动时间
  - 星标标记 (P1)
- [ ] 会话切换
  - 加载历史消息
  - 恢复 Agent 选择
- [ ] 会话重命名 (P1)
- [ ] 会话删除（带确认）

**实现**:
```typescript
const createNewSession = async () => {
  const sessionName = `新会话 ${new Date().toLocaleString('zh-CN')}`;
  const session = await sessionApi.create(sessionName, selectedAgents);
  setCurrentSessionId(session.id);
  return session;
};

const switchSession = async (sessionId: string) => {
  const session = await sessionApi.get(sessionId);
  setCurrentSessionId(session.id);
  setSelectedAgents(session.agents);
  // 加载历史消息
  loadSessionMessages(sessionId);
};
```

### P1 功能（用户体验增强）

#### 1.5 消息历史

**功能**:
- [ ] 显示用户消息和 Agent 响应
- [ ] 消息时间戳
- [ ] 消息复制按钮
- [ ] 消息导出（Markdown / JSON）
- [ ] 搜索历史消息

#### 1.6 快捷操作

**功能**:
- [ ] 消息模板（常用问题快捷输入）
- [ ] 快捷键指南
- [ ] 响应对比视图（并排对比 Agent 回答）
- [ ] 响应评分（点赞/点踩）

#### 1.7 高级设置

**功能**:
- [ ] Agent 参数调整（temperature、max_tokens）
- [ ] 系统提示词自定义
- [ ] Thinking 模式开关（DeepSeek）
- [ ] 搜索增强开关（Kimi）

### P2 功能（增强功能）

#### 1.8 协作功能

**功能**:
- [ ] Agent 间对话（让 Agent 互相讨论）
- [ ] 多轮对话模式
- [ ] 自动总结功能

#### 1.9 可视化

**功能**:
- [ ] 响应速度对比图表
- [ ] Token 使用统计
- [ ] Agent 使用频率分析

---

## 2. Agent 管理 (P-AGENT_MANAGEMENT)

**路径**: `/agent-management`

**状态**: ✅ 基本完成

### P0 功能（已完成） ✅

#### 2.1 官方 Agent 管理 ✅

**功能**:
- [x] 从后端获取 Agent 列表
- [x] 显示 Agent 信息（名称、模型、描述、状态）
- [x] 登录状态显示（已登录/未登录）
- [x] 登录跳转链接
- [x] 状态刷新按钮
- [x] 表格视图和卡片视图切换
- [x] 搜索、筛选、排序功能

#### 2.2 自定义 Agent 管理 ✅

**功能**:
- [x] 创建自定义 Agent
- [x] 编辑 Agent 配置
- [x] 删除 Agent
- [x] 复制 Agent
- [x] 启用/禁用 Agent

### P1 功能（待实现）

#### 2.3 登录凭证管理

**功能**:
- [ ] 凭证输入表单
  - Kimi: access_token + refresh_token
  - ChatGPT: Cookie + accessToken
  - Claude: Cookie + org
  - DeepSeek: Bearer Token
- [ ] 凭证验证
- [ ] 凭证保存（调用 agentApi.login()）
- [ ] 凭证显示（隐藏敏感部分）
- [ ] 凭证删除

**UI 设计**:
```tsx
<Modal title="配置 Kimi 登录">
  <Form>
    <Input
      label="Access Token"
      type="password"
      placeholder="Bearer ..."
      value={credentials.access_token}
      onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
    />
    <Input
      label="Refresh Token"
      type="password"
      placeholder="..."
      value={credentials.refresh_token}
      onChange={(e) => setCredentials({ ...credentials, refresh_token: e.target.value })}
    />
    <Button onClick={handleLogin}>保存登录</Button>
  </Form>
</Modal>
```

#### 2.4 Agent 测试工具

**功能**:
- [ ] 快速测试 Agent 连接
- [ ] 发送测试消息
- [ ] 查看响应延迟
- [ ] Token 使用量统计

### P2 功能（增强功能）

#### 2.5 Agent 高级配置

**功能**:
- [ ] 默认参数设置
- [ ] 自定义系统提示词
- [ ] API 端点自定义
- [ ] 代理设置

#### 2.6 Agent 使用统计

**功能**:
- [ ] 调用次数统计
- [ ] Token 消耗统计
- [ ] 平均响应时间
- [ ] 成功率分析

---

## 3. 会话历史 (P-SESSION_HISTORY)

**路径**: `/session-history`

**状态**: 🟡 待实现

### P0 功能（核心历史功能）

#### 3.1 会话列表

**功能**:
- [ ] 从后端获取会话列表 (sessionApi.getAll())
- [ ] 显示会话卡片
  - 会话名称
  - 创建时间
  - 最后活动时间
  - 参与的 Agent
  - 消息数量
- [ ] 分页加载
- [ ] 搜索会话（按名称、内容）
- [ ] 筛选会话
  - 按 Agent 类型
  - 按日期范围
  - 按状态（活跃/归档）

**数据流**:
```typescript
const [sessions, setSessions] = useState<Session[]>([]);
const [page, setPage] = useState(1);
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  const loadSessions = async () => {
    const { sessions } = await sessionApi.getAll();
    setSessions(sessions);
  };
  loadSessions();
}, []);
```

#### 3.2 会话详情

**功能**:
- [ ] 点击会话查看详情
- [ ] 显示完整对话历史
- [ ] 消息时间轴
- [ ] Agent 响应展示
- [ ] 返回按钮

**UI 组件**:
```tsx
<SessionDetail sessionId={selectedSessionId}>
  <MessageTimeline>
    {messages.map(msg => (
      <MessageItem
        key={msg.id}
        role={msg.role}
        content={msg.content}
        agentId={msg.agentId}
        timestamp={msg.timestamp}
      />
    ))}
  </MessageTimeline>
</SessionDetail>
```

#### 3.3 会话操作

**功能**:
- [ ] 重命名会话
  - 内联编辑
  - 调用 sessionApi.update()
- [ ] 删除会话（带确认）
  - 调用 sessionApi.delete()
- [ ] 继续会话
  - 跳转到主工作台
  - 加载会话上下文

### P1 功能（用户体验增强）

#### 3.4 会话管理

**功能**:
- [ ] 星标会话
- [ ] 归档会话
- [ ] 会话分组/标签
- [ ] 批量操作（删除、归档）

#### 3.5 会话导出

**功能**:
- [ ] 导出为 Markdown
- [ ] 导出为 JSON
- [ ] 导出为 PDF
- [ ] 分享会话链接

### P2 功能（增强功能）

#### 3.6 会话分析

**功能**:
- [ ] 会话统计图表
- [ ] Agent 使用分布
- [ ] 主题词云
- [ ] 时间分布热力图

#### 3.7 智能搜索

**功能**:
- [ ] 全文搜索
- [ ] 语义搜索
- [ ] 高级筛选（多条件组合）

---

## 4. 系统设置 (P-SYSTEM_SETTINGS)

**路径**: `/system-settings`

**状态**: 🟡 待实现

### P0 功能（基础设置）

#### 4.1 通用设置

**功能**:
- [ ] 语言设置（中文/英文）
- [ ] 主题设置（亮色/暗色/自动）
- [ ] 默认 Agent 选择
- [ ] 启动时行为

**实现**:
```typescript
interface Settings {
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark' | 'auto';
  defaultAgents: string[];
  startupBehavior: 'new-session' | 'last-session';
}

const [settings, setSettings] = useState<Settings>(() => {
  const saved = localStorage.getItem('settings');
  return saved ? JSON.parse(saved) : defaultSettings;
});

const updateSettings = (newSettings: Partial<Settings>) => {
  const updated = { ...settings, ...newSettings };
  setSettings(updated);
  localStorage.setItem('settings', JSON.stringify(updated));
};
```

#### 4.2 显示设置

**功能**:
- [ ] 字体大小调整
- [ ] 代码主题选择
- [ ] Markdown 渲染选项
- [ ] 紧凑模式

### P1 功能（高级设置）

#### 4.3 Agent 默认参数

**功能**:
- [ ] Temperature 默认值
- [ ] Max Tokens 默认值
- [ ] 系统提示词模板
- [ ] 重试策略

#### 4.4 数据管理

**功能**:
- [ ] 清除缓存
- [ ] 导出所有数据
- [ ] 导入数据
- [ ] 数据统计（会话数、消息数、存储占用）

#### 4.5 快捷键设置

**功能**:
- [ ] 查看快捷键列表
- [ ] 自定义快捷键
- [ ] 重置为默认

### P2 功能（增强功能）

#### 4.6 通知设置

**功能**:
- [ ] 响应完成通知
- [ ] 错误提示通知
- [ ] 系统更新通知
- [ ] 通知声音开关

#### 4.7 高级选项

**功能**:
- [ ] 开发者模式
- [ ] 日志导出
- [ ] 性能监控
- [ ] API 调试

---

## 5. 通用组件

### P0 组件

#### 5.1 ErrorBoundary ✅

**功能**:
- [x] 捕获子组件错误
- [x] 显示错误信息
- [x] 重试按钮
- [x] 错误上报

#### 5.2 Loading

**功能**:
- [ ] 全局加载指示器
- [ ] 局部加载组件
- [ ] Skeleton 屏幕

#### 5.3 Toast / Notification

**功能**:
- [ ] 成功提示
- [ ] 错误提示
- [ ] 警告提示
- [ ] 信息提示
- [ ] 自动关闭

#### 5.4 Modal / Dialog

**功能**:
- [ ] 可复用的模态框组件
- [ ] 支持标题、内容、按钮
- [ ] 背景点击关闭
- [ ] ESC 键关闭
- [ ] 动画效果

### P1 组件

#### 5.5 Markdown Renderer

**功能**:
- [ ] 代码高亮（使用 Prism.js / highlight.js）
- [ ] 表格渲染
- [ ] 链接处理
- [ ] 图片显示
- [ ] LaTeX 公式 (P2)

#### 5.6 CodeBlock

**功能**:
- [ ] 代码高亮
- [ ] 语言标签
- [ ] 复制按钮
- [ ] 行号显示

#### 5.7 AgentAvatar

**功能**:
- [ ] Agent 头像显示
- [ ] 状态指示器（在线/离线）
- [ ] 尺寸变体（小/中/大）

---

## 6. 数据管理

### P0 功能

#### 6.1 状态管理

**方案**: React Hooks (useState, useContext)

**全局状态**:
```typescript
interface AppState {
  agents: Agent[];
  sessions: Session[];
  currentSessionId: string | null;
  selectedAgents: string[];
  settings: Settings;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
```

#### 6.2 本地持久化

**方案**: localStorage

**存储内容**:
- 用户设置 (settings)
- Agent 选择状态
- 未同步的消息（离线模式）

```typescript
export const storage = {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  }
};
```

### P1 功能

#### 6.3 数据缓存

**方案**: 内存缓存 + TTL

```typescript
class Cache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();

  set(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, { data, expiry: Date.now() + ttl });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
}

const agentCache = new Cache<Agent[]>();
```

---

## 7. 开发优先级路线图

### 阶段 1: 核心对话功能 (2-3 周)

**目标**: 实现基本的多 Agent 并行对话

**任务**:
1. ✅ Agent 管理页面后端集成
2. 主工作台基础功能
   - Agent 选择面板
   - 消息输入区
   - 多 Agent 响应区
   - SSE 流式响应
3. 会话管理
   - 创建/切换会话
   - 会话列表
4. 基础组件
   - Loading
   - Toast
   - Modal

**验收标准**:
- 用户可以选择多个 Agent
- 用户可以发送消息并实时看到响应
- 会话可以保存和切换

### 阶段 2: 用户体验优化 (1-2 周)

**目标**: 提升易用性和稳定性

**任务**:
1. Agent 登录凭证管理
2. 会话历史页面
3. 错误处理和提示
4. 响应渲染优化
   - Markdown 渲染
   - 代码高亮
   - 复制按钮

**验收标准**:
- Agent 登录流程完整
- 会话历史可查看和管理
- 错误提示友好
- 代码和 Markdown 正确渲染

### 阶段 3: 功能增强 (1-2 周)

**目标**: 添加高级功能

**任务**:
1. 系统设置页面
2. 消息导出功能
3. Agent 测试工具
4. 快捷键支持
5. 性能优化
   - 虚拟滚动
   - 数据缓存
   - 懒加载

**验收标准**:
- 设置可自定义
- 会话可导出
- Agent 可测试
- 快捷键可用
- 性能流畅

### 阶段 4: 高级特性 (1-2 周)

**目标**: 增强用户体验和分析能力

**任务**:
1. 会话分析和统计
2. Agent 使用统计
3. 响应对比视图
4. 主题切换
5. 多语言支持 (P2)

**验收标准**:
- 统计数据准确
- 对比功能可用
- 主题切换流畅
- 多语言支持完整

---

## 8. 技术债务和优化

### 性能优化

- [ ] 虚拟滚动（长消息列表）
- [ ] 图片懒加载
- [ ] 代码分割（路由懒加载）
- [ ] SSE 连接池管理
- [ ] Debounce 搜索输入

### 代码质量

- [ ] 单元测试覆盖率 > 80%
- [ ] E2E 测试关键流程
- [ ] ESLint 规则完善
- [ ] TypeScript 严格模式
- [ ] 代码审查流程

### 可访问性

- [ ] 键盘导航支持
- [ ] ARIA 标签
- [ ] 屏幕阅读器支持
- [ ] 颜色对比度检查
- [ ] 焦点管理

---

## 9. 测试策略

### 单元测试

**工具**: Vitest + React Testing Library

**覆盖范围**:
- 工具函数
- API 客户端
- React Hooks
- 组件逻辑

**示例**:
```typescript
describe('chatApi', () => {
  it('should send message and receive SSE stream', async () => {
    const mockOnMessage = vi.fn();
    await chatApi.sendMessage('Hello', ['kimi'], 'session-1', mockOnMessage);
    expect(mockOnMessage).toHaveBeenCalled();
  });
});
```

### E2E 测试

**工具**: Playwright

**关键流程**:
1. Agent 管理流程
   - ✅ 获取 Agent 列表
   - ✅ 显示 Agent 信息
2. 对话流程
   - [ ] 选择 Agent
   - [ ] 发送消息
   - [ ] 接收响应
3. 会话管理流程
   - [ ] 创建会话
   - [ ] 切换会话
   - [ ] 删除会话

---

## 10. 部署和监控

### 部署策略

**环境**:
- 开发环境: localhost
- 测试环境: staging server
- 生产环境: production server

**CI/CD**:
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm run test
      - run: deploy.sh
```

### 监控指标

**前端**:
- 页面加载时间
- API 请求延迟
- 错误率
- 用户活跃度

**后端**:
- SSE 连接数
- Agent 响应时间
- Token 刷新成功率
- 数据库查询性能

---

## 总结

本模块规划文档按照优先级 (P0/P1/P2) 详细规划了 RoundTable AI 各个页面的功能模块和实现路线图：

**已完成**:
- ✅ 后端架构和 Agent 实现
- ✅ Agent 管理页面后端集成
- ✅ 架构文档

**下一步**:
1. **阶段 1**: 实现主工作台核心对话功能（2-3 周）
2. **阶段 2**: 优化用户体验和会话管理（1-2 周）
3. **阶段 3**: 增强功能和性能优化（1-2 周）
4. **阶段 4**: 高级特性和分析功能（1-2 周）

**开发原则**:
- 优先实现 P0 功能，保证核心流程可用
- 增量开发，每个阶段都有可交付成果
- 持续测试，保证代码质量
- 用户反馈驱动，及时调整优先级

---

**文档版本**: 1.0
**最后更新**: 2025-01-21
**维护者**: RoundTable AI Team
