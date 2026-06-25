import { useAppStore } from '@/stores/app'

export default defineNuxtPlugin(() => {
  const appStore = useAppStore()

  if (import.meta.server) return

  // 客户端水合：若 siteConfig 为空，后台静默拉取，不阻塞应用挂载
  if (!appStore.siteConfig) {
    appStore.initApp().catch((e) => {
      console.warn('[AppStore] 初始化失败，使用默认配置:', (e as Error).message)
    })
  }
})