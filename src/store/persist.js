/**
 * 手动持久化工具
 * 用于确保关键数据被正确保存到 localStorage
 */

const STORE_KEY = 'roundtable-ai-store'

/**
 * 保存状态到 localStorage
 */
export function saveToLocalStorage(state) {
  try {
    const data = {
      kimi: state.kimi,
      geminiApi: state.geminiApi,
      currentChatId: state.currentChatId,
      selectedBots: state.selectedBots
    }

    localStorage.setItem(STORE_KEY, JSON.stringify(data))
    console.log('[Persist] 状态已保存:', {
      hasKimiTokens: !!(data.kimi?.access_token && data.kimi?.refresh_token),
      hasGeminiKey: !!data.geminiApi?.apiKey,
      selectedBots: data.selectedBots?.length || 0
    })
    return true
  } catch (error) {
    console.error('[Persist] 保存失败:', error)
    return false
  }
}

/**
 * 从 localStorage 加载状态
 */
export function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem(STORE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      console.log('[Persist] 状态已加载:', {
        hasKimiTokens: !!(parsed.kimi?.access_token && parsed.kimi?.refresh_token),
        hasGeminiKey: !!parsed.geminiApi?.apiKey,
        selectedBots: parsed.selectedBots?.length || 0
      })
      return parsed
    }
  } catch (error) {
    console.error('[Persist] 加载失败:', error)
  }
  return null
}

/**
 * 清除保存的状态
 */
export function clearLocalStorage() {
  try {
    localStorage.removeItem(STORE_KEY)
    console.log('[Persist] 状态已清除')
    return true
  } catch (error) {
    console.error('[Persist] 清除失败:', error)
    return false
  }
}

export default {
  save: saveToLocalStorage,
  load: loadFromLocalStorage,
  clear: clearLocalStorage
}
