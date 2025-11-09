<template>
  <v-container fluid class="chat-view pa-0">
    <v-row no-gutters class="fill-height">
      <!-- 中间主区域：对话卡片 -->
      <v-col class="chat-cards-container">
        <v-row no-gutters class="pa-4">
          <v-col
            v-for="botClassName in selectedBots"
            :key="botClassName"
            cols="12"
            md="6"
            lg="4"
            class="pa-2"
          >
            <bot-card :bot-class-name="botClassName" :messages="messages" />
          </v-col>
        </v-row>
      </v-col>

      <!-- 右侧面板：活跃Agent -->
      <v-col cols="3" class="bot-selector-panel">
        <v-card class="fill-height" elevation="0">
          <v-card-title>活跃 Agent ({{ selectedBots.length }})</v-card-title>
          <v-divider></v-divider>

          <v-list>
            <v-list-item
              v-for="botClassName in selectedBots"
              :key="botClassName"
            >
              <template v-slot:prepend>
                <v-avatar size="32">
                  <v-icon>mdi-robot</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ getBotName(botClassName) }}</v-list-item-title>
              <template v-slot:append>
                <v-btn
                  icon
                  size="small"
                  @click="removeBot(botClassName)"
                >
                  <v-icon size="small">mdi-close</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-card-actions>
            <v-btn block variant="outlined" @click="showBotSelector = true">
              <v-icon class="mr-1">mdi-plus</v-icon>
              添加 Agent
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 底部输入框 -->
    <v-footer app class="chat-input-footer">
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-textarea
              v-model="inputText"
              placeholder="输入您的消息，将同时发送给所有选中的 Agent..."
              rows="3"
              auto-grow
              variant="outlined"
              hide-details
              @keydown.enter.ctrl="sendMessage"
            >
              <template v-slot:append-inner>
                <v-btn
                  icon
                  color="primary"
                  :disabled="!inputText.trim() || sending"
                  @click="sendMessage"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </template>
            </v-textarea>
            <div class="text-caption text-grey mt-1">
              按 Ctrl + Enter 发送
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>

    <!-- Bot选择对话框 -->
    <v-dialog v-model="showBotSelector" max-width="500">
      <v-card>
        <v-card-title>选择 Agent</v-card-title>
        <v-divider></v-divider>
        <v-list>
          <v-list-item
            v-for="bot in availableBots"
            :key="bot.className"
            @click="addBot(bot.className)"
          >
            <template v-slot:prepend>
              <v-avatar size="40">
                <v-icon>mdi-robot</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title>{{ bot.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ bot.available ? '可用' : '未配置' }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showBotSelector = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { Messages } from '../store/database'
import { getAllBots, getBotByClassName } from '../bots'
import BotCard from './BotCard.vue'

export default {
  name: 'ChatView',

  components: {
    BotCard
  },

  setup() {
    const store = useStore()
    const inputText = ref('')
    const sending = ref(false)
    const messages = ref([])
    const showBotSelector = ref(false)
    const availableBots = ref([])

    const currentChatId = computed(() => store.state.currentChatId)
    const selectedBots = computed(() => store.state.selectedBots)

    // 加载消息
    async function loadMessages() {
      if (!currentChatId.value) return
      messages.value = await Messages.getByChatId(currentChatId.value)
    }

    // 发送消息
    async function sendMessage() {
      if (!inputText.value.trim() || sending.value) return

      const prompt = inputText.value.trim()
      inputText.value = ''
      sending.value = true

      try {
        // 保存用户消息
        await Messages.create(currentChatId.value, 'user', prompt)
        await loadMessages()

        // 向所有选中的Bot发送消息
        const promises = selectedBots.value.map(async (botClassName) => {
          const bot = getBotByClassName(botClassName)
          if (!bot || !bot.isAvailable()) return

          // 创建助手消息占位符
          const assistantMessage = await Messages.create(
            currentChatId.value,
            'assistant',
            ''
          )
          assistantMessage.botClassName = botClassName

          // 发送提示并更新响应
          await bot.sendPrompt(
            prompt,
            async (msgId, { content, done }) => {
              // 更新消息内容
              await Messages.update(msgId, { content })
              await loadMessages()
            },
            assistantMessage.id
          )
        })

        await Promise.all(promises)
      } catch (error) {
        console.error('Send message error:', error)
        alert('发送消息失败：' + error.message)
      } finally {
        sending.value = false
      }
    }

    // 获取Bot名称
    function getBotName(className) {
      const bot = getBotByClassName(className)
      return bot ? bot.getFullname() : className
    }

    // 添加Bot
    function addBot(className) {
      if (!selectedBots.value.includes(className)) {
        store.commit('addBot', className)
      }
      showBotSelector.value = false
    }

    // 移除Bot
    function removeBot(className) {
      store.commit('removeBot', className)
    }

    // 加载可用的Bot列表
    async function loadAvailableBots() {
      const bots = getAllBots()
      const results = await Promise.all(
        bots.map(async (bot) => ({
          className: bot.getClassname(),
          name: bot.getFullname(),
          available: await bot.checkAvailability()
        }))
      )
      availableBots.value = results
    }

    onMounted(async () => {
      await loadMessages()
      await loadAvailableBots()
    })

    return {
      inputText,
      sending,
      messages,
      selectedBots,
      showBotSelector,
      availableBots,
      sendMessage,
      getBotName,
      addBot,
      removeBot
    }
  }
}
</script>

<style scoped>
.chat-view {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}

.chat-cards-container {
  flex: 1;
  overflow-y: auto;
}

.bot-selector-panel {
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
}

.chat-input-footer {
  border-top: 1px solid #e0e0e0;
  background: white;
}
</style>
