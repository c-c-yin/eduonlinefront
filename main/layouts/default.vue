<template>
  <div class="default-layout">
    <template v-if="appStore.isMaintenanceMode">
      <div class="maintenance-page">
        <div class="maintenance-content">
          <div class="maintenance-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <h1 class="maintenance-title">{{ appStore.siteConfig?.maintenanceTitle || '系统维护中' }}</h1>
          <p class="maintenance-desc">{{ appStore.siteConfig?.maintenanceContent || '系统正在维护升级，请稍后再访问。给您带来不便，敬请谅解！' }}</p>
        </div>
      </div>
    </template>
    <template v-else>
      <AppHeader />
      <el-main>
        <slot />
      </el-main>
      <AppFooter />
    </template>
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()

onMounted(() => {
  if (appStore.menuList.length === 0) {
    const userType = userStore.isLoggedIn ? userStore.userType : 'all'
    appStore.initApp(userType)
  }
})

watch(() => route.path, () => {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.el-main {
  flex: 1;
  margin-top: 70px;
  overflow: auto;
  padding: 0;
}

.maintenance-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.maintenance-content {
  text-align: center;
  color: #fff;
  padding: 40px;
}

.maintenance-icon {
  margin-bottom: 24px;
  opacity: 0.9;
}

.maintenance-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 16px;
}

.maintenance-desc {
  font-size: 16px;
  opacity: 0.85;
  line-height: 1.6;
  max-width: 500px;
}
</style>
