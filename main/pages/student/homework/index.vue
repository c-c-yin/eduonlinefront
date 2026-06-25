<template>
  <div class="my-homework-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">我的作业</h1>
        <p class="page-desc">查看教师发布的作业，在线自评，跟踪学习进度</p>
      </div>

      <el-tabs v-model="activeTab" @tab-change="fetchList" class="homework-tabs">
        <el-tab-pane label="待完成" name="pending" />
        <el-tab-pane label="已完成" name="done" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>

      <div v-loading="loading" class="homework-list">
        <el-empty v-if="!loading && list.length === 0" description="暂无作业" />

        <el-card v-for="item in list" :key="item.homeworkId" class="homework-card" shadow="hover">
          <div class="card-row" @click="goDetail(item)">
            <div class="card-main">
              <h3 class="card-title">{{ item.homeworkName }}</h3>
              <div class="card-tags">
                <el-tag :type="item.homeworkSource === 1 ? 'success' : item.homeworkSource === 3 ? 'primary' : 'warning'" size="small">
                  {{ item.homeworkSource === 1 ? '在线试卷' : item.homeworkSource === 3 ? '在线试题' : '线下习题' }}
                </el-tag>
                <el-tag size="small">{{ typeLabel(item.homeworkType) }}</el-tag>
                <el-tag size="small" type="info">{{ item.subjectName || '-' }}</el-tag>
              </div>
            </div>
            <div class="card-right">
              <div class="card-score">
                <span v-if="item.myScore != null" class="score-value">{{ item.myScore }}</span>
                <span v-else class="score-placeholder">未完成</span>
                <span class="score-total">/ {{ item.totalScore }}分</span>
              </div>
              <el-icon class="card-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="card-footer">
            <span class="footer-time">{{ item.createTime?.substring(0, 10) }}</span>
            <span v-if="item.paperName" class="footer-paper">试卷：{{ item.paperName }}</span>
            <span v-if="item.deadline" class="footer-deadline" :class="{ 'is-overdue': isOverdue(item.deadline) }">
              {{ deadlineText(item.deadline) }}
            </span>
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
import { ArrowRight } from '@element-plus/icons-vue'
import type { EduHomework } from '@/composables/useHomeworkApi'

const router = useRouter()

const activeTab = ref('pending')
const loading = ref(false)
const list = ref<EduHomework[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const HOMEWORK_TYPE_LABELS: Record<number, string> = {
  1: '练习作业', 2: '课后作业', 3: '随堂作业',
  4: '月考作业', 5: '期中作业', 6: '期末作业'
}

function typeLabel(type: number): string {
  return HOMEWORK_TYPE_LABELS[type] || '其他'
}

function isOverdue(deadline: string): boolean {
  return new Date(deadline).getTime() < Date.now()
}

function deadlineText(deadline: string): string {
  const d = new Date(deadline)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return '已逾期'
  if (days === 0) return '今天截止'
  if (days === 1) return '明天截止'
  return `截止 ${d.getMonth() + 1}月${d.getDate()}日 (剩${days}天)`
}

let homeworkApi: any = null

async function fetchList() {
  if (!homeworkApi) {
    const mod = await import('@/composables/useHomeworkApi')
    homeworkApi = mod.useHomeworkApi()
  }
  loading.value = true
  try {
    const params: any = { pageNum: currentPage.value, pageSize: pageSize.value }
    if (activeTab.value === 'pending') {
      params.scoreStatus = 'pending'
    } else if (activeTab.value === 'done') {
      params.scoreStatus = 'done'
    }
    const res = await homeworkApi.getStudentHomeworkList(params)
    list.value = res.rows
    total.value = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goDetail(item: EduHomework) {
  if (item.homeworkSource === 1 && item.paperId) {
    router.push(`/papers/${item.paperId}?homeworkId=${item.homeworkId}`)
  } else {
    router.push(`/student/homework/${item.homeworkId}`)
  }
}

onMounted(() => {
  fetchList()
})

definePageMeta({
  layout: 'default',
  middleware: ['auth']
})
</script>

<style scoped>
.my-homework-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.homework-tabs {
  margin-bottom: 20px;
}
.homework-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.homework-card {
  cursor: pointer;
  transition: transform 0.15s;
}
.homework-card:hover {
  transform: translateY(-2px);
}
.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px 0;
}
.card-tags {
  display: flex;
  gap: 6px;
}
.card-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.score-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}
.score-placeholder {
  font-size: 14px;
  color: #c0c4cc;
}
.score-total {
  font-size: 14px;
  color: #909399;
}
.card-arrow {
  color: #c0c4cc;
  font-size: 18px;
}
.card-footer {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: #c0c4cc;
}

.footer-deadline {
  margin-left: auto;
  color: #409eff;
}

.footer-deadline.is-overdue {
  color: #f56c6c;
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
