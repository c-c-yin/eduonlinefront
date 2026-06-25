<template>
  <div class="skeleton-table">
    <el-skeleton animated :loading="true" :rows="rows" :throttle="0" />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
}>(), {
  rows: 5
})
</script>

<style scoped>
.skeleton-table {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
</style>