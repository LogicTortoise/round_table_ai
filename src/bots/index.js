import KimiBot from './KimiBot'
import GeminiAPIBot from './GeminiAPIBot'

// 所有可用的 Bot 类
export const BOT_CLASSES = {
  KimiBot,
  GeminiAPIBot
}

// 获取所有 Bot 实例
export function getAllBots() {
  return Object.values(BOT_CLASSES).map(BotClass => BotClass.getInstance())
}

// 根据类名获取 Bot 实例
export function getBotByClassName(className) {
  const BotClass = BOT_CLASSES[className]
  return BotClass ? BotClass.getInstance() : null
}

// 检查所有 Bot 的可用性
export async function checkAllBotsAvailability() {
  const bots = getAllBots()
  const results = await Promise.all(
    bots.map(async bot => {
      const available = await bot.checkAvailability()
      return {
        className: bot.getClassname(),
        name: bot.getFullname(),
        available
      }
    })
  )
  return results
}

export default {
  BOT_CLASSES,
  getAllBots,
  getBotByClassName,
  checkAllBotsAvailability
}
