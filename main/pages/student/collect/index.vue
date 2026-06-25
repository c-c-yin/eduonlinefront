<template>
  <div class="collect-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">我的收藏</h1>
        <p class="page-desc">收藏好题，随时回顾</p>
      </div>
      <div v-loading="loading" class="collect-list">
        <div v-if="collectList.length > 0" class="collect-items">
          <div v-for="item in collectList" :key="item.collectId" class="collect-item">
            <div class="collect-header">
              <span class="question-type">{{ getQuestionTypeText(item.questionType) }}</span>
              <span class="subject-name">{{ item.subjectName }}</span>
              <el-button type="danger" link size="small" @click="handleRemoveCollect(item)">取消收藏</el-button>
            </div>
            <div class="question-content" v-html="item.questionContent" />
            <div class="collect-footer">
              <span class="collect-time">收藏于 {{ item.createTime }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无收藏试题" />
      </div>
      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" layout="total, prev, pager, next" @current-change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuestionCollect } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'

definePageMeta({ layout: 'default', middleware: ['auth'] })

const { getCollectList, removeCollect } = useQuestionApi()

const loading = ref(false)
const collectList = ref<QuestionCollect[]>([])
const total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10 })

async function fetchCollectList() {
  loading.value = true
  try {
    const result = await getCollectList(queryParams)
    collectList.value = result.rows
    total.value = result.total
  } catch (error) {
    collectList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  fetchCollectList()
}

async function handleRemoveCollect(item: QuestionCollect) {
  try {
    await removeCollect(item.questionId)
    ElMessage.success('已取消收藏')
    fetchCollectList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function getQuestionTypeText(type: number): string {
  const map: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算', 7: '综合', 8: '听力' }
  return map[type] || '未知'
}

onMounted(() => { fetchCollectList() })
useSeoMeta({ title: '我的收藏 - 教育云平台' })
</script>

<style scoped>
.collect-page { min-height: calc(100vh - var(--header-height) - var(--footer-height)); }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.page-desc { font-size: 14px; color: var(--text-secondary); margin: 0; }
.collect-list { min-height: 400px; }
.collect-items { display: flex; flex-direction: column; gap: 16px; }
.collect-item { background: var(--bg-color); border-radius: 8px; padding: 20px; border: 1px solid var(--border-color); }
.collect-header { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.question-type { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #e6f7ff; color: #1890ff; }
.subject-name { font-size: 13px; color: var(--text-secondary); flex: 1; }
.question-content { font-size: 14px; line-height: 1.8; color: var(--text-primary); margin-bottom: 12px; }
.collect-footer { font-size: 12px; color: var(--text-secondary); padding-top: 8px; border-top: 1px solid var(--border-color); }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }
</style>
