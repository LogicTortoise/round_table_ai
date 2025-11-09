# RoundTable AI

与多个 AI 助手同时对话的 Mac 桌面应用

## 功能特性

- ✅ 同时与多个 AI 对话
- ✅ 支持 Kimi (月之暗面)
- ✅ 支持 Gemini API
- ✅ 会话历史持久化
- ✅ 流式响应
- ✅ 对话窗口可配置

## 技术栈

- Vue 3 + Composition API
- Vuetify 3 (Material Design)
- Electron
- Vuex + vuex-persist
- Dexie (IndexedDB)
- LangChain

## 项目结构

```
round_table_ai/
├── src/
│   ├── bots/              # AI Bot 实现
│   │   ├── Bot.js         # Bot 基类
│   │   ├── KimiBot.js     # Kimi 实现
│   │   ├── LangChainBot.js
│   │   ├── GeminiAPIBot.js
│   │   └── index.js
│   ├── components/        # Vue 组件
│   │   ├── ChatView.vue
│   │   ├── BotCard.vue
│   │   └── SettingsDialog.vue
│   ├── store/             # 状态管理
│   │   ├── index.js       # Vuex store
│   │   └── database.js    # Dexie 数据库
│   ├── plugins/
│   │   └── vuetify.js
│   ├── App.vue
│   ├── main.js
│   └── background.js      # Electron 主进程
├── public/
├── package.json
└── vue.config.js
```

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron:serve
```

### 构建 Mac 应用

```bash
npm run electron:build
```

## 配置

### Kimi 配置

1. 访问 https://kimi.moonshot.cn/
2. 登录账号
3. 打开浏览器开发者工具 (F12)
4. 在 Network 标签中找到任意请求
5. 复制请求头中的 Authorization 字段（Bearer 后面的部分）
6. 将 access_token 和 refresh_token 填入设置

### Gemini 配置

1. 访问 https://aistudio.google.com/app/apikey
2. 创建 API Key
3. 将 API Key 填入设置

## 使用说明

1. 启动应用
2. 点击右上角设置按钮配置 AI 服务
3. 点击左侧"新建会话"创建对话
4. 在右侧面板添加/移除 Agent
5. 在底部输入框输入消息，按 Ctrl+Enter 发送
6. 消息会同时发送给所有选中的 Agent

## License

MIT
