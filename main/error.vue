<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">{{ error?.statusCode || 404 }}</h1>
      <p class="error-message">{{ error?.message || '页面未找到' }}</p>
      <el-button type="primary" @click="handleBack">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode: number
    message: string
  }
}

const props = defineProps<ErrorProps>()

const router = useRouter()

function handleBack() {
  router.push('/')
}

useHead({
  title: `错误 ${props.error?.statusCode || 404}`
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}

.error-content {
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
}

.error-message {
  font-size: 24px;
  color: var(--text-secondary);
  margin: 20px 0 40px;
}
</style>
