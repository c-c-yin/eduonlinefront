<template>
  <div class="quick-nav">
    <div
      v-for="item in navItems"
      :key="item.path"
      class="nav-item"
      @click="navigateTo(item.path)"
    >
      <div class="nav-icon" :style="{ background: item.bgColor }">
        <el-icon :size="24"><component :is="item.icon" /></el-icon>
      </div>
      <span class="nav-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, VideoPlay, Document, Notebook, Star, Warning } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const studentNavItems = [
  { label: '试题练习', icon: Edit, path: '/questions', bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: '视频课程', icon: VideoPlay, path: '/videos', bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: '试卷中心', icon: Document, path: '/papers', bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { label: '我的作业', icon: Notebook, path: '/student/homework', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { label: '学习中心', icon: Star, path: '/student/dashboard', bgColor: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { label: '错题本', icon: Warning, path: '/student/wrong', bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }
]

const teacherNavItems = [
  { label: '我的试题', icon: Edit, path: '/teacher/questions', bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: '视频课程', icon: VideoPlay, path: '/videos', bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: '我的试卷', icon: Document, path: '/teacher/papers', bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { label: '作业管理', icon: Notebook, path: '/teacher/homework', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { label: '工作台', icon: Star, path: '/teacher/dashboard', bgColor: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { label: '成绩管理', icon: Warning, path: '/teacher/scores', bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }
]

const navItems = computed(() => {
  return userStore.isTeacher ? teacherNavItems : studentNavItems
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.quick-nav {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.nav-item:hover {
  transform: translateY(-4px);
}

.nav-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-label {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

@media (max-width: 900px) {
  .quick-nav {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .quick-nav {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .nav-icon {
    width: 48px;
    height: 48px;
  }
}
</style>
