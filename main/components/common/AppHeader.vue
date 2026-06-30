<template>
  <el-header>
    <div class="top">
      <div class="top-nav">
        <NuxtLink to="/" class="logo-link">
          <img :src="logo" alt="" />
        </NuxtLink>
        <!-- 桌面端导航 -->
        <div v-for="item in menuList" :key="item.menuId" class="top-nav-title desktop-nav">
          <NuxtLink v-if="item.menuType === 'C'" :to="item.path" :class="{ active: activeUrl === item.path }">
            {{ item.menuName }}
          </NuxtLink>
          <a v-else :href="item.linkUrl" :target="item.target || '_self'">{{ item.menuName }}</a>
        </div>
      </div>
      <div v-if="route.path !== '/search'" class="top-search desktop-search">
        <el-input v-model="searchKeyword" placeholder="请输入搜索内容" @keyup.enter="handleSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="top-user desktop-user">
        <ClientOnly>
          <div v-if="userStore.isLoggedIn">
            <CommonUser />
          </div>
          <div v-else>
            <NuxtLink to="/login">登录</NuxtLink>
            <NuxtLink to="/register">注册</NuxtLink>
          </div>
          <template #fallback>
            <NuxtLink to="/login">登录</NuxtLink>
            <NuxtLink to="/register">注册</NuxtLink>
          </template>
        </ClientOnly>
      </div>
      <!-- 移动端汉堡菜单按钮 -->
      <div class="mobile-menu-btn" @click="mobileMenuVisible = !mobileMenuVisible">
        <el-icon :size="24"><Menu /></el-icon>
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <Transition name="slide-down">
      <div v-if="mobileMenuVisible" class="mobile-menu">
        <div class="mobile-search">
          <el-input v-model="searchKeyword" placeholder="搜索" @keyup.enter="handleMobileSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
        <div v-for="item in menuList" :key="item.menuId" class="mobile-menu-item">
          <NuxtLink v-if="item.menuType === 'C'" :to="item.path" @click="mobileMenuVisible = false">
            {{ item.menuName }}
          </NuxtLink>
          <a v-else :href="item.linkUrl" :target="item.target || '_self'">{{ item.menuName }}</a>
        </div>
        <div v-if="!userStore.isLoggedIn" class="mobile-auth">
          <NuxtLink to="/login" class="mobile-auth-btn" @click="mobileMenuVisible = false">登录</NuxtLink>
          <NuxtLink to="/register" class="mobile-auth-btn primary" @click="mobileMenuVisible = false">注册</NuxtLink>
        </div>
      </div>
    </Transition>
  </el-header>
</template>

<script setup lang="ts">
import { Search, Menu } from '@element-plus/icons-vue'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const logo = computed(() => appStore.logo)
const menuList = computed(() => appStore.menuList)
const activeUrl = computed(() => route.path)

const searchKeyword = ref('')
const mobileMenuVisible = ref(false)

watch(() => userStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn && userStore.userType) {
    await appStore.refreshMenuByUserType(userStore.userType)
  } else if (!loggedIn) {
    await appStore.resetToPublicMenu()
  }
}, { immediate: false })

watch(() => route.path, () => { mobileMenuVisible.value = false })

function handleSearch() {
  const kw = searchKeyword.value.trim()
  if (kw) {
    router.push({ path: '/search', query: { keyword: kw } })
  }
}

function handleMobileSearch() {
  mobileMenuVisible.value = false
  handleSearch()
}
</script>

<style scoped>
.el-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  z-index: 999;
  height: var(--header-height);
  display: flex;
  justify-content: center;
  border-bottom: 1px solid var(--border-light);
  padding: 0;
  transition: all 0.3s ease;
}

.active {
  color: var(--primary-color);
  font-weight: 600;
}

.top {
  width: 100%;
  max-width: var(--container-max-width);
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.top-nav {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo-link {
  display: flex;
  align-items: center;
  transition: opacity 0.2s ease;
}

.logo-link:hover {
  opacity: 0.85;
}

.logo-link img {
  height: 32px;
  width: auto;
}

.top-nav-title {
  margin-left: 32px;
  font-size: 14px;
  height: 100%;
  display: flex;
  align-items: center;
}

.top-nav-title a {
  color: var(--text-regular);
  text-decoration: none;
  padding: 8px 0;
  transition: color 0.2s ease;
  font-weight: 500;
}

.top-nav-title a:hover {
  color: var(--primary-color);
}

.top-nav-title a.active {
  color: var(--primary-color);
}

.top-search {
  flex: 1;
  max-width: 360px;
  margin: 0 32px;
}

.top-search :deep(.el-input) {
  height: 38px;
  line-height: 38px;
}

.top-search :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: var(--bg-light);
  box-shadow: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  padding: 0 14px;
}

.top-search :deep(.el-input__wrapper:hover) {
  background: #fff;
  border-color: var(--border-color);
}

.top-search :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.top-search :deep(.el-input__prefix) {
  color: var(--text-placeholder);
}

.top-user {
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 8px;
}

.top-user a {
  font-size: 13px;
  padding: 8px 14px;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.top-user a:first-child {
  color: var(--text-secondary);
}

.top-user a:first-child:hover {
  color: var(--text-primary);
  background: var(--bg-light);
}

.top-user a:last-child {
  background: var(--primary-color);
  color: #fff;
}

.top-user a:last-child:hover {
  background: var(--primary-dark);
}

.mobile-menu-btn {
  display: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.mobile-menu-btn:hover {
  background: var(--bg-light);
}

.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  padding: 16px;
  box-shadow: var(--shadow-lg);
  max-height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

.mobile-search {
  margin-bottom: 12px;
}

.mobile-search :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.mobile-menu-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.mobile-menu-item a {
  font-size: 15px;
  color: var(--text-primary);
  text-decoration: none;
  display: block;
  font-weight: 500;
}

.mobile-auth {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.mobile-auth-btn {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mobile-auth-btn:hover {
  background: var(--bg-light);
}

.mobile-auth-btn.primary {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.mobile-auth-btn.primary:hover {
  background: var(--primary-dark);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1024px) {
  .top-nav-title {
    margin-left: 24px;
  }

  .top-search {
    max-width: 280px;
    margin: 0 24px;
  }
}

@media (max-width: 768px) {
  .desktop-nav,
  .desktop-search,
  .desktop-user {
    display: none !important;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-menu {
    display: block;
  }

  .top {
    padding: 0 16px;
  }

  .logo-link img {
    height: 28px;
  }
}

@media (max-width: 480px) {
  .top {
    padding: 0 12px;
  }
}
</style>
