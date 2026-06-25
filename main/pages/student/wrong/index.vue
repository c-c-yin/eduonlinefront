<template>
  <div class="wrong-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">错题本</h1>
        <p class="page-desc">针对性复习，攻克薄弱环节</p>
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
          <el-form-item label="掌握状态">
            <el-select v-model="queryParams.isMastered" placeholder="全部" clearable @change="handleSearch">
              <el-option label="未掌握" :value="0" />
              <el-option label="已掌握" :value="1" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading" class="wrong-list">
        <div v-if="wrongList.length > 0" class="wrong-items">
          <div v-for="item in wrongList" :key="item.wrongId" class="wrong-item">
            <div class="wrong-header">
              <span class="question-type">{{ getQuestionTypeText(item.questionType) }}</span>
              <span class="subject-name">{{ item.subjectName }}</span>
              <span class="knowledge-name">{{ item.knowledgeName }}</span>
            </div>
            <div class="question-content" v-html="item.questionContent" />
            <div class="wrong-stats">
              <span>错误 {{ item.wrongCount }} 次</span>
              <span>正确 {{ item.correctCount }} 次</span>
              <span class="mastery-level" :class="`level-${item.masteryLevel}`">
                {{ getMasteryText(item.masteryLevel) }}
              </span>
            </div>
            <div class="wrong-footer">
              <span class="last-wrong-time">最近错误: {{ item.lastWrongTime }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无错题记录" />
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WrongQuestion, WrongQuestionQuery } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'

definePageMeta({ layout: 'default', middleware: ['auth'] })

const { getWrongQuestionList } = useQuestionApi()

const loading = ref(false)
const wrongList = ref<WrongQuestion[]>([])
const total = ref(0)

const queryParams = reactive<WrongQuestionQuery>({
  pageNum: 1,
  pageSize: 10,
  subjectId: undefined,
  isMastered: undefined
})

async function fetchWrongList() {
  loading.value = true
  try {
    const result = await getWrongQuestionList(queryParams)
    wrongList.value = result.rows
    total.value = result.total
  } catch (error) {
    wrongList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.pageNum = 1
  fetchWrongList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  fetchWrongList()
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  fetchWrongList()
}

function getQuestionTypeText(type: number): string {
  const map: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算', 7: '综合', 8: '听力' }
  return map[type] || '未知'
}

function getMasteryText(level: number): string {
  const map: Record<number, string> = { 0: '未掌握', 1: '了解', 2: '理解', 3: '掌握', 4: '精通' }
  return map[level] || '未知'
}

onMounted(() => { fetchWrongList() })

useSeoMeta({ title: '错题本 - 教育云平台' })
</script>

<style scoped>
.wrong-page { min-height: calc(100vh - var(--header-height) - var(--footer-height)); }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.page-desc { font-size: 14px; color: var(--text-secondary); margin: 0; }
.filter-section { background: var(--bg-color); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.filter-form { display: flex; flex-wrap: wrap; gap: 12px; }
.filter-form :deep(.el-form-item) { margin-bottom: 0; }
.wrong-list { min-height: 400px; }
.wrong-items { display: flex; flex-direction: column; gap: 16px; }
.wrong-item { background: var(--bg-color); border-radius: 8px; padding: 20px; border: 1px solid var(--border-color); }
.wrong-header { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.question-type { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #e6f7ff; color: #1890ff; }
.subject-name { font-size: 13px; color: var(--text-secondary); }
.knowledge-name { font-size: 13px; color: var(--text-secondary); }
.question-content { font-size: 14px; line-height: 1.8; color: var(--text-primary); margin-bottom: 12px; }
.wrong-stats { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.mastery-level { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.mastery-level.level-0 { background: #fff0f0; color: #f56c6c; }
.mastery-level.level-1 { background: #fff7e6; color: #e6a23c; }
.mastery-level.level-2 { background: #e6f7ff; color: #1890ff; }
.mastery-level.level-3 { background: #f0f9eb; color: #67c23a; }
.mastery-level.level-4 { background: #f0f9eb; color: #52c41a; }
.wrong-footer { font-size: 12px; color: var(--text-secondary); padding-top: 8px; border-top: 1px solid var(--border-color); }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }

@media (max-width: 768px) {
  .page-title { font-size: 22px; }
  .filter-form { flex-direction: column; }
  .wrong-item { padding: 16px; }
  .wrong-header { flex-wrap: wrap; }
  .wrong-stats { flex-wrap: wrap; gap: 8px; }
}
</style>
