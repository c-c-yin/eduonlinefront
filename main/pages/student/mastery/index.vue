<template>
  <div class="mastery-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">知识点掌握度</h1>
        <p class="page-desc">了解自己的学习情况，有针对性地提升</p>
      </div>

      <div class="filter-section">
        <el-form :model="queryParams" inline class="filter-form">
          <el-form-item label="学科">
            <el-select v-model="queryParams.subjectId" placeholder="全部学科" clearable @change="handleSearch">
              <el-option label="语文" :value="1" />
              <el-option label="数学" :value="2" />
              <el-option label="英语" :value="3" />
              <el-option label="物理" :value="4" />
              <el-option label="化学" :value="5" />
              <el-option label="生物" :value="6" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading" class="mastery-list">
        <div v-if="masteryList.length > 0" class="mastery-items">
          <div v-for="item in masteryList" :key="item.masteryId" class="mastery-item">
            <div class="mastery-header">
              <span class="knowledge-name">{{ item.knowledgeName }}</span>
              <span class="subject-name">{{ item.subjectName }}</span>
            </div>
            <div class="mastery-progress">
              <el-progress :percentage="item.correctRate" :color="getProgressColor(item.correctRate)" :stroke-width="14" :text-inside="true" />
            </div>
            <div class="mastery-stats">
              <span>答题 {{ item.totalQuestion }} 题</span>
              <span>正确 {{ item.correctCount }} 题</span>
              <span>错误 {{ item.wrongCount }} 题</span>
              <span class="mastery-level" :class="`level-${item.masteryLevel}`">
                {{ getMasteryText(item.masteryLevel) }}
              </span>
            </div>
            <div class="mastery-footer">
              <span>最近练习: {{ item.lastPracticeTime }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无学习数据" />
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" layout="total, prev, pager, next" @current-change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KnowledgeMastery } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'

definePageMeta({ layout: 'default', middleware: ['auth'] })

const { getMasteryList } = useQuestionApi()

const loading = ref(false)
const masteryList = ref<KnowledgeMastery[]>([])
const total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, subjectId: undefined as number | undefined })

async function fetchMasteryList() {
  loading.value = true
  try {
    const result = await getMasteryList(queryParams)
    masteryList.value = result.rows
    total.value = result.total
  } catch (error) {
    masteryList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.pageNum = 1
  fetchMasteryList()
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  fetchMasteryList()
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 70) return '#409eff'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

function getMasteryText(level: number): string {
  const map: Record<number, string> = { 0: '未掌握', 1: '了解', 2: '理解', 3: '掌握', 4: '精通' }
  return map[level] || '未知'
}

onMounted(() => { fetchMasteryList() })
useSeoMeta({ title: '知识点掌握度 - 教育云平台' })
</script>

<style scoped>
.mastery-page { min-height: calc(100vh - var(--header-height) - var(--footer-height)); }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.page-desc { font-size: 14px; color: var(--text-secondary); margin: 0; }
.filter-section { background: var(--bg-color); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.filter-form { display: flex; flex-wrap: wrap; gap: 12px; }
.filter-form :deep(.el-form-item) { margin-bottom: 0; }
.mastery-list { min-height: 400px; }
.mastery-items { display: flex; flex-direction: column; gap: 16px; }
.mastery-item { background: var(--bg-color); border-radius: 8px; padding: 20px; border: 1px solid var(--border-color); }
.mastery-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.knowledge-name { font-size: 16px; font-weight: 500; color: var(--text-primary); }
.subject-name { font-size: 13px; color: var(--text-secondary); }
.mastery-progress { margin-bottom: 12px; }
.mastery-stats { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.mastery-level { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.mastery-level.level-0 { background: #fff0f0; color: #f56c6c; }
.mastery-level.level-1 { background: #fff7e6; color: #e6a23c; }
.mastery-level.level-2 { background: #e6f7ff; color: #1890ff; }
.mastery-level.level-3 { background: #f0f9eb; color: #67c23a; }
.mastery-level.level-4 { background: #f0f9eb; color: #52c41a; }
.mastery-footer { font-size: 12px; color: var(--text-secondary); padding-top: 8px; border-top: 1px solid var(--border-color); }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }

@media (max-width: 768px) {
  .page-title { font-size: 22px; }
  .filter-form { flex-direction: column; }
  .mastery-item { padding: 16px; }
  .mastery-stats { flex-wrap: wrap; gap: 8px; }
}
</style>
