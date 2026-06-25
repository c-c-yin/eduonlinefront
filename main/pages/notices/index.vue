<template>
  <div class="notices-page">
    <div class="container page-container">
      <div class="page-header">
        <h2>公告通知</h2>
      </div>
      <div class="notices-content">
        <div v-loading="loading" class="notice-list">
          <div v-if="noticeList.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无公告" />
          </div>
          <div
            v-for="notice in noticeList"
            :key="notice.noticeId"
            class="notice-item"
            @click="goDetail(notice.noticeId)"
          >
            <div class="notice-title-row">
              <el-tag v-if="notice.isTop === 1" type="danger" size="small" class="top-tag">置顶</el-tag>
              <el-tag :type="getNoticeTypeTag(notice.noticeType)" size="small" class="type-tag">
                {{ getNoticeTypeLabel(notice.noticeType) }}
              </el-tag>
              <span class="notice-title">{{ notice.noticeTitle }}</span>
            </div>
            <div class="notice-meta">
              <span class="notice-time">{{ notice.publishTime }}</span>
              <span v-if="notice.viewCount" class="notice-views">
                <el-icon><View /></el-icon>
                {{ notice.viewCount }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="total > 0" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { View } from '@element-plus/icons-vue'
import { usePortalApi } from '@/composables/usePortalApi'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const { getNoticeList } = usePortalApi()

const loading = ref(false)
const noticeList = ref<any[]>([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10
})

function getNoticeTypeLabel(type: number) {
  const labels: Record<number, string> = { 1: '系统公告', 2: '课程公告', 3: '活动公告', 4: '紧急通知' }
  return labels[type] || '公告'
}

function getNoticeTypeTag(type: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined {
  const tags: Record<number, 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined> = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' }
  return tags[type] || 'info'
}

function goDetail(noticeId: number) {
  router.push(`/notices/${noticeId}`)
}

async function fetchList() {
  loading.value = true
  try {
    const res: any = await getNoticeList(queryParams.value)
    noticeList.value = res?.rows || []
    total.value = res?.total || 0
  } catch (e) {
    console.error('获取公告列表失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.notices-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 22px;
  color: #303133;
}

.notices-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.notice-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background 0.2s;
}

.notice-item:hover {
  background: #f5f7fa;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.top-tag {
  flex-shrink: 0;
}

.type-tag {
  flex-shrink: 0;
}

.notice-title {
  font-size: 16px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.notice-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 60px 0;
}
</style>
