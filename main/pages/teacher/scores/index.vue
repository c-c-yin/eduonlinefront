<template>
  <div class="score-list-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">成绩管理</h1>
        <p class="page-desc">查看和录入学生成绩，自动关联知识点掌握度</p>
        <el-button type="primary" plain @click="navigateTo('/teacher/scores/summary')" style="margin-top: 12px">
          <el-icon><TrendCharts /></el-icon> 学期加权汇总
        </el-button>
      </div>

      <div class="toolbar">
        <el-input
          v-model="searchName"
          placeholder="搜索作业名称"
          clearable
          style="width: 200px"
          @keyup.enter="fetchList"
        />
        <el-select v-model="classFilter" placeholder="全部班级" clearable style="width: 160px" @change="fetchList">
          <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable style="width: 140px" @change="fetchList">
          <el-option label="练习作业" :value="1" />
          <el-option label="课后作业" :value="2" />
          <el-option label="随堂作业" :value="3" />
          <el-option label="月考" :value="4" />
          <el-option label="期中" :value="5" />
          <el-option label="期末" :value="6" />
        </el-select>
      </div>

      <div v-loading="loading" class="score-list">
        <el-empty v-if="!loading && list.length === 0" description="暂无成绩记录" />

        <el-card v-for="item in list" :key="item.homeworkId" class="score-card" shadow="hover">
          <div class="card-content">
            <div class="card-main" @click="goDetail(item.homeworkId)">
              <h3 class="card-title">{{ item.homeworkName }}</h3>
              <div class="card-tags">
                <el-tag size="small" type="info">{{ item.subjectName }}</el-tag>
                <el-tag size="small">{{ typeLabel(item.homeworkType) }}</el-tag>
                <el-tag size="small" :type="item.homeworkSource === 1 ? 'success' : 'primary'">
                  {{ item.homeworkSource === 1 ? '试卷' : item.homeworkSource === 3 ? '在线试题' : '线下习题' }}
                </el-tag>
              </div>
              <div class="card-meta">
                <span>{{ item.className }}</span>
                <span>{{ item.createTime?.substring(0, 10) }}</span>
              </div>
            </div>
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-value">{{ item.avgScore ?? '-' }}</span>
                <span class="stat-label">平均分</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ item.scoredCount }}/{{ item.studentCount }}</span>
                <span class="stat-label">已录入</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ item.totalScore }}</span>
                <span class="stat-label">满分</span>
              </div>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="goDetail(item.homeworkId)">
                {{ item.scoredCount > 0 ? '查看/编辑成绩' : '录入成绩' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScoreApi, type ScoreRecord } from '@/composables/useScoreApi'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const { getScoreList, getTeacherClasses } = useScoreApi()

const loading = ref(false)
const list = ref<ScoreRecord[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchName = ref('')
const classFilter = ref<number | null>(null)
const typeFilter = ref<number | null>(null)
const classes = ref<{ classId: number; className: string }[]>([])

const HOMEWORK_TYPE_LABELS: Record<number, string> = {
  1: '练习作业', 2: '课后作业', 3: '随堂作业',
  4: '月考', 5: '期中', 6: '期末'
}

function typeLabel(type: number): string {
  return HOMEWORK_TYPE_LABELS[type] || '其他'
}

async function fetchClasses() {
  try {
    classes.value = await getTeacherClasses()
  } catch {
    classes.value = []
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchName.value) params.homeworkName = searchName.value
    if (classFilter.value) params.classId = classFilter.value
    if (typeFilter.value) params.homeworkType = typeFilter.value
    const res = await getScoreList(params)
    list.value = res.rows
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function goDetail(homeworkId: number) {
  router.push(`/teacher/scores/${homeworkId}`)
}

onMounted(() => {
  Promise.all([fetchClasses(), fetchList()])
})

useSeoMeta({
  title: '成绩管理 - 教育云平台'
})
</script>

<style scoped>
.score-list-page {
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
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-card {
  cursor: default;
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.card-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.card-title:hover {
  color: #409eff;
}

.card-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.card-stats {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.card-actions {
  flex-shrink: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-stats {
    gap: 16px;
  }

  .toolbar {
    flex-wrap: wrap;
  }
}
</style>