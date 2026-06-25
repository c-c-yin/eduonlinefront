<template>
  <div class="skeleton-list">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <div class="skeleton-card-header">
        <el-skeleton animated>
          <template #template>
            <div class="sk-header-row">
              <el-skeleton-item variant="text" style="width: 30%; height: 20px" />
              <el-skeleton-item variant="text" style="width: 15%; height: 20px" />
            </div>
          </template>
        </el-skeleton>
      </div>
      <div class="skeleton-card-body">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="text" style="width: 90%; height: 16px" />
            <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
            <el-skeleton-item variant="text" style="width: 50%; height: 16px" />
          </template>
        </el-skeleton>
      </div>
      <div class="skeleton-card-footer">
        <el-skeleton animated>
          <template #template>
            <div class="sk-footer-row">
              <el-skeleton-item variant="text" style="width: 20%; height: 14px" />
              <el-skeleton-item variant="text" style="width: 20%; height: 14px" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 3
})
</script>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.skeleton-card-header {
  margin-bottom: 16px;
}

.sk-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.skeleton-card-footer {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.sk-footer-row {
  display: flex;
  gap: 24px;
}
</style>