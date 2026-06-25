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

// 监听登录状态变化，刷新菜单
watch(() => userStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn && userStore.userType) {
    await appStore.refreshMenuByUserType(userStore.userType)
  } else if (!loggedIn) {
    await appStore.resetToPublicMenu()
  }
}, { immediate: false })

// 路由变化时关闭移动菜单
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
  background: #fff;
  z-index: 999;
  height: 70px;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #ebeef5;
  padding: 0;
}

.active {
  color: #46c37b;
}

.top {
  width: 100%;
  max-width: 1200px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.top-nav {
  display: flex;
  align-items: center;
}

.logo-link img {
  height: 35px;
  width: auto;
}

.top-nav-title {
  margin-left: 30px;
  font-size: 16px;
}

.top-nav-title a {
  color: #333;
  text-decoration: none;
}

.top-nav-title a:hover {
  color: #46c37b;
}

.top-nav-title a.active {
  color: #46c37b;
}

.top-search {
  flex: 1;
  max-width: 300px;
  margin: 0 30px;
}

.top-search :deep(.el-input) {
  height: 35px;
  line-height: 35px;
}

.top-search :deep(.el-input__wrapper) {
  border-radius: 4px;
}

.top-user {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.top-user a {
  font-size: 14px;
  margin-left: 12px;
  text-decoration: none;
}

.top-user a:hover {
  color: #46c37b;
}

.top-user img {
  border-radius: 50%;
}

/* 移动端按钮 */
.mobile-menu-btn {
  display: none;
  cursor: pointer;
  color: #333;
  padding: 8px;
}

/* 移动端下拉菜单 */
.mobile-menu {
  display: none;
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.mobile-search {
  margin-bottom: 12px;
}

.mobile-menu-item {
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.mobile-menu-item a {
  font-size: 16px;
  color: #333;
  text-decoration: none;
  display: block;
}

.mobile-auth {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.mobile-auth-btn {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  color: #333;
  text-decoration: none;
  font-size: 14px;
}

.mobile-auth-btn.primary {
  background: #46c37b;
  color: #fff;
  border-color: #46c37b;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .desktop-nav,
  .desktop-search,
  .desktop-user {
    display: none !important;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-menu {
    display: block;
  }

  .top {
    padding: 0 16px;
  }
}
</style>
