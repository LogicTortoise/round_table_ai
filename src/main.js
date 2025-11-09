import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'
import { loadFromLocalStorage } from './store/persist'

// 初始化数据库
import './store/database'

// 手动恢复持久化状态
const savedState = loadFromLocalStorage()
if (savedState) {
  // 恢复 Kimi 配置
  if (savedState.kimi) {
    store.commit('setKimi', savedState.kimi)
  }
  // 恢复 Gemini 配置
  if (savedState.geminiApi) {
    store.commit('setGeminiApi', savedState.geminiApi)
  }
  // 恢复其他状态
  if (savedState.currentChatId) {
    store.commit('setCurrentChatId', savedState.currentChatId)
  }
  if (savedState.selectedBots) {
    store.commit('setSelectedBots', savedState.selectedBots)
  }
  console.log('[Main] 已恢复持久化状态')
}

const app = createApp(App)

app.use(store)
app.use(vuetify)

app.mount('#app')
