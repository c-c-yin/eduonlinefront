<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary-content">
      <el-icon :size="48" color="#f56c6c"><WarningFilled /></el-icon>
      <h3 class="error-boundary-title">页面加载异常</h3>
      <p class="error-boundary-message">{{ errorMessage }}</p>
      <el-button type="primary" @click="handleRetry">重新加载</el-button>
      <el-button @click="handleGoHome">返回首页</el-button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err: Error, _instance, _info) => {
  hasError.value = true
  errorMessage.value = err.message || '页面组件加载失败，请刷新重试'
  console.error('[ErrorBoundary]', err)
  return false
})

function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
}

function handleGoHome() {
  hasError.value = false
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.error-boundary-content {
  text-align: center;
  background: #fff;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  max-width: 460px;
  width: 100%;
}

.error-boundary-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px;
}

.error-boundary-message {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px;
  line-height: 1.6;
  word-break: break-all;
}
</style>