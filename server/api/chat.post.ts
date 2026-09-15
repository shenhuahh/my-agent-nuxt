// server/api/chat.post.ts
import { streamText, convertToModelMessages, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { db } from '../database'
import { chats, messages as messagesTable } from '../database/schema'
import { eq } from 'drizzle-orm'

const zhipu = createOpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
})

export default defineEventHandler(async (event) => {
  const { messages, chatId } = await readBody(event)
 // console.log('messages',messages)
    console.log('chatId',chatId)


  // 保存用户消息
  const [chat] = chatId
    ? await db.select({ id: chats.id }).from(chats).where(eq(chats.id, chatId)).limit(1)
    : []

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: '对话不存在，请重新创建' })
  }

  const lastUserMessage = messages[messages.length - 1]
  if (lastUserMessage?.role === 'user') {
    await db.insert(messagesTable).values({
      chatId,
      role: 'user',
      content: lastUserMessage.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join(''),
    })
  }

  const result = streamText({
    model: zhipu.chat('glm-4-flash'),
    
    messages: await convertToModelMessages(messages),
    // v7 中 onFinish 已改名为 onEnd
    onEnd: async ({ text }) => {
      if (chatId) {
        await db.insert(messagesTable).values({
          chatId,
          role: 'assistant',
          content: text,
        })
      }
    },
  })

  // ✅ v7 正确写法：先转 UI 流，再封装为 HTTP 响应
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
})
