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
  gap: 6px;
}

.header-image {
  border-radius: 50%;
  height: 35px;
  width: 35px;
  object-fit: cover;
}

.user-name {
  font-size: 14px;
  color: #333;
}
</style>
