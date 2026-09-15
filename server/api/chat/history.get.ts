import { db } from '../../database'
import { chats, messages } from '../../database/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const chatId = query.chatId as string
  if (!chatId) return { exists: false, messages: [] }

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1)

  if (!chat) return { exists: false, messages: [] }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt))

  const uiMessages = rows.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  }))

  return { exists: true, messages: uiMessages }
})
