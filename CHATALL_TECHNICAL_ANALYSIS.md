# ChatALL 技术架构与实现原理深度分析

> 📅 文档创建时间: 2025-01-21
> 📍 项目路径: ~/Documents/Personal/github/chathub/ChatALL
> 🔖 标签: Electron, Vue.js, AI聚合, Web API逆向, SSE流式响应

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 整体架构设计](#2-整体架构设计)
- [3. 核心技术实现](#3-核心技术实现)
- [4. 重点Bot实现详解](#4-重点bot实现详解)
- [5. 关键API汇总](#5-关键api汇总)
- [6. 技术选型分析](#6-技术选型分析)
- [7. 代码示例](#7-代码示例)

---

## 1. 项目概述

### 1.1 项目定位

ChatALL是一个基于Electron的桌面应用，允许用户在一个界面中同时向多个AI服务发送问题并对比回答。它通过逆向工程各大AI服务的Web API，实现了无需付费订阅即可使用多个AI服务的功能。

### 1.2 支持的AI服务

| 类别 | AI服务 | 访问方式 |
|------|--------|----------|
| **免费Web版** | Claude AI, Kimi, DeepSeek, Gemini, 文心一言, ChatGLM, QianWen等 | Cookie/Token认证 |
| **付费Web版** | ChatGPT-4, ChatGPT-5, Gemini Advanced | Session认证 |
| **API方式** | Claude API, OpenAI API, Gemini API, Azure OpenAI等 | API Key |

### 1.3 技术栈

```
Frontend: Vue.js 3 + Vuex + Vue Router
Desktop: Electron (主进程 + 渲染进程)
网络请求: axios + sse.js
状态管理: Vuex + IndexedDB (localForage)
UI框架: Element Plus
构建工具: Vue CLI + electron-builder
```

---

## 2. 整体架构设计

### 2.1 双层架构模型

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron 主进程 (Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Cookie/Token 管理和持久化                          │   │
│  │  • Session 自动刷新                                   │   │
│  │  • 请求头拦截和修改 (onBeforeSendHeaders)            │   │
│  │  • 登录窗口管理 (BrowserWindow)                       │   │
│  │  • 代理配置 (HTTP/SOCKS/PAC)                         │   │
│  │  • IPC通信服务                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ IPC Communication
                     │ (ipcMain ↔ ipcRenderer)
┌────────────────────┴────────────────────────────────────────┐
│              Renderer 进程 (Vue.js + Chromium)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Vue应用层                                            │   │
│  │  ├─ 用户界面组件                                      │   │
│  │  ├─ Bot列表管理                                       │   │
│  │  └─ 消息流显示                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Bot实例层                                            │   │
│  │  ├─ Bot基类 (模板方法模式)                            │   │
│  │  ├─ 40+ Bot子类实例                                   │   │
│  │  └─ SSE流式响应处理                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  网络请求层                                           │   │
│  │  ├─ axios (HTTP请求)                                  │   │
│  │  ├─ sse.js (Server-Sent Events)                      │   │
│  │  └─ LangChain (API方式Bot)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  状态管理层                                           │   │
│  │  ├─ Vuex Store                                        │   │
│  │  └─ IndexedDB (localForage)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Bot类设计模式

#### 类层次结构

```
Bot (基类)
├── ClaudeAIBot (网页版)
├── KimiBot (网页版)
├── ChatGPTBot (网页版)
│   ├── ChatGPT4Bot
│   ├── ChatGPT5Bot
│   └── ...
├── BardBot (网页版)
│   ├── GeminiAdvBot
│   └── ...
├── DeepSeekWebBot (网页版)
├── LangChainBot (API基类)
│   ├── ClaudeAPIBot
│   ├── OpenAIAPIBot
│   └── ...
└── ... (40+ Bot类)
```

#### Bot基类核心方法

```javascript
// src/bots/Bot.js
export default class Bot {
  // 静态属性 (每个子类必须定义)
  static _brandId = "bot";          // 品牌ID，用于i18n
  static _className = "Bot";         // 类名
  static _logoFilename = "default-logo.svg";  // Logo文件名
  static _loginUrl = "undefined";    // 登录页面URL
  static _lock = null;               // AsyncLock实例 (可选)

  // 核心方法 (子类必须实现)
  async _checkAvailability() {
    // 检查Bot是否可用（已登录、配置正确等）
    return false;
  }

  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    // 发送消息并处理响应
    throw new Error("Not implemented");
  }

  async createChatContext() {
    // 创建会话上下文
    return null;
  }
}
```

### 2.3 消息流转过程

```
用户输入
  ↓
Vue组件触发sendPrompt
  ↓
遍历所有激活的Bot实例
  ↓
每个Bot执行 sendPrompt()
  ↓
Bot._sendPrompt() 实现具体逻辑
  ├─ 获取会话上下文 (getChatContext)
  ├─ 构造请求 (headers + payload)
  ├─ 发起SSE请求 (sse.js)
  └─ 处理流式响应
      ↓
      onUpdateResponse回调
      ↓
      更新Vuex store
      ↓
      Vue组件响应式更新UI
```

---

## 3. 核心技术实现

### 3.1 身份认证机制

#### 方式1: Cookie-based 认证

**适用Bot**: Claude AI, ChatGPT, Gemini, 文心一言等

**实现流程**:

```javascript
// 1. 创建登录窗口
function createNewWindow({ url, userAgent }) {
  const newWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (userAgent) {
    newWin.webContents.setUserAgent(userAgent);
  }

  newWin.loadURL(url);

  // 2. 窗口关闭时提取Cookie
  newWin.on('close', async (e) => {
    e.preventDefault();

    // Cookie已自动存储在session中
    // 后续请求会自动携带

    mainWindow.webContents.send('CHECK-AVAILABILITY', url);
    newWin.destroy();
  });
}

// 3. 主窗口Cookie自动修改
win.webContents.session.cookies.on('changed', async (event, cookie, cause, removed) => {
  if (!removed && cause === 'explicit' && cookie.sameSite !== 'no_restriction') {
    // 强制修改sameSite属性以支持跨域请求
    await win.webContents.session.cookies.set({
      ...cookie,
      secure: true,
      sameSite: 'no_restriction'  // 关键：允许跨域携带cookie
    });
  }
});
```

**关键点**:
- ✅ Electron的session会自动管理Cookie
- ✅ 修改`sameSite='no_restriction'`突破浏览器跨域限制
- ✅ 所有axios请求自动携带Cookie
- ✅ Cookie持久化，应用重启后仍有效

#### 方式2: Token-based 认证

**适用Bot**: Kimi, DeepSeek等

**实现流程**:

```javascript
// 1. 登录窗口关闭时提取localStorage中的token
newWin.on('close', async (e) => {
  e.preventDefault();

  const getLocalStorage = async (key) => {
    return await newWin.webContents.executeJavaScript(
      `localStorage.getItem("${key}");`
    );
  };

  if (url.startsWith("https://kimi.moonshot.cn/")) {
    // Kimi的token提取
    const access_token = await getLocalStorage("access_token");
    const refresh_token = await getLocalStorage("refresh_token");
    mainWindow.webContents.send("KIMI-TOKENS", {
      access_token,
      refresh_token,
    });
  } else if (url.startsWith("https://chat.deepseek.com/")) {
    // DeepSeek的token存储格式特殊
    const userTokenStr = await getLocalStorage("userToken");
    const userTokenObj = JSON.parse(userTokenStr);
    mainWindow.webContents.send("DEEPSEEK-TOKENS", {
      token: userTokenObj.value,  // 提取value字段
    });
  }
});

// 2. 渲染进程接收token并存储到Vuex
ipcRenderer.on("KIMI-TOKENS", (event, { access_token, refresh_token }) => {
  store.commit("setKimi", { access_token, refresh_token });
});

// 3. Bot发送请求时携带token
async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
  const headers = {
    'Authorization': `Bearer ${store.state.kimi.access_token}`,
    'Content-Type': 'application/json'
  };

  const source = new SSE(url, { headers, payload });
  // ...
}
```

**关键点**:
- ✅ 使用`executeJavaScript`在登录窗口执行JS代码
- ✅ 通过IPC通道传递token到主窗口
- ✅ 存储在Vuex中供Bot使用
- ✅ 每次请求在Header中携带token

#### 方式3: API Key 认证

**适用Bot**: Claude API, OpenAI API, Gemini API等

**实现流程**:

```javascript
// 用户在设置界面手动输入API Key
// 存储在Vuex store中
store.commit("setClaudeApi", { apiKey: "sk-xxx..." });

// Bot使用LangChain框架调用官方SDK
import { ChatAnthropic } from "@langchain/anthropic";

_setupModel() {
  const chatModel = new ChatAnthropic({
    anthropicApiKey: store.state.claudeApi.apiKey,
    anthropicApiUrl: store.state.claudeApi.alterUrl,
    modelName: this.constructor._model,
    streaming: true,
  });
  return chatModel;
}
```

### 3.2 SSE流式响应处理

所有网页版Bot都使用`sse.js`库处理Server-Sent Events流式响应。

#### 标准实现模式

```javascript
import { SSE } from "sse.js";

async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const payload = JSON.stringify({
    message: prompt,
    stream: true,
    // ... 其他参数
  });

  return new Promise((resolve, reject) => {
    const source = new SSE(url, {
      headers,
      payload,
      withCredentials: true,  // 携带cookie
    });

    let text = "";

    // 监听消息事件
    source.addEventListener('message', (event) => {
      if (event.data === '[DONE]') {
        onUpdateResponse(callbackParam, { content: text, done: true });
        source.close();
        resolve();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        text += data.content;

        // 实时更新UI
        onUpdateResponse(callbackParam, {
          content: text,
          done: false
        });
      } catch (error) {
        console.error('Parse error:', error);
      }
    });

    // 监听连接状态变化
    source.addEventListener('readystatechange', (event) => {
      if (event.readyState === source.CLOSED) {
        onUpdateResponse(callbackParam, { done: true });
        resolve();
      }
    });

    // 监听错误
    source.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      source.close();
      reject(new Error('Connection error'));
    });

    // 开始流式传输
    source.stream();
  });
}
```

#### SSE事件处理模式对比

| Bot | 事件类型 | 数据格式 | 特殊处理 |
|-----|---------|---------|---------|
| **Claude** | `completion` | `{completion: "text"}` | 累加文本片段 |
| **Kimi** | `message` | `{event: "cmpl", text: "..."}` | 区分搜索事件 |
| **ChatGPT** | `message` | JSON对象 | 处理代码执行、引用 |
| **DeepSeek** | `message` | `{type: "text/thinking", content: "..."}` | 区分思考和回答 |

### 3.3 会话上下文管理

每个Bot维护独立的会话上下文，存储在Vuex store中。

#### 上下文结构对比

```javascript
// Claude AI
{
  uuid: "550e8400-e29b-41d4-a716-446655440000"
}

// Kimi
{
  chat: "chat_id_12345"
}

// ChatGPT
{
  conversationId: "conv-xxx",
  parentMessageId: "msg-xxx"
}

// DeepSeek
{
  chatId: "uuid-xxx",
  parentMessageId: "msg-xxx"
}

// Gemini (最复杂)
{
  requestParams: {
    atValue: "SNlM0e_value",
    blValue: "cfb2h_value"
  },
  contextIds: ["", "", ""]
}
```

#### 上下文创建和使用流程

```javascript
// 1. 创建新会话上下文
async createChatContext() {
  // 调用API创建新会话
  const response = await axios.post(createUrl, payload);
  return { chatId: response.data.id };
}

// 2. 获取或创建上下文
async getChatContext(createIfNotExists = true) {
  let context = store.state.chats.current?.contexts?.[this.getClassname()];
  if (!context && createIfNotExists) {
    context = await this.createChatContext();
    this.setChatContext(context);
  }
  return context;
}

// 3. 在发送消息时使用上下文
async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
  const context = await this.getChatContext();

  // 使用上下文ID构造API URL
  const url = `${baseUrl}/chat/${context.chatId}/completion`;
  // ...
}

// 4. 更新上下文 (如果服务端返回了新的ID)
if (data.message_id) {
  this.setChatContext({
    ...context,
    parentMessageId: data.message_id
  });
}
```

### 3.4 Electron请求拦截

#### 请求头自动修改

```javascript
// src/background.js
win.webContents.session.webRequest.onBeforeSendHeaders(
  (details, callback) => {
    const { url, requestHeaders } = details;
    const urlObj = new URL(url);

    // 1. 自动设置Referer (防止CSRF检测)
    if (['http:', 'https:'].includes(urlObj.protocol)) {
      const referer = `${urlObj.protocol}//${urlObj.host}/`;
      if (!requestHeaders['Referer'] ||
          requestHeaders['Referer'].includes('127.0.0.1')) {
        requestHeaders['Referer'] = referer;
      }
    }

    // 2. 针对Gemini的特殊处理
    if (url.startsWith('https://gemini.google.com/app')) {
      requestHeaders['sec-fetch-mode'] = 'navigate';
    } else if (url.includes('BardChatUi')) {
      requestHeaders['origin'] = 'https://gemini.google.com';
      requestHeaders['sec-fetch-site'] = 'same-origin';
    }

    // 3. 针对Copilot的特殊处理
    if (url.startsWith('wss://sydney.bing.com/')) {
      requestHeaders['Origin'] = 'https://copilot.microsoft.com';
    }

    callback({ requestHeaders });
  }
);
```

### 3.5 代理配置

```javascript
// 代理配置存储在 userData/proxySetting.json
const defaultProxySetting = {
  enableProxy: false,
  proxyMode: 'normal',        // normal | pacFile | pacUrl
  proxyServer: '',            // 例: "127.0.0.1:7890"
  proxyBypassList: '<local>', // 绕过代理的地址
  pacUrl: '',
  pacFile: '',
  bypassBotsProxy: '[]',      // 不使用代理的Bot列表
};

// 应用启动时设置代理
if (proxySetting.enableProxy) {
  if (proxySetting.proxyMode === 'normal') {
    app.commandLine.appendSwitch('proxy-server', proxySetting.proxyServer);
    app.commandLine.appendSwitch('proxy-bypass-list', proxySetting.proxyBypassList);
  } else if (proxySetting.proxyMode === 'pacUrl') {
    app.commandLine.appendSwitch('proxy-pac-url', proxySetting.pacUrl);
  }
}
```

---

## 4. 重点Bot实现详解

### 4.1 Kimi Bot (Moonshot)

**文件**: `src/bots/moonshot/KimiBot.js`

#### 认证机制

```javascript
// JWT双token机制
{
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // 有效期短
  refresh_token: "refresh_xxx..."                          // 有效期长
}

// 自动刷新access_token
async refreshTokens() {
  const response = await axios.get(
    'https://kimi.moonshot.cn/api/auth/token/refresh',
    {
      headers: {
        Authorization: `Bearer ${store.state.kimi.refresh_token}`
      }
    }
  );

  store.commit('setKimi', {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token
  });
}
```

#### API端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/auth/token/refresh` | GET | 刷新access token |
| `/api/chat` | POST | 创建新会话 |
| `/api/chat/{chat_id}/completion/stream` | POST | 发送消息(流式) |

#### 请求示例

```javascript
// 创建会话
POST https://kimi.moonshot.cn/api/chat
Headers:
  Authorization: Bearer {access_token}
Body:
  {
    "is_example": false,
    "name": "ChatALL"
  }
Response:
  {
    "id": "chat_xxx",
    "name": "ChatALL",
    ...
  }

// 发送消息
POST https://kimi.moonshot.cn/api/chat/{chat_id}/completion/stream
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
  {
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ],
    "refs": [],
    "use_search": true
  }
```

#### SSE事件格式

```javascript
// 搜索开始
data: {"event":"search_plus","msg":{"type":"start_res"}}

// 搜索结果
data: {"event":"search_plus","msg":{"type":"get_res","successNum":3,"title":"页面标题","url":"https://..."}}

// 文本响应
data: {"event":"cmpl","text":"你好"}

// 完成
data: {"event":"all_done"}
```

#### 特色功能

```javascript
// 搜索增强处理
if (data.event === 'search_plus') {
  if (data.msg?.type == 'start_res') {
    beginning += `> 搜索中...\n`;
  } else if (data.msg?.type === 'get_res') {
    beginning += `> 找到 ${data.msg.successNum} 个结果: [${data.msg.title}](${data.msg.url})\n`;
  }
}
```

### 4.2 ChatGPT Bot

**文件**: `src/bots/openai/ChatGPTBot.js`

#### 认证机制

```javascript
// Session + accessToken双重认证
// 1. 获取session (Cookie自动管理)
// 2. 获取accessToken
const response = await axios.get('https://chatgpt.com/api/auth/session');
this.accessToken = response.data.accessToken;

// 3. Session定时刷新
refreshSession() {
  axios.get(REFRESH_SESSION_URL).catch((error) => {
    if (error.response?.status === 403) {
      // Session过期
      this.constructor._isAvailable = false;
    }
  });
}

// 每隔一段时间自动刷新
setInterval(this.refreshSession.bind(this), refreshInterval);
```

#### Arkose Labs反机器人验证

```javascript
// 1. 动态加载Arkose脚本
loadArkoseScript() {
  const script = document.createElement('script');
  script.src = 'https://tcr9i.chatgpt.com/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js';
  script.setAttribute('data-callback', 'setupEnforcement');
  document.body.appendChild(script);

  script.onload = () => {
    window.setupEnforcement = this.setupEnforcement.bind(this);
  };
}

// 2. 配置Arkose回调
setupEnforcement(myEnforcement) {
  ChatGPTBot._myEnforcement = myEnforcement;
  myEnforcement.setConfig({
    onCompleted: (response) => {
      // 验证完成，获取token
      ChatGPTBot._arkosePromise.resolve(response.token);
    },
    onError: (response) => {
      ChatGPTBot._arkosePromise.reject(response);
    }
  });
}

// 3. 需要时获取Arkose token
async getArkoseToken() {
  return new Promise((resolve, reject) => {
    ChatGPTBot._arkosePromise = { resolve, reject };
    ChatGPTBot._myEnforcement.run();  // 触发验证流程
  });
}
```

#### Sentinel Chat Requirements

```javascript
// 在发送消息前获取sentinel token
const result = await axios.post(
  'https://chatgpt.com/backend-api/sentinel/chat-requirements',
  undefined,
  { headers: { Authorization: `Bearer ${this.accessToken}` } }
);

const requirement = result.data;
headers['Openai-Sentinel-Chat-Requirements-Token'] = requirement.token;

// 如果需要Arkose验证
if (requirement.arkose?.required) {
  payload.arkose_token = await this.getArkoseToken();
}
```

#### API端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/auth/session` | GET | 获取session和accessToken |
| `/backend-api/sentinel/chat-requirements` | POST | 获取sentinel token |
| `/backend-api/conversation` | POST | 发送消息(流式) |
| `/backend-api/accounts/check` | GET | 检查付费状态 |

#### 请求示例

```javascript
POST https://chatgpt.com/backend-api/conversation
Headers:
  Authorization: Bearer {accessToken}
  Openai-Sentinel-Chat-Requirements-Token: {sentinelToken}
  Content-Type: application/json
Body:
  {
    "action": "next",
    "conversation_mode": {
      "kind": "primary_assistant"
    },
    "arkose_token": "{arkose_token}",  // 如果需要
    "messages": [
      {
        "id": "{uuid}",
        "author": {"role": "user"},
        "content": {
          "content_type": "text",
          "parts": ["你好"]
        }
      }
    ],
    "conversation_id": "{conversationId}",
    "parent_message_id": "{parentMessageId}",
    "model": "gpt-4",
    "history_and_training_disabled": false
  }
```

#### SSE响应格式

```javascript
// 普通文本
data: {
  "message": {
    "id": "msg-xxx",
    "content": {
      "content_type": "text",
      "parts": ["回答内容"]
    },
    "metadata": {}
  },
  "conversation_id": "conv-xxx"
}

// 代码执行
data: {
  "message": {
    "content": {
      "content_type": "code",
      "text": "print('hello')"
    },
    "status": "finished_successfully"
  }
}

// 引用
data: {
  "message": {
    "metadata": {
      "citations": [
        {
          "metadata": {
            "title": "标题",
            "url": "https://..."
          }
        }
      ]
    }
  }
}

// 结束
data: [DONE]
```

### 4.3 DeepSeek Bot

**文件**: `src/bots/DeepSeekWebBot.js`

#### Token格式

```javascript
// localStorage中的存储格式
localStorage.userToken = '{"value":"TOKEN_STRING","__version":"0"}'

// 提取token
const userTokenStr = await getLocalStorage("userToken");
const userTokenObj = JSON.parse(userTokenStr);
const token = userTokenObj.value;  // 实际的token
```

#### API端点

```javascript
POST https://chat.deepseek.com/api/v0/chat/completions
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
  x-app-version: 20241129.1
  x-client-platform: web
Body:
  {
    "message": "你好",
    "model": "deepseek_chat",
    "stream": true,
    "chat_session_id": "{chatId}",
    "parent_message_id": "{parentMessageId}",
    "thinking_enabled": true,    // 启用思考模式
    "search_enabled": false      // 启用搜索
  }
```

#### Thinking模式实现

```javascript
let text = "";
let thinkingText = "";

source.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  // 思考过程
  if (data.type === 'thinking' && data.content) {
    thinkingText += data.content;

    if (store.state.deepSeekWeb.showThinking) {
      onUpdateResponse(callbackParam, {
        content: `**[Thinking]**\n${thinkingText}\n\n${text}`,
        done: false
      });
    }
  }

  // 实际回答
  if (data.type === 'text' && data.content) {
    text += data.content;

    let displayText = text;
    if (store.state.deepSeekWeb.showThinking && thinkingText) {
      displayText = `**[Thinking]**\n${thinkingText}\n\n${text}`;
    }

    onUpdateResponse(callbackParam, {
      content: displayText,
      done: false
    });
  }
});
```

#### SSE事件格式

```javascript
// 思考过程
data: {"type":"thinking","content":"让我思考一下..."}

// 文本回答
data: {"type":"text","content":"你好！"}

// 会话信息
data: {"chat_id":"uuid-xxx","message_id":"msg-xxx"}

// 结束
data: [DONE]
```

### 4.4 Claude AI Bot

**文件**: `src/bots/ClaudeAIBot.js`

#### 认证机制

```javascript
// Cookie中提取org参数
// 在登录窗口关闭时获取
const org = await getCookie("lastActiveOrg");
mainWindow.webContents.send("CLAUDE-2-ORG", org);

// 存储到store
store.commit("setClaudeAi", { org });

// 检查可用性
async _checkAvailability() {
  if (store.state.claudeAi.org) {
    const response = await axios.get('https://claude.ai/api/account');
    return response.status === 200;
  }
  return false;
}
```

#### API端点

```javascript
// 创建会话
POST https://claude.ai/api/organizations/{org}/chat_conversations
Body:
  {
    "name": "",
    "uuid": "{uuid}"
  }

// 发送消息
POST https://claude.ai/api/organizations/{org}/chat_conversations/{uuid}/completion
Headers:
  Content-Type: application/json
Body:
  {
    "attachments": [],
    "files": [],
    "prompt": "你好",
    "timezone": "Asia/Shanghai"
  }
```

#### SSE响应

```javascript
// 文本片段
event: completion
data: {"completion":"你"}

event: completion
data: {"completion":"好"}

// 流结束时readyState变为CLOSED
```

### 4.5 Gemini Bot (原Bard)

**文件**: `src/bots/google/BardBot.js`

#### 参数提取

```javascript
async createChatContext() {
  const resp = await axios.get('https://gemini.google.com/app');

  // 从HTML源码中提取参数
  const atValue = resp.data.match(/"SNlM0e":"([^"]+)"/)?.[1];
  const blValue = resp.data.match(/"cfb2h":"([^"]+)"/)?.[1];

  if (!atValue || !blValue) {
    throw new Error('Failed to fetch Bard at/bl values');
  }

  return {
    requestParams: { atValue, blValue },
    contextIds: ['', '', '']  // 初始上下文
  };
}
```

#### 请求格式

```javascript
// 生成请求payload (非常复杂的嵌套JSON)
function generateReq(model, prompt, contextIds) {
  let modelNumber = model == 'gemini-ultra' ? 2 : 1;

  let innerJSON = [
    [prompt, 0, null, null, null, null, 0],
    ['en'],
    contextIds,
    '',
    '',
    null,
    [1],
    0,
    // ... 还有100多个null
    modelNumber,
    // ...
  ];

  return JSON.stringify([null, JSON.stringify(innerJSON)]);
}

// 发送请求
POST https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  at={atValue}&f.req={encodedRequest}
Params:
  bl={blValue}
  _reqid={randomNumber}
  rt=c
```

#### 响应解析

```javascript
function parseResponse(resp) {
  // 响应格式非常特殊，需要多次JSON.parse
  let data = JSON.parse(resp.split('\n')[3]);  // 取第4行
  data = JSON.parse(data[0][2]);                // 再次解析

  // 提取文本
  let text = data[4][0][1][0];

  // 提取图片
  const images = data[4][0][4];
  if (images) {
    images.forEach((image) => {
      const url = image[0][0][0];
      const alt = image[0][4];
      const link = image[1][0][0];
      const placeholder = image[2];

      // 替换占位符为Markdown图片
      text = text.replace(
        placeholder,
        `[![${alt}](${url})](${link})`
      );
    });
  }

  // 提取新的上下文ID
  const ids = [...data[1], data[4][0][0]];

  return { text, ids };
}
```

---

## 5. 关键API汇总

### 5.1 Kimi API

```
基础URL: https://kimi.moonshot.cn/api

认证方式: Bearer Token (JWT)

端点列表:
┌────────────────────────────────────────────────────────────────┐
│ GET  /auth/token/refresh                                       │
│      刷新access token                                          │
│      Headers: Authorization: Bearer {refresh_token}            │
│      Response: { access_token, refresh_token }                 │
├────────────────────────────────────────────────────────────────┤
│ POST /chat                                                     │
│      创建新会话                                                │
│      Headers: Authorization: Bearer {access_token}             │
│      Body: { is_example: false, name: "ChatALL" }              │
│      Response: { id: "chat_xxx", ... }                         │
├────────────────────────────────────────────────────────────────┤
│ POST /chat/{chat_id}/completion/stream                         │
│      发送消息（流式响应）                                       │
│      Headers: Authorization: Bearer {access_token}             │
│      Body: {                                                   │
│        messages: [{role: "user", content: "..."}],             │
│        refs: [],                                               │
│        use_search: true                                        │
│      }                                                          │
│      Response: SSE stream                                      │
└────────────────────────────────────────────────────────────────┘

SSE事件类型:
- search_plus: 搜索事件 (msg.type: start_res | get_res)
- cmpl: 文本响应 (text字段)
- all_done: 完成标记
```

### 5.2 ChatGPT API

```
基础URL: https://chatgpt.com

认证方式: Session Cookie + Bearer Token

端点列表:
┌────────────────────────────────────────────────────────────────┐
│ GET  /api/auth/session                                         │
│      获取session信息和accessToken                              │
│      Response: { accessToken: "...", user: {...} }             │
├────────────────────────────────────────────────────────────────┤
│ POST /backend-api/sentinel/chat-requirements                   │
│      获取sentinel token                                        │
│      Headers: Authorization: Bearer {accessToken}              │
│      Response: { token: "...", arkose: {required: bool} }      │
├────────────────────────────────────────────────────────────────┤
│ POST /backend-api/conversation                                 │
│      发送消息（流式响应）                                       │
│      Headers:                                                  │
│        Authorization: Bearer {accessToken}                     │
│        Openai-Sentinel-Chat-Requirements-Token: {token}        │
│      Body: {                                                   │
│        action: "next",                                         │
│        messages: [...],                                        │
│        conversation_id: "...",                                 │
│        parent_message_id: "...",                               │
│        model: "gpt-4",                                         │
│        arkose_token: "..."  // 如果需要                        │
│      }                                                          │
├────────────────────────────────────────────────────────────────┤
│ GET  /backend-api/accounts/check                               │
│      检查账户状态（是否付费）                                  │
│      Headers: Authorization: Bearer {accessToken}              │
│      Response: { account_plan: {is_paid_subscription_active} } │
└────────────────────────────────────────────────────────────────┘

Arkose Labs验证:
URL: https://tcr9i.chatgpt.com/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js
流程: 加载脚本 → 配置回调 → 触发验证 → 获取token
```

### 5.3 DeepSeek API

```
基础URL: https://chat.deepseek.com/api

认证方式: Bearer Token

端点列表:
┌────────────────────────────────────────────────────────────────┐
│ POST /v0/chat/completions                                      │
│      发送消息（流式响应）                                       │
│      Headers:                                                  │
│        Authorization: Bearer {token}                           │
│        x-app-version: 20241129.1                               │
│        x-client-platform: web                                  │
│        x-client-version: 1.5.0                                 │
│      Body: {                                                   │
│        message: "你好",                                        │
│        model: "deepseek_chat",                                 │
│        stream: true,                                           │
│        chat_session_id: "{uuid}",                              │
│        parent_message_id: "{uuid}",                            │
│        thinking_enabled: true,                                 │
│        search_enabled: false                                   │
│      }                                                          │
└────────────────────────────────────────────────────────────────┘

SSE事件类型:
- type: "thinking" - 思考过程 (content字段)
- type: "text" - 实际回答 (content字段)
- chat_id, message_id - 会话信息更新
- [DONE] - 结束标记

Token存储格式:
localStorage.userToken = '{"value":"ACTUAL_TOKEN","__version":"0"}'
```

### 5.4 Claude AI API

```
基础URL: https://claude.ai/api

认证方式: Session Cookie (需要org参数)

端点列表:
┌────────────────────────────────────────────────────────────────┐
│ GET  /account                                                  │
│      获取账户信息                                              │
│      Response: { ... }                                         │
├────────────────────────────────────────────────────────────────┤
│ POST /organizations/{org}/chat_conversations                   │
│      创建新会话                                                │
│      Body: { name: "", uuid: "{uuid}" }                        │
│      Response: { uuid: "...", ... }                            │
├────────────────────────────────────────────────────────────────┤
│ POST /organizations/{org}/chat_conversations/{uuid}/completion │
│      发送消息（流式响应）                                       │
│      Body: {                                                   │
│        attachments: [],                                        │
│        files: [],                                              │
│        prompt: "你好",                                         │
│        timezone: "Asia/Shanghai"                               │
│      }                                                          │
└────────────────────────────────────────────────────────────────┘

SSE事件:
event: completion
data: {"completion":"文本片段"}

org参数获取:
Cookie: lastActiveOrg={org_uuid}
```

### 5.5 Gemini API

```
基础URL: https://gemini.google.com

认证方式: Session Cookie + 特殊参数(at, bl)

端点列表:
┌────────────────────────────────────────────────────────────────┐
│ GET  /app                                                      │
│      获取页面HTML（用于提取at/bl参数）                          │
│      Response: HTML (包含SNlM0e和cfb2h值)                      │
├────────────────────────────────────────────────────────────────┤
│ POST /_/BardChatUi/data/assistant.lamda.BardFrontendService/   │
│      StreamGenerate                                            │
│      发送消息                                                  │
│      Content-Type: application/x-www-form-urlencoded           │
│      Body: at={atValue}&f.req={complexJSON}                    │
│      Query: bl={blValue}&_reqid={random}&rt=c                  │
└────────────────────────────────────────────────────────────────┘

参数提取:
atValue: 正则匹配 /"SNlM0e":"([^"]+)"/
blValue: 正则匹配 /"cfb2h":"([^"]+)"/

响应格式:
非标准JSON，需要:
1. 取第4行
2. 解析两次JSON
3. 从嵌套结构中提取文本和上下文ID
```

### 5.6 API调用示例汇总

```bash
# Kimi - 创建会话
curl -X POST https://kimi.moonshot.cn/api/chat \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"is_example":false,"name":"Test"}'

# ChatGPT - 获取session
curl https://chatgpt.com/api/auth/session

# DeepSeek - 发送消息
curl -X POST https://chat.deepseek.com/api/v0/chat/completions \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-app-version: 20241129.1" \
  -d '{
    "message": "Hello",
    "model": "deepseek_chat",
    "stream": true,
    "thinking_enabled": true
  }'

# Claude - 创建会话
curl -X POST https://claude.ai/api/organizations/${ORG}/chat_conversations \
  -H "Cookie: ..." \
  -d '{"name":"","uuid":"'$(uuidgen)'"}'

# Gemini - 获取参数
curl https://gemini.google.com/app | grep -o '"SNlM0e":"[^"]*"'
```

---

## 6. 技术选型分析

### 6.1 为什么选择Electron？

| 需求 | Electron的优势 |
|------|---------------|
| **跨平台** | 一套代码支持Windows/macOS/Linux |
| **Web技术栈** | 使用Vue.js等熟悉的前端框架 |
| **Session共享** | 统一的Cookie/Storage管理 |
| **请求拦截** | webRequest API可修改请求头 |
| **本地存储** | userData目录持久化配置 |
| **原生能力** | 可执行Node.js代码和系统API |

### 6.2 为什么不用WebView？

传统的WebView嵌入方案的问题：
- ❌ 每个AI服务需要独立的WebView实例（资源消耗大）
- ❌ WebView之间无法共享Cookie
- ❌ 难以实现流式响应的统一处理
- ❌ 无法方便地提取token和参数
- ❌ 调试和错误处理困难

ChatALL的方案优势：
- ✅ 直接调用Web API，性能更好
- ✅ 统一的SSE流式处理
- ✅ Electron session自动管理Cookie
- ✅ 可以在登录窗口执行JS提取token
- ✅ 错误处理和重试机制更灵活

### 6.3 SSE vs WebSocket

选择SSE (Server-Sent Events)的原因：

| 特性 | SSE | WebSocket |
|------|-----|-----------|
| **协议** | HTTP | 独立协议(ws://) |
| **通信方向** | 单向(服务端→客户端) | 双向 |
| **重连** | 浏览器自动重连 | 需要手动实现 |
| **兼容性** | 更好的代理/防火墙兼容 | 可能被阻止 |
| **适用场景** | 流式文本响应 | 实时双向通信 |

AI服务的流式响应是典型的单向数据流，SSE更合适。

### 6.4 Vuex vs Pinia

项目使用Vuex 3.x的原因：
- ✅ Vue 2项目的标准选择
- ✅ 成熟稳定的生态
- ✅ 与IndexedDB (localForage)集成良好
- ✅ 支持modules拆分复杂状态

### 6.5 身份认证方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Cookie** | 自动携带，无需手动管理 | 需要处理sameSite限制 | Claude, Gemini |
| **Token** | 明确的认证凭证 | 需要手动提取和刷新 | Kimi, DeepSeek |
| **API Key** | 官方支持，稳定可靠 | 需要付费，配置复杂 | OpenAI API, Claude API |

### 6.6 AsyncLock的必要性

为什么需要锁机制？

```javascript
// 问题场景：用户快速连续发送多条消息
user.send("消息1");  // 触发API调用
user.send("消息2");  // 可能在消息1完成前触发

// ChatGPT等服务不支持并发请求
// 需要等待上一个请求完成后才能发送下一个

// 解决方案：AsyncLock
import AsyncLock from 'async-lock';
static _lock = new AsyncLock();

await this.acquireLock('sendPrompt', async () => {
  // 这里的代码同一时间只有一个实例在执行
  await this._sendPrompt(prompt, onUpdateResponse, callbackParam);
});
```

---

## 7. 代码示例

### 7.1 实现一个新的Bot

假设要添加一个名为"ExampleAI"的新Bot：

```javascript
// src/bots/ExampleAIBot.js
import Bot from "@/bots/Bot";
import axios from "axios";
import { SSE } from "sse.js";
import AsyncLock from "async-lock";
import store from "@/store";

export default class ExampleAIBot extends Bot {
  // 1. 定义静态属性
  static _brandId = "exampleAi";
  static _className = "ExampleAIBot";
  static _logoFilename = "example-ai-logo.svg";
  static _loginUrl = "https://example-ai.com/";
  static _lock = new AsyncLock();  // 如果需要防并发

  constructor() {
    super();
  }

  // 2. 实现可用性检查
  async _checkAvailability() {
    try {
      // 方法A: 检查是否有token
      if (store.state.exampleAi.token) {
        return true;
      }

      // 方法B: 发起API请求验证
      const response = await axios.get('https://example-ai.com/api/user');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // 3. 实现发送消息
  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    const context = await this.getChatContext();

    const headers = {
      'Authorization': `Bearer ${store.state.exampleAi.token}`,
      'Content-Type': 'application/json',
    };

    const payload = JSON.stringify({
      message: prompt,
      conversation_id: context.conversationId,
      stream: true,
    });

    return new Promise((resolve, reject) => {
      try {
        const source = new SSE('https://example-ai.com/api/chat', {
          headers,
          payload,
          withCredentials: true,
        });

        let text = "";

        source.addEventListener('message', (event) => {
          if (event.data === '[DONE]') {
            onUpdateResponse(callbackParam, { content: text, done: true });
            source.close();
            resolve();
            return;
          }

          try {
            const data = JSON.parse(event.data);
            text += data.content;

            onUpdateResponse(callbackParam, {
              content: text,
              done: false
            });
          } catch (error) {
            console.error('Parse error:', error);
          }
        });

        source.addEventListener('error', (event) => {
          console.error('SSE error:', event);
          source.close();
          reject(new Error('Connection error'));
        });

        source.stream();
      } catch (error) {
        reject(error);
      }
    });
  }

  // 4. 实现会话上下文创建
  async createChatContext() {
    try {
      const response = await axios.post(
        'https://example-ai.com/api/conversation',
        {},
        {
          headers: {
            'Authorization': `Bearer ${store.state.exampleAi.token}`
          }
        }
      );

      return {
        conversationId: response.data.id
      };
    } catch (error) {
      console.error('Create context error:', error);
      return { conversationId: null };
    }
  }
}
```

### 7.2 注册新Bot

```javascript
// src/bots/index.js
import ExampleAIBot from "@/bots/ExampleAIBot";

const all = [
  // ... 其他Bot
  ExampleAIBot.getInstance(),
];

export const botTags = {
  free: [
    // ...
    bots.getBotByClassName("ExampleAIBot"),
  ],
};
```

### 7.3 添加Token提取逻辑

```javascript
// src/background.js
newWin.on('close', async (e) => {
  e.preventDefault();

  const getLocalStorage = async (key) => {
    return await newWin.webContents.executeJavaScript(
      `localStorage.getItem("${key}");`
    );
  };

  if (url.startsWith("https://example-ai.com/")) {
    const token = await getLocalStorage("auth_token");
    mainWindow.webContents.send("EXAMPLEAI-TOKEN", token);
  }

  newWin.destroy();
});
```

### 7.4 Vuex Store配置

```javascript
// src/store/index.js
export default new Vuex.Store({
  state: {
    exampleAi: {
      token: "",
    },
  },
  mutations: {
    setExampleAi(state, payload) {
      state.exampleAi = { ...state.exampleAi, ...payload };
    },
  },
});
```

### 7.5 IPC监听

```javascript
// src/main.js or App.vue
import { ipcRenderer } from "electron";

ipcRenderer.on("EXAMPLEAI-TOKEN", (event, token) => {
  store.commit("setExampleAi", { token });
  // 重新检查可用性
  // ...
});
```

### 7.6 添加i18n翻译

```javascript
// src/i18n/locales/en.json
{
  "exampleAi": {
    "name": "Example AI"
  }
}

// src/i18n/locales/zh.json
{
  "exampleAi": {
    "name": "示例AI"
  }
}
```

### 7.7 添加Logo

```bash
# 将logo文件放置在public/bots/目录
public/bots/example-ai-logo.svg
```

---

## 8. 最佳实践与注意事项

### 8.1 安全性考虑

#### Token存储安全

```javascript
// ❌ 不要在代码中硬编码token
const token = "sk-xxx...";

// ✅ 使用Vuex + 持久化存储
store.commit("setBot", { token: userInput });

// ✅ Electron的userData目录有操作系统级权限保护
const userDataPath = app.getPath('userData');
```

#### CSRF防护

```javascript
// Electron自动设置正确的Referer
win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
  const url = new URL(details.url);
  requestHeaders['Referer'] = `${url.protocol}//${url.host}/`;
  callback({ requestHeaders });
});
```

#### XSS防护

```javascript
// ❌ 直接渲染HTML
<div v-html="botResponse"></div>

// ✅ 使用Markdown渲染器（已过滤）
<div v-html="renderMarkdown(botResponse)"></div>
```

### 8.2 错误处理

```javascript
async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
  try {
    // 业务逻辑
  } catch (error) {
    // 1. 日志记录
    console.error(`[${this.getClassname()}] Error:`, error);

    // 2. 用户友好的错误提示
    let message = "Unknown error";
    if (error.response?.status === 429) {
      message = "Rate limit exceeded. Please try again later.";
    } else if (error.response?.status === 401) {
      message = "Authentication failed. Please log in again.";
    }

    // 3. 更新UI
    onUpdateResponse(callbackParam, {
      content: this.wrapCollapsedSection(message),
      done: true
    });

    // 4. 不要throw，否则会中断其他Bot
    return;
  }
}
```

### 8.3 性能优化

#### 减少重复请求

```javascript
// 缓存session检查结果
let lastCheck = 0;
const CHECK_INTERVAL = 5 * 60 * 1000;  // 5分钟

async _checkAvailability() {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL) {
    return this.constructor._isAvailable;
  }

  lastCheck = now;
  this.constructor._isAvailable = await this.doActualCheck();
  return this.constructor._isAvailable;
}
```

#### 使用AsyncLock控制并发

```javascript
// 限制同时进行的请求数量
static _lock = new AsyncLock({ maxPending: 5 });
```

### 8.4 调试技巧

#### 开启详细日志

```javascript
// 在Bot的关键位置添加日志
console.log(`[${this.getClassname()}] Sending prompt:`, prompt.substring(0, 50));
console.log(`[${this.getClassname()}] Context:`, context);
console.log(`[${this.getClassname()}] Response:`, event.data);
```

#### 使用DevTools

```javascript
// development模式自动打开DevTools
if (!process.env.IS_TEST) {
  win.webContents.openDevTools();
}

// 在代码中触发debugger
if (process.env.NODE_ENV === 'development') {
  debugger;
}
```

#### 监控网络请求

```javascript
// 在主进程中监控所有网络请求
win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
  console.log('[Network]', details.method, details.url);
  callback({});
});
```

---

## 9. 总结

### 9.1 核心技术要点

1. **双层架构**: Electron主进程负责认证管理，渲染进程负责业务逻辑
2. **模板方法模式**: Bot基类定义统一接口，子类实现具体逻辑
3. **Session共享**: 利用Electron session实现Cookie自动管理
4. **SSE流式响应**: 统一使用sse.js处理实时响应
5. **IPC通信**: 主进程与渲染进程之间的数据传递
6. **请求拦截**: 自动修改请求头绕过CORS和CSRF限制

### 9.2 创新点

- ✨ **API逆向**: 直接调用Web版API而非官方SDK
- ✨ **Cookie劫持**: 修改sameSite属性突破跨域限制
- ✨ **Token提取**: 在登录窗口执行JS代码提取localStorage
- ✨ **统一流式处理**: 所有Bot使用相同的SSE处理模式
- ✨ **多AI并发**: 同时向多个AI服务发送问题并对比

### 9.3 适用场景

- ✅ AI服务聚合平台
- ✅ 多模型对比工具
- ✅ API逆向工程学习
- ✅ Electron应用开发参考
- ✅ SSE流式响应实现

### 9.4 局限性

- ⚠️ 依赖Web API稳定性（API变更需要更新）
- ⚠️ 可能违反服务条款（仅供学习研究）
- ⚠️ 无法使用官方SDK的高级功能
- ⚠️ 需要手动处理反爬虫机制（如Arkose）

---

## 10. 参考资源

- [Electron官方文档](https://www.electronjs.org/docs)
- [sse.js库](https://github.com/mpetazzoni/sse.js)
- [AsyncLock库](https://github.com/rogierschouten/async-lock)
- [LangChain.js](https://js.langchain.com/)
- [ChatALL GitHub](https://github.com/sunner/ChatALL)

---

**文档维护**: 请定期更新API端点和认证方式，因为各AI服务可能随时改变其内部API。

**免责声明**: 本文档仅供技术学习和研究使用。使用逆向工程的API可能违反相关服务的使用条款，请在使用前仔细阅读并遵守各服务的TOS。
