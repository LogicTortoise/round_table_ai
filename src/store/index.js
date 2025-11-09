import { createStore } from 'vuex'
import VuexPersistence from 'vuex-persist'

// 持久化配置
const vuexLocal = new VuexPersistence({
  key: 'roundtable-ai-store', // 指定存储的key
  storage: window.localStorage,
  reducer: (state) => ({
    kimi: state.kimi,
    geminiApi: state.geminiApi,
    currentChatId: state.currentChatId,
    selectedBots: state.selectedBots
  }),
  // 在状态恢复后打印日志
  restoreState: (key, storage) => {
    const value = storage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        console.log('[Store] 恢复状态:', {
          hasKimiTokens: !!(parsed.kimi?.access_token && parsed.kimi?.refresh_token),
          hasGeminiKey: !!parsed.geminiApi?.apiKey
        })
        return parsed
      } catch (e) {
        console.error('[Store] 恢复状态失败:', e)
      }
    }
    return undefined
  },
  // 保存状态时打印日志
  saveState: (key, state, storage) => {
    console.log('[Store] 保存状态:', {
      hasKimiTokens: !!(state.kimi?.access_token && state.kimi?.refresh_token),
      hasGeminiKey: !!state.geminiApi?.apiKey
    })
    storage.setItem(key, JSON.stringify(state))
  }
})

export default createStore({
  state: {
    // 当前会话ID
    currentChatId: null,

    // 选中的Bot列表
    selectedBots: ['KimiBot', 'GeminiAPIBot'],

    // Kimi 配置
    kimi: {
      access_token: '',
      refresh_token: '',
      enableSearch: true
    },

    // Gemini API 配置
    geminiApi: {
      apiKey: '',
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      pastRounds: 5
    }
  },

  mutations: {
    setCurrentChatId(state, chatId) {
      state.currentChatId = chatId
    },

    setSelectedBots(state, bots) {
      state.selectedBots = bots
    },

    addBot(state, botClassName) {
      if (!state.selectedBots.includes(botClassName)) {
        state.selectedBots.push(botClassName)
      }
    },

    removeBot(state, botClassName) {
      state.selectedBots = state.selectedBots.filter(b => b !== botClassName)
    },

    setKimi(state, data) {
      state.kimi = { ...state.kimi, ...data }
      console.log('[Store] Kimi 配置已更新:', {
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        enableSearch: state.kimi.enableSearch
      })
    },

    setGeminiApi(state, data) {
      state.geminiApi = { ...state.geminiApi, ...data }
    },

    setChatContext(state, { botClassName, context, chatId }) {
      // 这个mutation会被Bot使用，通过database.js来持久化
      // 这里主要用于触发UI更新
      // eslint-disable-next-line no-self-assign
      state.currentChatId = state.currentChatId // Force update
    }
  },

  actions: {
    async initApp({ commit }) {
      // 初始化应用
      console.log('App initialized')
    }
  },

  plugins: [vuexLocal.plugin]
})
