<template>
  <div class="video-card" @click="handleClick">
    <div class="video-cover">
      <img
        :src="video.coverPath || defaultCover"
        :alt="video.videoName"
        class="cover-image"
        loading="lazy"
      />
      <div class="tag course-type-tag">{{ videoTypeText }}</div>
      <div class="play-overlay">
        <el-icon class="play-icon"><VideoPlay /></el-icon>
      </div>
    </div>
    <div class="video-info">
      <h3 class="video-title" :title="video.videoName">{{ video.videoName }}</h3>
      <p class="teacher-desc">{{ video.innerTeacherName || '未知讲师' }}</p>
      <!-- 学习进度条（学生端） -->
      <div v-if="showProgress && video.studyProgress !== undefined" class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: video.studyProgress + '%' }"></div>
        </div>
        <span class="progress-text">已学 {{ video.studyProgress }}%</span>
      </div>
      <div class="video-footer">
        <span class="study-count">{{ formatNumber(video.viewCount || 0) }}人已学习</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay } from '@element-plus/icons-vue'
import type { Video } from '@/types'
import { formatNumber } from '@/utils/format'

interface Props {
  video: Video
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: false
})

const router = useRouter()
const defaultCover = '/images/default-cover.png'

const videoTypeMap: Record<number, string> = {
  1: '课程视频', 2: '讲座视频', 3: '非课程视频', 4: '其他'
}

const videoTypeText = computed(() => videoTypeMap[props.video.videoType] || '视频课')

function handleClick() {
  router.push(`/videos/${props.video.videoId}`)
}
</script>

<style scoped>
.video-card {
  background: var(--bg-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.video-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .cover-image {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 2px;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.course-type-tag {
  background: var(--primary-color);
}

.free-tag {
  top: auto;
  bottom: 8px;
  left: 8px;
  background: var(--danger-color);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 48px;
  color: #fff;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 6px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 40px;
}

.teacher-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 11px;
  color: var(--primary-color);
  white-space: nowrap;
}

.video-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.promotion-tag {
  background: var(--primary-color);
  color: #fff;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 500;
}

.current-price {
  font-size: 20px;
  font-weight: 600;
  color: var(--danger-color);
}

.original-price {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.study-count {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
