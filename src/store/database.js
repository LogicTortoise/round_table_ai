import Dexie from 'dexie'

// IndexedDB 数据库配置
export const db = new Dexie('RoundTableAI')

db.version(1).stores({
  chats: '++id, title, createdAt, updatedAt, contexts',
  messages: '++id, chatId, role, content, botClassName, createdAt'
})

// Chat 表操作
export const Chats = {
  async create(title = '新对话') {
    const id = await db.chats.add({
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      contexts: {} // { botClassName: context }
    })
    return await db.chats.get(id)
  },

  async get(id) {
    return await db.chats.get(id)
  },

  async getAll() {
    return await db.chats.orderBy('updatedAt').reverse().toArray()
  },

  async update(id, data) {
    await db.chats.update(id, {
      ...data,
      updatedAt: new Date()
    })
    return await db.chats.get(id)
  },

  async delete(id) {
    await db.chats.delete(id)
    await db.messages.where('chatId').equals(id).delete()
  },

  async setContext(id, botClassName, context) {
    const chat = await db.chats.get(id)
    if (!chat) return

    const contexts = chat.contexts || {}
    contexts[botClassName] = context

    await db.chats.update(id, {
      contexts,
      updatedAt: new Date()
    })
  },

  async getContext(id, botClassName) {
    const chat = await db.chats.get(id)
    return chat?.contexts?.[botClassName]
  }
}

// Messages 表操作
export const Messages = {
  async create(chatId, role, content) {
    const id = await db.messages.add({
      chatId,
      role, // 'user' or 'assistant'
      content,
      botClassName: null, // 如果是助手消息，存储Bot类名
      createdAt: new Date()
    })
    return await db.messages.get(id)
  },

  async getByChatId(chatId) {
    return await db.messages
      .where('chatId')
      .equals(chatId)
      .sortBy('createdAt')
  },

  async update(id, data) {
    await db.messages.update(id, data)
    return await db.messages.get(id)
  },

  async delete(id) {
    await db.messages.delete(id)
  }
}

export default db
