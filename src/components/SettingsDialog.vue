<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800">
    <v-card>
      <v-card-title>设置</v-card-title>
      <v-divider></v-divider>

      <v-card-text style="max-height: 600px; overflow-y: auto;">
        <v-tabs v-model="tab" align-tabs="start">
          <v-tab value="kimi">Kimi</v-tab>
          <v-tab value="gemini">Gemini</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="mt-4">
          <!-- Kimi 设置 -->
          <v-window-item value="kimi">
            <h3 class="mb-4">Kimi 配置</h3>

            <v-alert type="info" variant="tonal" class="mb-4">
              请访问 <a href="https://kimi.moonshot.cn/" target="_blank">Kimi</a> 登录后，
              通过浏览器开发者工具获取 access_token 和 refresh_token
            </v-alert>

            <v-text-field
              v-model="kimiConfig.access_token"
              label="Access Token"
              type="password"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-text-field
              v-model="kimiConfig.refresh_token"
              label="Refresh Token"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mt-4"
            ></v-text-field>

            <v-switch
              v-model="kimiConfig.enableSearch"
              label="启用联网搜索"
              color="primary"
            ></v-switch>

            <v-btn
              color="primary"
              @click="testKimi"
              :loading="testing.kimi"
              class="mt-4"
            >
              测试连接
            </v-btn>

            <v-alert
              v-if="testResults.kimi"
              :type="testResults.kimi.success ? 'success' : 'error'"
              variant="tonal"
              class="mt-4"
            >
              {{ testResults.kimi.message }}
            </v-alert>
          </v-window-item>

          <!-- Gemini 设置 -->
          <v-window-item value="gemini">
            <h3 class="mb-4">Gemini API 配置</h3>

            <v-alert type="info" variant="tonal" class="mb-4">
              请访问
              <a href="https://aistudio.google.com/app/apikey" target="_blank">
                Google AI Studio
              </a>
              获取 API Key
            </v-alert>

            <v-text-field
              v-model="geminiConfig.apiKey"
              label="API Key"
              type="password"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-select
              v-model="geminiConfig.model"
              :items="geminiModels"
              label="模型"
              variant="outlined"
              density="comfortable"
              class="mt-4"
            ></v-select>

            <v-slider
              v-model="geminiConfig.temperature"
              label="Temperature"
              :min="0"
              :max="2"
              :step="0.1"
              thumb-label
              class="mt-4"
            ></v-slider>

            <v-text-field
              v-model.number="geminiConfig.pastRounds"
              label="历史对话轮数"
              type="number"
              variant="outlined"
              density="comfortable"
              :min="1"
              :max="20"
              class="mt-4"
            ></v-text-field>

            <v-btn
              color="primary"
              @click="testGemini"
              :loading="testing.gemini"
              class="mt-4"
            >
              测试连接
            </v-btn>

            <v-alert
              v-if="testResults.gemini"
              :type="testResults.gemini.success ? 'success' : 'error'"
              variant="tonal"
              class="mt-4"
            >
              {{ testResults.gemini.message }}
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="$emit('update:modelValue', false)">取消</v-btn>
        <v-btn color="primary" @click="saveSettings">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { getBotByClassName } from '../bots'

export default {
  name: 'SettingsDialog',

  props: {
    modelValue: Boolean
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const store = useStore()
    const tab = ref('kimi')

    const kimiConfig = reactive({
      access_token: '',
      refresh_token: '',
      enableSearch: true
    })

    const geminiConfig = reactive({
      apiKey: '',
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      pastRounds: 5
    })

    const geminiModels = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ]

    const testing = reactive({
      kimi: false,
      gemini: false
    })

    const testResults = reactive({
      kimi: null,
      gemini: null
    })

    // 加载配置
    function loadSettings() {
      Object.assign(kimiConfig, store.state.kimi)
      Object.assign(geminiConfig, store.state.geminiApi)
    }

    // 保存配置
    function saveSettings() {
      // 保存 Kimi 配置
      if (kimiConfig.access_token || kimiConfig.refresh_token) {
        store.commit('setKimi', {
          access_token: kimiConfig.access_token.trim(),
          refresh_token: kimiConfig.refresh_token.trim(),
          enableSearch: kimiConfig.enableSearch
        })
        console.log('[Settings] Kimi 配置已保存')
      }

      // 保存 Gemini 配置
      if (geminiConfig.apiKey) {
        store.commit('setGeminiApi', {
          ...geminiConfig,
          apiKey: geminiConfig.apiKey.trim()
        })
        console.log('[Settings] Gemini 配置已保存')
      }

      // 手动触发 localStorage 保存（确保持久化）
      try {
        const storeData = {
          kimi: store.state.kimi,
          geminiApi: store.state.geminiApi,
          currentChatId: store.state.currentChatId,
          selectedBots: store.state.selectedBots
        }
        localStorage.setItem('roundtable-ai-store', JSON.stringify(storeData))
        console.log('[Settings] 配置已手动持久化到 localStorage')
      } catch (error) {
        console.error('[Settings] localStorage 保存失败:', error)
      }

      emit('update:modelValue', false)
      alert('设置已保存！请重新加载页面以确保生效。')
    }

    // 测试 Kimi 连接
    async function testKimi() {
      testing.kimi = true
      testResults.kimi = null

      try {
        // 临时保存配置用于测试
        store.commit('setKimi', kimiConfig)

        const bot = getBotByClassName('KimiBot')
        const available = await bot.checkAvailability()

        testResults.kimi = {
          success: available,
          message: available ? '连接成功！' : '连接失败，请检查配置'
        }
      } catch (error) {
        testResults.kimi = {
          success: false,
          message: '连接失败：' + error.message
        }
      } finally {
        testing.kimi = false
      }
    }

    // 测试 Gemini 连接
    async function testGemini() {
      testing.gemini = true
      testResults.gemini = null

      try {
        // 临时保存配置用于测试
        store.commit('setGeminiApi', geminiConfig)

        const bot = getBotByClassName('GeminiAPIBot')
        const available = await bot.checkAvailability()

        testResults.gemini = {
          success: available,
          message: available ? '连接成功！' : '连接失败，请检查 API Key'
        }
      } catch (error) {
        testResults.gemini = {
          success: false,
          message: '连接失败：' + error.message
        }
      } finally {
        testing.gemini = false
      }
    }

    onMounted(() => {
      loadSettings()
    })

    return {
      tab,
      kimiConfig,
      geminiConfig,
      geminiModels,
      testing,
      testResults,
      saveSettings,
      testKimi,
      testGemini
    }
  }
}
</script>
