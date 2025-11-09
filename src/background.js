'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let mainWindow = null

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // 允许跨域请求
    },
    titleBarStyle: 'hiddenInset', // Mac 样式
    title: 'RoundTable AI'
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// IPC handlers

// Kimi 登录窗口
ipcMain.handle('open-kimi-login', async (event) => {
  const path = require('path')

  // 获取正确的 preload 脚本路径
  let preloadPath
  if (isDevelopment) {
    // 开发模式：使用 src 目录
    preloadPath = path.join(__dirname, '..', 'src', 'preload', 'kimi-login.js')
  } else {
    // 生产模式：使用打包后的路径
    preloadPath = path.join(__dirname, 'preload', 'kimi-login.js')
  }

  console.log('[Main] Loading preload script from:', preloadPath)

  const loginWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: false // 允许跨域
    },
    title: 'Kimi 登录'
  })

  // 加载 Kimi 登录页面
  loginWindow.loadURL('https://kimi.moonshot.cn/')

  return new Promise((resolve, reject) => {
    // 监听 token 捕获事件
    const tokenHandler = (event, tokens) => {
      console.log('[Main] Kimi tokens captured:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token
      })

      // 发送 token 到渲染进程
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('kimi-tokens-received', tokens)
      }

      // 关闭登录窗口
      if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.close()
      }

      resolve(tokens)
    }

    ipcMain.once('kimi-tokens-captured', tokenHandler)

    loginWindow.on('closed', () => {
      ipcMain.removeListener('kimi-tokens-captured', tokenHandler)
      resolve(null)
    })
  })
})

// 通用登录窗口（保留原有功能）
ipcMain.handle('open-login-window', async (event, { url }) => {
  const loginWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  loginWindow.loadURL(url)

  return new Promise((resolve) => {
    loginWindow.on('closed', () => {
      resolve()
    })
  })
})
