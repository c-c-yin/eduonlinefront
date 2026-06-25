<template>
  <div class="image-upload">
    <el-upload
      :action="uploadUrl"
      :headers="headers"
      :show-file-list="false"
      :before-upload="handleBeforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      accept="image/png,image/jpg,image/jpeg"
    >
      <div v-if="modelValue" class="image-preview">
        <img :src="modelValue" class="preview-img" />
        <div class="preview-mask">
          <el-icon :size="20" color="#fff"><ZoomIn /></el-icon>
          <el-icon :size="20" color="#fff" @click.stop="handleRemove"><Delete /></el-icon>
        </div>
      </div>
      <div v-else class="image-placeholder">
        <el-icon :size="28" color="#c0c4cc"><Plus /></el-icon>
        <span>上传封面</span>
      </div>
    </el-upload>
    <div class="upload-tip" v-if="showTip">
      支持 png/jpg/jpeg 格式，大小不超过 {{ fileSize }}MB
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, ZoomIn, Delete } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'

const props = withDefaults(defineProps<{
  modelValue?: string
  fileSize?: number
  showTip?: boolean
}>(), {
  fileSize: 5,
  showTip: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const config = useRuntimeConfig()
const uploadUrl = (config.public.apiBase as string || '') + '/file/upload'
const headers = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

function handleBeforeUpload(file: File) {
  const isImage = ['image/png', 'image/jpg', 'image/jpeg'].includes(file.type)
  if (!isImage) {
    ElMessage.error('只能上传 png/jpg/jpeg 格式的图片')
    return false
  }
  const isLt = file.size / 1024 / 1024 < props.fileSize
  if (!isLt) {
    ElMessage.error(`图片大小不能超过 ${props.fileSize}MB`)
    return false
  }
  return true
}

function handleSuccess(response: any) {
  if (response.code === 200) {
    emit('update:modelValue', response.data.url)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

function handleError() {
  ElMessage.error('上传图片失败')
}

function handleRemove() {
  emit('update:modelValue', '')
}
</script>

<style scoped>
.image-upload :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-upload :deep(.el-upload:hover) {
  border-color: #409eff;
}

.image-placeholder {
  width: 148px;
  height: 148px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
  font-size: 13px;
}

.image-preview {
  width: 148px;
  height: 148px;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .preview-mask {
  opacity: 1;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}
</style>