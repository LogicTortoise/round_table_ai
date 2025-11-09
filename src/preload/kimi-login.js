/**
 * Kimi 登录窗口预加载脚本
 * 用于拦截登录请求并提取 token
 */

const { contextBridge, ipcRenderer } = require('electron')

// 监听页面加载完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Kimi Login Preload] Page loaded')

  // 拦截所有 fetch 请求
  const originalFetch = window.fetch
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args)

    // 克隆响应以便读取
    const clonedResponse = response.clone()

    try {
      const url = args[0]

      // 检查是否是登录或刷新 token 的请求
      if (url.includes('/api/auth/token') || url.includes('/api/auth')) {
        const data = await clonedResponse.json()

        // 检查响应中是否包含 token
        if (data.access_token && data.refresh_token) {
          console.log('[Kimi Login Preload] Tokens captured!')

          // 发送 token 到主进程
          ipcRenderer.send('kimi-tokens-captured', {
            access_token: data.access_token,
            refresh_token: data.refresh_token
          })
        }
      }
    } catch (error) {
      console.error('[Kimi Login Preload] Error parsing response:', error)
    }

    return response
  }

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open
  const originalXHRSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url
    return originalXHROpen.call(this, method, url, ...rest)
  }

  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      try {
        if (this._url && (this._url.includes('/api/auth/token') || this._url.includes('/api/auth'))) {
          const data = JSON.parse(this.responseText)

          if (data.access_token && data.refresh_token) {
            console.log('[Kimi Login Preload] Tokens captured via XHR!')

            ipcRenderer.send('kimi-tokens-captured', {
              access_token: data.access_token,
              refresh_token: data.refresh_token
            })
          }
        }
      } catch (error) {
        console.error('[Kimi Login Preload] Error parsing XHR response:', error)
      }
    })

    return originalXHRSend.apply(this, args)
  }
})

// 暴露 API 给渲染进程（如果需要）
contextBridge.exposeInMainWorld('kimiLogin', {
  onTokensCaptured: (callback) => {
    ipcRenderer.on('tokens-saved', callback)
  }
})
