<template>
  <div class="profile-detail-page">
    <div class="container">
      <div class="page-header">
        <el-button text @click="router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
        <h1 class="page-title">{{ profile?.studentName }} 的画像</h1>
      </div>

      <div v-if="profile" class="profile-content">
        <!-- Basic info -->
        <div class="info-bar">
          <span>学号：{{ profile.studentNo }}</span>
          <span>班级：{{ profile.className }}</span>
          <span v-if="profile.profile">综合评分：<strong>{{ profile.profile.overallScore }}</strong></span>
        </div>

        <!-- Labels -->
        <div class="panel" v-if="profile.profile?.labels?.length">
          <h3 class="panel-title">能力标签</h3>
          <div class="label-list">
            <el-tag v-for="label in profile.profile.labels" :key="label" size="large">{{ label }}</el-tag>
          </div>
        </div>

        <!-- Dimension scores -->
        <div class="panel" v-if="profile.profile?.dimensions?.length">
          <h3 class="panel-title">能力维度</h3>
          <div class="dimension-list">
            <div v-for="d in profile.profile.dimensions" :key="d.name" class="dimension-item">
              <span class="dim-name">{{ d.name }}</span>
              <el-progress :percentage="d.score" :stroke-width="10" :color="getProgressColor(d.score / 100)" />
            </div>
          </div>
        </div>

        <!-- Knowledge mastery -->
        <div class="panel" v-if="profile.knowledgeList?.length">
          <h3 class="panel-title">知识点掌握度</h3>
          <div class="knowledge-grid">
            <div v-for="k in profile.knowledgeList" :key="k.knowledgeId" class="knowledge-item">
              <span class="know-name">{{ k.knowledgeName }}</span>
              <el-progress :percentage="k.masteryRate" :stroke-width="8" :color="getProgressColor(k.masteryRate / 100)" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <el-empty description="暂无画像数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useProfileApi, type StudentProfileDetail } from '@/composables/useProfileApi'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const route = useRoute()
const router = useRouter()
const { getStudentProfile } = useProfileApi()

const studentId = computed(() => Number(route.params.id))
const profile = ref<StudentProfileDetail | null>(null)
const loading = ref(false)

function getProgressColor(rate: number): string {
  if (rate >= 0.8) return '#43e97b'
  if (rate >= 0.6) return '#4facfe'
  if (rate >= 0.4) return '#e6a23c'
  return '#f56c6c'
}

async function fetchProfile() {
  loading.value = true
  try {
    profile.value = await getStudentProfile(studentId.value)
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

useSeoMeta({
  title: '学生画像详情 - 教育云平台'
})
</script>

<style scoped>
.profile-detail-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 8px 0 4px;
}

.profile-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
}

.info-bar strong {
  color: #303133;
  font-size: 16px;
}

.panel {
  margin-bottom: 24px;
}

.panel:last-child {
  margin-bottom: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.label-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dim-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.knowledge-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.know-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.empty-state {
  padding: 80px 0;
}

@media (max-width: 768px) {
  .container {
    padding: 16px 12px 0;
  }

  .profile-content {
    padding: 16px;
  }

  .info-bar {
    flex-wrap: wrap;
    gap: 12px;
  }

  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}
</style>