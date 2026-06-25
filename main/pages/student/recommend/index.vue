<template>
  <div class="recommend-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">智能推荐</h1>
        <p class="page-desc">基于学习情况，精准推荐</p>
        <el-button type="primary" style="margin-top: 12px" @click="handleGenerate">刷新推荐</el-button>
      </div>

      <div v-loading="loading" class="recommend-list">
        <div v-if="recommendList.length > 0" class="recommend-items">
          <div v-for="item in recommendList" :key="item.recommendId" class="recommend-item">
            <div class="recommend-header">
              <span class="recommend-type" :class="item.recommendType === 1 ? 'type-question' : 'type-video'">
                {{ item.recommendType === 1 ? '试题推荐' : '视频推荐' }}
              </span>
              <span class="recommend-score">推荐指数: {{ item.recommendScore }}</span>
            </div>
            <div class="recommend-target">{{ item.targetName }}</div>
            <div class="recommend-reason">{{ item.recommendReason }}</div>
            <div class="recommend-meta">
              <span>知识点: {{ item.knowledgeName }}</span>
              <span>{{ item.isViewed === 1 ? '已查看' : '未查看' }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无推荐内容，请先完成一些练习" />
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" layout="total, prev, pager, next" @current-change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecommendRecord } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'

definePageMeta({ layout: 'default', middleware: ['auth'] })

const { getRecommendList, generateRecommendations } = useQuestionApi()

const loading = ref(false)
const recommendList = ref<RecommendRecord[]>([])
const total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10 })

async function fetchRecommendList() {
  loading.value = true
  try {
    const result = await getRecommendList(queryParams)
    recommendList.value = result.rows
    total.value = result.total
  } catch (error) {
    recommendList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  fetchRecommendList()
}

async function handleGenerate() {
  try {
    await generateRecommendations()
    ElMessage.success('推荐已更新')
    queryParams.pageNum = 1
    fetchRecommendList()
  } catch (error) {
    ElMessage.error('生成推荐失败')
  }
}

onMounted(() => { fetchRecommendList() })
useSeoMeta({ title: '智能推荐 - 教育云平台' })
</script>

<style scoped>
.recommend-page { min-height: calc(100vh - var(--header-height) - var(--footer-height)); }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.page-desc { font-size: 14px; color: var(--text-secondary); margin: 0; }
.recommend-list { min-height: 400px; }
.recommend-items { display: flex; flex-direction: column; gap: 16px; }
.recommend-item { background: var(--bg-color); border-radius: 8px; padding: 20px; border: 1px solid var(--border-color); }
.recommend-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.recommend-type { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.recommend-type.type-question { background: #e6f7ff; color: #1890ff; }
.recommend-type.type-video { background: #f6ffed; color: #52c41a; }
.recommend-score { font-size: 13px; color: var(--text-secondary); }
.recommend-target { font-size: 16px; font-weight: 500; margin-bottom: 8px; color: var(--text-primary); }
.recommend-reason { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.6; }
.recommend-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); padding-top: 8px; border-top: 1px solid var(--border-color); }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }
</style>
