<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <NuxtLink to="/" class="logo-link">
          <img v-if="isLoaded" :src="logo" :alt="title" class="logo" />
          <span v-if="isLoaded" class="title">{{ title }}</span>
          <template v-else>
            <img src="/images/logo.svg" alt="教育云平台" class="logo" />
            <span class="title">教育云平台</span>
          </template>
        </NuxtLink>
      </div>
      <div class="auth-content">
        <slot />
      </div>
      <div class="auth-footer">
        <p>{{ isLoaded ? copyright : '' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore()

const logo = computed(() => appStore.logo)
const title = computed(() => appStore.title)
const copyright = computed(() => appStore.copyright)
const isLoaded = computed(() => appStore.siteConfig !== null)
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo {
  height: 48px;
  width: auto;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.auth-content {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
}

.auth-footer p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}
</style>
