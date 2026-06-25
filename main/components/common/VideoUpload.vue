<template>
  <div class="video-upload">
    <el-upload
      ref="uploadRef"
      :action="uploadUrl"
      :headers="headers"
      :show-file-list="false"
      :before-upload="handleBeforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-progress="handleProgress"
      accept="video/*"
      :data="uploadData"
    >
      <div v-if="uploading" class="upload-progress">
        <el-progress :percentage="percentage" :stroke-width="6" />
        <span class="progress-text">上传中 {{ percentage }}%</span>
      </div>
      <div v-else-if="modelValue" class="video-preview">
        <video :src="modelValue" class="preview-video" />
        <div class="preview-info">
          <el-icon :size="16"><VideoCamera /></el-icon>
          <span class="preview-name">{{ fileName || '已上传视频' }}</span>
          <el-button link type="danger" size="small" @click.stop="handleRemove">删除</el-button>
        </div>
      </div>
      <div v-else class="video-placeholder">
        <el-icon :size="32" color="#c0c4cc"><VideoCamera /></el-icon>
        <span>点击上传视频</span>
        <span class="placeholder-tip">支持 video/* 格式，大小不超过 500MB</span>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'

const props = withDefaults(defineProps<{
  modelValue?: string
  fileName?: string
  fileSize?: number
}>(), {
  fileSize: 500
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:fileName', value: string): void
  (e: 'update:fileSize', value: number): void
  (e: 'uploaded', info: { url: string; name: string; size: number }): void
}>()

const config = useRuntimeConfig()
const uploadUrl = (config.public.apiBase as string || '') + '/file/upload'
const headers = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))
const uploadData = ref({})

const uploading = ref(false)
const percentage = ref(0)

function handleBeforeUpload(file: File) {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    ElMessage.error('只能上传视频文件')
    return false
  }
  const isLt = file.size / 1024 / 1024 < props.fileSize
  if (!isLt) {
    ElMessage.error(`视频大小不能超过 ${props.fileSize}MB`)
    return false
  }
  uploading.value = true
  percentage.value = 0

  // 尝试获取视频元信息
  const videoEl = document.createElement('video')
  videoEl.preload = 'metadata'
  videoEl.onloadedmetadata = () => {
    URL.revokeObjectURL(videoEl.src)
  }
  videoEl.src = URL.createObjectURL(file)

  return true
}

function handleProgress(event: any) {
  percentage.value = Math.round(event.percent || 0)
}

function handleSuccess(response: any, _file: any) {
  uploading.value = false
  percentage.value = 0
  if (response.code === 200) {
    const url = response.data.url
    const name = response.data.name || response.data.originalName || ''
    const size = response.data.size || 0
    emit('update:modelValue', url)
    emit('update:fileName', name)
    emit('update:fileSize', size)
    emit('uploaded', { url, name, size })
    ElMessage.success('视频上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

function handleError() {
  uploading.value = false
  percentage.value = 0
  ElMessage.error('上传视频失败')
}

function handleRemove() {
  emit('update:modelValue', '')
  emit('update:fileName', '')
  emit('update:fileSize', 0)
}
</script>

<style scoped>
.video-upload :deep(.el-upload) {
  width: 100%;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.video-upload :deep(.el-upload:hover) {
  border-color: #409eff;
}

.video-placeholder {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

.placeholder-tip {
  font-size: 12px;
  color: #c0c4cc;
}

.video-preview {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-video {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
  background: #000;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.preview-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-progress {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 13px;
  color: #909399;
}
</style>