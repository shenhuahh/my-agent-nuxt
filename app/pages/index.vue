<!-- app/pages/index.vue -->
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ref, onMounted } from 'vue'
const chatId = ref<string | null>(null)
const input = ref('')
const isLoadingHistory = ref(true)

// ✅ transport 中通过 body 传递 chatId（v7 支持函数形式动态取值）
const { messages, sendMessage, status } = useChat(() => ({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({ chatId: chatId.value }),
  }),
}))

onMounted(async () => {
  const route = useRoute()
  let id = route.query.chat as string | undefined

  const createChat = async () => {
    const data = await $fetch<{ chatId: string }>('/api/chat/create', {
      method: 'POST',
    })
    await navigateTo({ query: { chat: data.chatId } }, { replace: true })
    return data.chatId
  }

  if (!id) {
    id = await createChat()
  }

  try {
    let historyData = await $fetch<{ exists: boolean; messages: UIMessage[] }>(
      `/api/chat/history?chatId=${id}`
    )

    if (!historyData.exists) {
      id = await createChat()
      historyData = { exists: true, messages: [] }
    }

    chatId.value = id
    if (historyData.messages?.length) {
      messages.value = historyData.messages
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  } finally {
    isLoadingHistory.value = false
  }
})

const handleSubmit = (e: Event) => {
  e.preventDefault()
  if (!input.value.trim() || !chatId.value || isLoadingHistory.value || status.value !== 'ready') return

  // ✅ v7 中 sendMessage 的 body 已在 transport 中处理，此处只需传 text
  sendMessage({ text: input.value })
  input.value = ''
}

const getMessageText = (message: UIMessage): string => {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
}
</script>

<template>
  <div class="flex flex-col w-full max-w-md py-24 mx-auto stretch">
    <div v-if="isLoadingHistory" class="text-center text-gray-500">
      加载对话历史...
    </div>

    <div v-else class="space-y-4">
      <!-- 渲染消息列表 -->
      <div v-for="m in messages" :key="m.id" class="whitespace-pre-wrap">
        <strong>{{ m.role === 'user' ? '用户: ' : 'AI: ' }}</strong>
        <span>{{ getMessageText(m) }}</span>
      </div>
    </div>

    <!-- 输入表单 -->
    <form @submit="handleSubmit" class="fixed bottom-0 w-full max-w-md mb-8">
      <input
        v-model="input"
        class="w-full p-2 border border-gray-300 rounded shadow-xl"
        placeholder="输入你的问题..."
        :disabled="isLoadingHistory || !chatId || status !== 'ready'"
      />
      <button
        type="submit"
        class="mt-2 p-2 bg-blue-500 text-white rounded disabled:opacity-50"
        :disabled="!input.trim() || isLoadingHistory || !chatId || status !== 'ready'"
      >
        {{ status === 'ready' ? '发送' : '思考中...' }}
      </button>
    </form>
  </div>
</template>
