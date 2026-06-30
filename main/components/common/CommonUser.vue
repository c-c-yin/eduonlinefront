<template>
  <client-only>
    <el-dropdown trigger="click">
      <span class="el-dropdown-link">
        <img v-if="userStore.avatar && userStore.avatar !== '/images/default-avatar.svg'" :src="userStore.avatar" alt="头像" class="header-image" />
        <img v-else src="/images/default-avatar.svg" alt="头像" class="header-image" />
        <span class="user-name">{{ userStore.realName || userStore.userName }}</span>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>
            <NuxtLink to="/profile">个人信息</NuxtLink>
          </el-dropdown-item>
          <el-dropdown-item>
            <NuxtLink :to="userStore.isTeacher ? '/teacher/homework' : '/student/homework'">我的作业</NuxtLink>
          </el-dropdown-item>
          <el-dropdown-item @click="handleLogout">安全退出</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </client-only>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const router = useRouter()

async function handleLogout() {
  try {
    const { ElMessageBox } = await import('element-plus')
    await ElMessageBox.confirm('确认退出', '退出登录', {
      confirmButtonText: '确认',
      showCancelButton: false,
      type: 'warning'
    })
    await userStore.logout()
    router.push('/login')
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.el-dropdown-link:hover {
  background: var(--bg-light);
  border-color: var(--border-color);
}

.header-image {
  border-radius: 50%;
  height: 34px;
  width: 34px;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px var(--border-color);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-regular);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
