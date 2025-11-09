import store from '@/store'
import { Chats } from '@/store/database'

/**
 * Bot 基类
 * 所有AI Bot都应该继承这个类
 */
export default class Bot {
  // 静态属性 - 子类需要覆盖
  static _brandId = 'bot'
  static _className = 'Bot'
  static _model = ''
  static _logoFilename = 'default-logo.svg'
  static _loginUrl = ''
  static _lock = null // AsyncLock 实例
  static _isAvailable = false

  constructor() {}

  // 获取Bot实例
  static getInstance() {
    return new this()
  }

  // 获取Logo路径
  getLogo() {
    return `bots/${this.constructor._logoFilename}`
  }

  // 获取品牌名称
  getBrandName() {
    const className = this.constructor._className
    return className.replace('Bot', '')
  }

  // 获取模型名称
  getModelName() {
    return this.constructor._model
  }

  // 获取完整名称
  getFullname() {
    const brand = this.getBrandName()
    const model = this.getModelName()
    return model ? `${model}@${brand}` : brand
  }

  // 获取类名
  getClassname() {
    return this.constructor._className
  }

  // 获取登录URL
  getLoginUrl() {
    return this.constructor._loginUrl
  }

  // 检查是否可用
  isAvailable() {
    return this.constructor._isAvailable
  }

  /**
   * 发送提示 - 主入口方法
   * @param {string} prompt - 用户输入
   * @param {function} onUpdateResponse - 回调函数 (callbackParam, {content, done})
   * @param {object} callbackParam - 传递给回调的参数
   */
  async sendPrompt(prompt, onUpdateResponse, callbackParam) {
    // 检查可用性
    if (!this.isAvailable()) {
      onUpdateResponse(callbackParam, {
        content: `${this.getFullname()} 未登录或配置不正确`,
        done: true,
        error: 'NOT_AVAILABLE'
      })
      return
    }

    const executeSendPrompt = async () => {
      // 开始思考
      onUpdateResponse(callbackParam, { content: '思考中...', done: false })

      try {
        await this._sendPrompt(prompt, onUpdateResponse, callbackParam)
      } catch (error) {
        console.error(`Error in ${this.getFullname()}:`, error)
        onUpdateResponse(callbackParam, {
          content: `错误: ${error.message}`,
          done: true,
          error: error.message
        })
      }
    }

    // 如果有锁，则使用锁
    if (this.constructor._lock) {
      await this.acquireLock('sendPrompt', executeSendPrompt, () => {
        onUpdateResponse(callbackParam, {
          content: `${this.getBrandName()} 正在处理其他请求，请稍候...`,
          done: false
        })
      })
    } else {
      await executeSendPrompt()
    }
  }

  /**
   * 获取锁
   */
  async acquireLock(key, lockedFn, onLockUnavailable) {
    const self = this
    return new Promise((resolve, reject) => {
      (async () => {
        await this.constructor._lock.acquire(
          key,
          async () => {
            try {
              const ret = await lockedFn()
              resolve(ret)
            } catch (err) {
              reject(err)
            }
          },
          async function (err, ret) {
            if (err) {
              onLockUnavailable()
              try {
                const ret = await self.constructor._lock.acquire(key, lockedFn)
                resolve(ret)
              } catch (err) {
                reject(err)
              }
            } else {
              resolve(ret)
            }
          },
          { timeout: 1 }
        )
      })()
    })
  }

  /**
   * 子类必须实现 - 发送提示的核心逻辑
   */
  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    throw new Error('子类必须实现 _sendPrompt 方法')
  }

  /**
   * 子类必须实现 - 检查可用性
   */
  async _checkAvailability() {
    return false
  }

  /**
   * 检查并更新可用性状态
   */
  async checkAvailability() {
    this.constructor._isAvailable = await this._checkAvailability()
    return this.isAvailable()
  }

  /**
   * 创建会话上下文 - 子类可覆盖
   */
  async createChatContext() {
    return null
  }

  /**
   * 获取会话上下文
   */
  async getChatContext(createIfNotExists = true) {
    const chatId = store.state.currentChatId
    if (!chatId) return null

    let context = await Chats.getContext(chatId, this.getClassname())

    if (!context && createIfNotExists) {
      context = await this.createChatContext()
      await this.setChatContext(context)
    }

    return context
  }

  /**
   * 设置会话上下文
   */
  async setChatContext(context) {
    const chatId = store.state.currentChatId
    if (!chatId) return

    await Chats.setContext(chatId, this.getClassname(), context)

    // 触发Vuex更新（用于UI响应）
    store.commit('setChatContext', {
      botClassName: this.getClassname(),
      context,
      chatId
    })
  }
}
