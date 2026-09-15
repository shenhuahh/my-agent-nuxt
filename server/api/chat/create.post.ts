// server/api/chat/create.post.ts
import { db } from '../../database'
import { chats } from '../../database/schema'

export default defineEventHandler(async () => {
  try {
    // 插入一条新对话记录，Drizzle 会返回一个数组，我们取第一个
    const result = await db.insert(chats).values({}).returning()
    
    // 类型断言，确保 TypeScript 知道返回的是 Chat 类型
    const newChat = result[0] as typeof chats.$inferSelect

    if (!newChat) {
      throw createError({ statusCode: 500, statusMessage: '创建对话失败' })
    }

    return { chatId: newChat.id }
  } catch (error) {
    console.error('创建对话失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '创建对话失败，请检查 DATABASE_URL 和数据库表结构',
      cause: error,
    })
  }
})
