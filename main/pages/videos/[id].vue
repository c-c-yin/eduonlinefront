<template>
  <div class="video-detail-page">
    <div class="container">
      <div v-loading="loading" class="video-content">
        <template v-if="video">
          <div class="video-player-section">
            <ClientOnly>
              <div v-if="video.filePath" class="video-wrapper">
                <video
                  ref="videoPlayerRef"
                  class="video-js vjs-default-skin vjs-big-play-centered"
                  playsinline
                />
              </div>
              <div v-else class="video-placeholder">
                <img :src="video.coverPath || '/images/default-cover.png'" :alt="video.videoName" class="cover-image" />
              </div>
            </ClientOnly>
          </div>

          <div class="video-info-section">
            <h1 class="video-title">{{ video.videoName }}</h1>
            <div class="video-meta">
              <span v-if="video.innerTeacherName" class="meta-item">
                <el-icon><User /></el-icon>
                {{ video.innerTeacherName }}
              </span>
              <span class="meta-item">
                <el-icon><VideoCamera /></el-icon>
                {{ formatNumber(video.viewCount || 0) }}次观看
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ video.createTime?.substring(0, 10) }}
              </span>
              <span class="meta-item">
                <el-icon><Star /></el-icon>
                {{ formatNumber(video.collectCount || 0) }}收藏
              </span>
            </div>
            <div class="video-type-tags">
              <el-tag v-if="video.gradeName" size="small">{{ video.gradeName }}</el-tag>
              <el-tag v-if="video.subjectName" size="small" type="success">{{ video.subjectName }}</el-tag>
              <el-tag size="small" type="warning">{{ videoTypeText }}</el-tag>
            </div>
            <div v-if="video.videoDesc" class="video-desc">
              <h3>课程简介</h3>
              <p>{{ video.videoDesc }}</p>
            </div>
          </div>

          <div v-if="resources.length > 0" class="video-resources">
            <h3>课程资料</h3>
            <div class="resource-list">
              <div v-for="res in resources" :key="res.resourceId" class="resource-item">
                <el-icon><Document /></el-icon>
                <span class="resource-name">{{ res.resourceName }}</span>
                <span class="resource-type">{{ resourceTypeMap[res.resourceType] || '其他' }}</span>
                <el-button
                  v-if="res.isPublic === 1"
                  type="primary"
                  link
                  :loading="downloadingId === res.resourceId"
                  @click="downloadResource(res.resourceId)"
                >
                  下载
                </el-button>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else-if="!loading" description="视频不存在或已下架" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, VideoCamera, Calendar, Star, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Video, VideoResource } from '@/types'
import { useVideoApi, type SecurePlayUrl } from '@/composables/useVideoApi'
import { formatNumber } from '@/utils/format'
import { post } from '@/utils/request'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const { getVideoDetail, getVideoResources, getSecurePlayUrl } = useVideoApi()

const loading = ref(false)
const video = ref<Video | null>(null)
const resources = ref<VideoResource[]>([])
const downloadingId = ref<number | null>(null)
const videoPlayerRef = ref<HTMLVideoElement>()
let player: any = null

const videoTypeMap: Record<number, string> = {
  1: '课程视频', 2: '讲座视频', 3: '非课程视频', 4: '其他'
}
const resourceTypeMap: Record<number, string> = {
  1: '试题', 2: '学案', 3: '课件', 4: '教案', 5: '笔记', 6: '其他'
}

const videoTypeText = computed(() => {
  if (!video.value) return ''
  return videoTypeMap[video.value.videoType] || '视频'
})

async function initVideoPlayer() {
  if (!videoPlayerRef.value || !video.value?.filePath) return

  const videojs = (await import('video.js')).default
  await import('video.js/dist/video-js.css')

  let playUrl = video.value.filePath
  try {
    const secureUrl: SecurePlayUrl = await getSecurePlayUrl(video.value.videoId)
    if (secureUrl?.playUrl) {
      playUrl = secureUrl.playUrl
    }
  } catch {
    // fallback to original filePath
  }

  const isHls = playUrl.includes('.m3u8') || playUrl.includes('/hls/')

  const options: any = {
    controls: true,
    autoplay: false,
    preload: 'auto',
    fluid: true,
    aspectRatio: '16:9',
    poster: video.value.coverPath || '',
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    controlBar: {
      children: [
        'playToggle',
        'volumePanel',
        'currentTimeDisplay',
        'timeDivider',
        'durationDisplay',
        'progressControl',
        'playbackRateMenuButton',
        'fullscreenToggle'
      ]
    }
  }

  if (!isHls) {
    options.sources = [{ src: playUrl, type: 'video/mp4' }]
    player = videojs(videoPlayerRef.value, options)
  } else {
    options.sources = [{ src: playUrl, type: 'application/x-mpegURL' }]
    player = videojs(videoPlayerRef.value, options)

    const Hls = (await import('hls.js')).default
    const techEl = player.tech_.el_ as HTMLVideoElement | null
    if (Hls.isSupported() && techEl) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      })
      hls.loadSource(playUrl)
      hls.attachMedia(techEl)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        player.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              hls.destroy()
              break
          }
        }
      })
    }
  }
}

function disposeVideoPlayer() {
  if (player) {
    player.dispose()
    player = null
  }
}

async function fetchVideoDetail() {
  const videoId = Number(route.params.id)
  if (!videoId) return

  loading.value = true
  try {
    const detail = await getVideoDetail(videoId)
    video.value = detail
    if (detail) {
      try {
        resources.value = await getVideoResources(videoId)
      } catch {
        resources.value = []
      }
      nextTick(() => {
        initVideoPlayer()
      })
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
    video.value = null
  } finally {
    loading.value = false
  }
}

async function downloadResource(resourceId: number) {
  downloadingId.value = resourceId
  try {
    const res: any = await post(`/video-resource/download/${resourceId}`)
    if (res?.data?.downloadUrl) {
      window.open(res.data.downloadUrl, '_blank')
    } else {
      ElMessage.warning('暂无下载链接')
    }
  } catch (e) {
    ElMessage.error('下载失败，请稍后重试')
  } finally {
    downloadingId.value = null
  }
}

onMounted(() => {
  fetchVideoDetail()
})

onBeforeUnmount(() => {
  disposeVideoPlayer()
})

useSeoMeta({
  title: () => video.value ? `${video.value.videoName} - 教育云平台` : '视频详情 - 教育云平台',
  description: () => video.value?.videoDesc || '视频详情'
})
</script>

<style scoped>
.video-detail-page {
  min-height: calc(100vh - var(--header-height, 64px) - var(--footer-height, 200px));
  padding: 24px 0;
}

.video-player-section {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
}

.video-wrapper {
  width: 100%;
  max-height: 540px;
}

.video-wrapper .video-js {
  width: 100%;
  height: 100%;
}

.video-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info-section {
  background: var(--bg-color, #fff);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.video-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 16px;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--text-secondary, #999);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-type-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.video-desc {
  border-top: 1px solid var(--border-color, #eee);
  padding-top: 20px;
}

.video-desc h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary, #333);
}

.video-desc p {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-regular, #666);
  margin: 0;
}

.video-resources {
  background: var(--bg-color, #fff);
  border-radius: 8px;
  padding: 24px;
}

.video-resources h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-primary, #333);
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-color-page, #f5f5f5);
  border-radius: 6px;
  font-size: 14px;
}

.resource-name {
  flex: 1;
  color: var(--text-primary, #333);
}

.resource-type {
  color: var(--text-secondary, #999);
  font-size: 12px;
}
</style>
