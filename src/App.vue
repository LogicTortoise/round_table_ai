<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-icon class="mr-2">mdi-forum</v-icon>
      <v-toolbar-title>RoundTable AI</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="showSettings = true">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer app permanent width="280">
      <v-list>
        <v-list-item>
          <v-btn block color="primary" prepend-icon="mdi-plus" @click="createNewChat">
            新建会话
          </v-btn>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-subheader>会话历史</v-list-subheader>
        <v-list-item
          v-for="chat in chats"
          :key="chat.id"
          :active="currentChatId === chat.id"
          @click="selectChat(chat.id)"
        >
          <v-list-item-title>{{ chat.title }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ formatDate(chat.updatedAt) }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-btn icon size="small" @click.stop="deleteChat(chat.id)">
              <v-icon size="small">mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <chat-view v-if="currentChatId" />
      <v-container v-else class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" class="text-center">
            <v-icon size="100" color="grey-lighten-2">mdi-forum-outline</v-icon>
            <h2 class="text-h4 mt-4 text-grey">开始新对话</h2>
            <p class="text-grey">点击左侧"新建会话"按钮开始</p>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- 设置对话框 -->
    <settings-dialog v-model="showSettings" />
  </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { Chats } from './store/database'
import ChatView from './components/ChatView.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { checkAllBotsAvailability } from './bots'

export default {
  name: 'App',

  components: {
    ChatView,
    SettingsDialog
  },

  setup() {
    const store = useStore()
    const chats = ref([])
    const showSettings = ref(false)

    const currentChatId = computed(() => store.state.currentChatId)

    // 加载所有会话
    async function loadChats() {
      chats.value = await Chats.getAll()
    }

    // 创建新会话
    async function createNewChat() {
      const chat = await Chats.create('新对话')
      chats.value.unshift(chat)
      store.commit('setCurrentChatId', chat.id)
    }

    // 选择会话
    function selectChat(chatId) {
      store.commit('setCurrentChatId', chatId)
    }

    // 删除会话
    async function deleteChat(chatId) {
      if (confirm('确定要删除这个会话吗？')) {
        await Chats.delete(chatId)
        await loadChats()

        if (currentChatId.value === chatId) {
          store.commit('setCurrentChatId', null)
        }
      }
    }

    // 格式化日期
    function formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const now = new Date()
      const diff = now - d

      // 小于1分钟
      if (diff < 60000) return '刚刚'
      // 小于1小时
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      // 小于1天
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      // 其他
      return d.toLocaleDateString('zh-CN')
    }

    onMounted(async () => {
      await loadChats()

      // 检查所有Bot的可用性
      const results = await checkAllBotsAvailability()
      console.log('Bot availability:', results)

      // 如果没有会话，创建一个
      if (chats.value.length === 0) {
        await createNewChat()
      } else {
        // 选择最近的会话
        store.commit('setCurrentChatId', chats.value[0].id)
      }
    })

    return {
      chats,
      currentChatId,
      showSettings,
      createNewChat,
      selectChat,
      deleteChat,
      formatDate
    }
  }
}
</script>

<style>
html, body {
  overflow: hidden;
}
</style>
