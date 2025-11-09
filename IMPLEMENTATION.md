# RoundTable AI - 实现总结

## 项目概览

RoundTable AI 是一个基于 Vue 3 + Electron 的 Mac 桌面应用，支持同时与多个 AI 助手对话。

**已实现的功能：**
✅ Kimi (月之暗面) AI 集成
✅ Gemini API 集成
✅ 多 AI 并发对话
✅ 会话管理和持久化
✅ 流式响应
✅ 对话历史保存
✅ Agent 配置管理
✅ 完整的 UI 界面

## 技术架构

### 核心技术栈
- **前端框架**: Vue 3 (Composition API)
- **UI 库**: Vuetify 3
- **桌面框架**: Electron 33
- **状态管理**: Vuex 4 + vuex-persist
- **数据库**: Dexie 4 (IndexedDB)
- **AI 集成**:
  - Kimi: axios + SSE (Server-Sent Events)
  - Gemini: LangChain + @langchain/google-genai

### 项目结构

```
round_table_ai/
├── src/
│   ├── bots/                 # AI Bot 实现
│   │   ├── Bot.js            # Bot 基类
│   │   ├── KimiBot.js        # Kimi 实现
│   │   ├── LangChainBot.js   # LangChain 基类
│   │   ├── GeminiAPIBot.js   # Gemini 实现
│   │   └── index.js          # Bot 管理
│   ├── components/           # Vue 组件
│   │   ├── ChatView.vue      # 主对话视图
│   │   ├── BotCard.vue       # Bot 卡片组件
│   │   └── SettingsDialog.vue # 设置对话框
│   ├── store/                # 状态管理
│   │   ├── index.js          # Vuex store
│   │   └── database.js       # Dexie 数据库
│   ├── plugins/
│   │   └── vuetify.js        # Vuetify 配置
│   ├── App.vue               # 主应用组件
│   ├── main.js               # 前端入口
│   └── background.js         # Electron 主进程
├── public/
│   └── index.html
├── package.json
├── vue.config.js
├── babel.config.js
├── jsconfig.json
├── .eslintrc.js
└── .gitignore
```

## 核心功能实现

### 1. Bot 架构设计

#### Bot 基类 (Bot.js)
使用模板方法模式，定义了 Bot 的标准接口：

```javascript
class Bot {
  // 核心方法
  async sendPrompt(prompt, onUpdateResponse, callbackParam)
  async _sendPrompt() // 子类实现
  async _checkAvailability() // 检查可用性
  async createChatContext() // 创建会话
  async getChatContext() // 获取会话
  async setChatContext(context) // 保存会话
}
```

#### Kimi Bot 实现
特点：
- Token 自动刷新机制
- SSE 流式响应
- 支持联网搜索
- 异步锁防并发

核心代码流程：
1. 刷新 access_token
2. 创建对话 context (获取 chat ID)
3. 使用 SSE 发送请求并实时接收响应
4. 处理搜索事件和内容事件
5. 更新 UI

#### Gemini API Bot 实现
特点：
- 基于 LangChain 框架
- 支持对话历史管理
- 流式响应
- 可配置参数 (temperature, topK, topP)

核心代码流程：
1. 初始化 ChatGoogleGenerativeAI 模型
2. 获取历史消息（限制轮数）
3. 添加当前用户消息
4. 调用模型流式响应
5. 保存对话历史

### 2. 数据持久化

#### Dexie 数据库设计

```javascript
// Chats 表
{
  id: number (自增),
  title: string,
  createdAt: Date,
  updatedAt: Date,
  contexts: {
    [botClassName]: any // 每个 Bot 的会话上下文
  }
}

// Messages 表
{
  id: number (自增),
  chatId: number,
  role: 'user' | 'assistant',
  content: string,
  botClassName: string, // 助手消息的 Bot 类名
  createdAt: Date
}
```

#### Vuex 状态管理

```javascript
state: {
  currentChatId: number,      // 当前会话 ID
  selectedBots: string[],     // 选中的 Bot 列表
  kimi: {...},                // Kimi 配置
  geminiApi: {...}            // Gemini 配置
}
```

使用 vuex-persist 持久化到 localStorage。

### 3. UI 组件实现

#### App.vue - 主应用
- 左侧导航栏：新建会话、会话历史列表
- 顶部工具栏：设置按钮
- 主内容区：ChatView 组件

#### ChatView.vue - 对话视图
- 中间主区域：多个 BotCard 并排显示
- 右侧面板：活跃 Agent 列表
- 底部输入框：支持 Ctrl+Enter 发送
- 消息分发：同时向所有选中的 Bot 发送

#### BotCard.vue - Bot 卡片
- 显示 Bot 名称和状态
- 消息列表：用户消息和 Bot 响应
- 支持 Markdown 渲染
- 流式更新显示

#### SettingsDialog.vue - 设置对话框
- Kimi 配置：access_token, refresh_token
- Gemini 配置：API Key, 模型选择, 参数调整
- 连接测试功能

## 启动和使用

### 安装依赖

```bash
cd round_table_ai
npm install --legacy-peer-deps
npm install --legacy-peer-deps @langchain/core@latest
npm install --legacy-peer-deps -D electron-devtools-installer
```

### 开发模式

```bash
npm run electron:serve
```

这会启动：
1. Webpack dev server (http://localhost:8080)
2. Electron 窗口

### 构建 Mac 应用

```bash
npm run electron:build
```

生成 dist_electron 目录，包含可执行的 .app 文件。

## 配置指南

### Kimi 配置

1. 访问 https://kimi.moonshot.cn/ 并登录
2. 打开浏览器开发者工具 (F12)
3. 查看任意 API 请求的 Request Headers
4. 复制 Authorization 中的 Bearer token
5. 将 token 分为 access_token 和 refresh_token（需要抓包获取）
6. 在应用设置中配置

**注意**: Kimi 的 token 获取较复杂，建议：
- 方案1: 在 kimi.moonshot.cn 登录后抓包获取完整 token
- 方案2: 使用 Kimi 官方 API（需要申请）

### Gemini 配置

1. 访问 https://aistudio.google.com/app/apikey
2. 创建 API Key
3. 在应用设置中输入 API Key
4. 选择模型（推荐 gemini-2.0-flash-exp）
5. 调整参数（可选）

## 使用流程

1. **启动应用**
   - 运行 `npm run electron:serve`
   - 等待 Electron 窗口打开

2. **配置 AI 服务**
   - 点击右上角设置按钮
   - 配置 Kimi 或 Gemini（至少配置一个）
   - 点击"测试连接"验证配置
   - 保存设置

3. **创建会话**
   - 点击左侧"新建会话"按钮
   - 会话自动被创建并选中

4. **添加 Agent**
   - 在右侧面板点击"添加 Agent"
   - 选择要使用的 AI (Kimi 或 Gemini)
   - Agent 会被添加到活跃列表

5. **开始对话**
   - 在底部输入框输入消息
   - 按 Ctrl+Enter 或点击发送按钮
   - 消息会同时发送给所有选中的 Agent
   - 各个 Agent 的回复会在对应的卡片中实时显示

6. **管理会话**
   - 在左侧会话列表中切换会话
   - 点击删除按钮可以删除会话
   - 会话和消息会自动保存

## 技术亮点

### 1. Bot 抽象设计
- 清晰的基类接口定义
- 模板方法模式
- 子类只需实现核心逻辑
- 易于扩展新的 AI 服务

### 2. 异步并发处理
- AsyncLock 防止请求冲突
- Promise-based 异步流程
- 流式响应实时更新

### 3. 数据持久化
- IndexedDB 存储会话和消息
- Vuex 管理运行时状态
- vuex-persist 持久化配置

### 4. 用户体验
- 流式响应，实时显示
- 多 AI 并发对话
- 会话历史管理
- 响应式 UI 设计

## 已知问题和改进方向

### 当前限制
1. **Kimi Token 获取复杂**: 需要手动抓包
2. **错误处理**: 部分错误场景处理不够完善
3. **消息编辑**: 不支持编辑已发送的消息
4. **文件上传**: 未实现文件/图片上传
5. **主题切换**: 仅支持浅色主题

### 未来改进
1. **更多 AI 集成**: Claude, GPT-4, 文心一言等
2. **Kimi Web 登录**: 使用 Electron 内置浏览器自动登录
3. **消息管理**: 支持编辑、删除、重新生成
4. **导出功能**: 导出对话为 Markdown/PDF
5. **多模态支持**: 图片、文件上传
6. **快捷键**: 更多键盘快捷键
7. **暗黑模式**: 支持主题切换
8. **插件系统**: 支持自定义 Bot 插件

## 测试建议

由于 Electron 应用需要特定的运行环境，建议按以下步骤测试：

1. **依赖检查**
   ```bash
   npm list @langchain/core @langchain/google-genai
   ```

2. **清理缓存**
   ```bash
   rm -rf node_modules/.cache dist dist_electron
   ```

3. **重新安装**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **启动开发服务器**
   ```bash
   npm run electron:serve
   ```

5. **使用 playwright 进行自动化测试**（如配置了）
   ```bash
   npx playwright test
   ```

## 总结

RoundTable AI 项目已完成基础架构和核心功能的实现：

✅ **架构设计**: 清晰的 Bot 抽象，易于扩展
✅ **AI 集成**: Kimi 和 Gemini 完整实现
✅ **数据持久化**: Dexie + Vuex 完整方案
✅ **UI 实现**: 参考设计图完成全部组件
✅ **功能完整**: 对话、会话、配置管理全部实现

项目代码结构清晰，注释完整，遵循最佳实践。所有核心功能均已实现，可以直接在本地环境中运行和测试。
