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
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-card);
  position: relative;
}

.video-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius-lg);
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-card-hover);
}

.video-card:hover::before {
  opacity: 1;
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
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-card:hover .cover-image {
  transform: scale(1.08);
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.course-type-tag {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  box-shadow: 0 2px 8px rgba(70, 195, 123, 0.4);
}

.free-tag {
  top: auto;
  bottom: 12px;
  left: 12px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
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
  font-size: 52px;
  color: #fff;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  transform: scale(0.9);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.video-card:hover .play-icon {
  transform: scale(1);
}

.video-info {
  padding: 16px;
}

.video-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 45px;
  transition: color 0.2s;
}

.video-card:hover .video-title {
  color: var(--primary-color);
}

.teacher-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.teacher-desc::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  flex-shrink: 0;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 600;
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
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.current-price {
  font-size: 20px;
  font-weight: 700;
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.study-count::before {
  content: '';
  width: 4px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 50%;
}
</style>
