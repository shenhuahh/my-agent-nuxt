// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    // 服务端私有变量（不会暴露给客户端）
    databaseUrl: process.env.DATABASE_URL,
    zhipuApiKey: process.env.ZHIPU_API_KEY,
  },
})
