<template>
  <v-card class="bot-card" elevation="2">
    <v-card-title class="bot-header">
      <v-avatar size="32" class="mr-2">
        <v-icon>mdi-robot</v-icon>
      </v-avatar>
      <span>{{ botName }}</span>
      <v-spacer></v-spacer>
      <v-chip
        :color="isAvailable ? 'success' : 'grey'"
        size="small"
        label
      >
        {{ isAvailable ? '在线' : '离线' }}
      </v-chip>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="bot-messages-container">
      <div
        v-for="(message, index) in botMessages"
        :key="index"
        class="message-item"
      >
        <div v-if="message.role === 'user'" class="user-message">
          <div class="message-bubble user-bubble">
            {{ message.content }}
          </div>
        </div>

        <div v-else class="assistant-message">
          <div class="message-bubble assistant-bubble">
            <div v-if="message.loading" class="loading">
              <v-progress-circular indeterminate size="20"></v-progress-circular>
              <span class="ml-2">{{ message.content || '思考中...' }}</span>
            </div>
            <div v-else v-html="renderMarkdown(message.content)"></div>
          </div>
        </div>
      </div>

      <div v-if="botMessages.length === 0" class="text-center text-grey pa-4">
        暂无消息
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { getBotByClassName } from '../bots'

export default {
  name: 'BotCard',

  props: {
    botClassName: {
      type: String,
      required: true
    },
    messages: {
      type: Array,
      default: () => []
    }
  },

  setup(props) {
    const bot = getBotByClassName(props.botClassName)
    const isAvailable = ref(false)

    const botName = computed(() => {
      return bot ? bot.getFullname() : props.botClassName
    })

    // 过滤出属于这个Bot的消息
    const botMessages = computed(() => {
      return props.messages.filter(msg => {
        return msg.role === 'user' || msg.botClassName === props.botClassName
      })
    })

    // 渲染Markdown（简单实现）
    function renderMarkdown(text) {
      if (!text) return ''

      // 简单的Markdown渲染
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    }

    onMounted(async () => {
      if (bot) {
        isAvailable.value = await bot.checkAvailability()
      }
    })

    return {
      botName,
      botMessages,
      isAvailable,
      renderMarkdown
    }
  }
}
</script>

<style scoped>
.bot-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.bot-header {
  background: #f5f5f5;
}

.bot-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  margin-bottom: 16px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  background: #1976D2;
  color: white;
}

.assistant-message {
  display: flex;
  justify-content: flex-start;
}

.assistant-bubble {
  background: #f5f5f5;
  color: black;
}

.loading {
  display: flex;
  align-items: center;
}
</style>
