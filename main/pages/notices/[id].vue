<template>
  <div class="notice-detail-page">
    <div class="container">
      <div v-loading="loading" class="notice-content">
        <template v-if="notice">
          <div class="notice-header">
            <h1 class="notice-title">{{ notice.noticeTitle }}</h1>
            <div class="notice-meta">
              <el-tag v-if="notice.noticeType" size="small" :type="noticeTypeTag">
                {{ noticeTypeMap[notice.noticeType] || '通知' }}
              </el-tag>
              <span v-if="notice.isTop === 1" class="top-badge">置顶</span>
              <span class="meta-item">{{ notice.createTime?.substring(0, 10) }}</span>
              <span class="meta-item">{{ notice.viewCount || 0 }}次阅读</span>
            </div>
          </div>
          <div class="notice-body" v-safe-html="notice.noticeContent" />
        </template>
        <el-empty v-else-if="!loading" description="公告不存在" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notice } from '@/types'
import { usePortalApi } from '@/composables/usePortalApi'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const { getNoticeDetail } = usePortalApi()

const loading = ref(false)
const notice = ref<Notice | null>(null)

const noticeTypeMap: Record<string, string> = {
  '1': '系统通知', '2': '课程通知', '3': '活动通知', '4': '紧急通知'
}

const noticeTypeTag = computed(() => {
  const type = notice.value?.noticeType
  if (type === 4) return 'danger'
  if (type === 3) return 'warning'
  if (type === 2) return 'success'
  return 'info'
})

async function fetchNoticeDetail() {
  const noticeId = Number(route.params.id)
  if (!noticeId) return

  loading.value = true
  try {
    const detail = await getNoticeDetail(noticeId)
    notice.value = detail
  } catch (error) {
    console.error('获取公告详情失败:', error)
    notice.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchNoticeDetail()
})

useSeoMeta({
  title: () => notice.value ? `${notice.value.noticeTitle} - 教育云平台` : '公告详情 - 教育云平台',
  description: () => notice.value?.noticeTitle || '公告详情'
})
</script>

<style scoped>
.notice-detail-page {
  min-height: calc(100vh - var(--header-height, 64px) - var(--footer-height, 200px));
  padding: 24px 0;
}

.notice-content {
  background: var(--bg-color, #fff);
  border-radius: 8px;
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.notice-header {
  border-bottom: 1px solid var(--border-color, #eee);
  padding-bottom: 20px;
  margin-bottom: 24px;
}

.notice-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 16px;
  line-height: 1.4;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary, #999);
}

.top-badge {
  color: #f56c6c;
  font-size: 12px;
  font-weight: 600;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notice-body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-regular, #666);
  word-break: break-word;
}

.notice-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 12px 0;
}
</style>
