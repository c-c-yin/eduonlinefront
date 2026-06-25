<template>
  <div class="cached-list" :class="{ loading }">
    <slot v-if="loading && !data.length" name="loading">
      <div class="default-loading">加载中...</div>
    </slot>

    <slot v-else-if="!data.length && !loading" name="empty">
      <el-empty description="暂无数据" />
    </slot>

    <template v-else>
      <VirtualScroll
        v-if="virtualScroll"
        :items="data"
        :item-height="itemHeight"
        :container-height="scrollHeight"
      >
        <template #default="{ item, index }">
          <slot name="item" :item="item" :index="index" />
        </template>
      </VirtualScroll>

      <div v-else class="list-content">
        <slot name="item" v-for="(item, index) in data" :key="getKey(item, index)" :item="item" :index="index" />
      </div>

      <div v-if="hasMore && !virtualScroll" class="load-more">
        <el-button v-if="loading" :loading="true">加载中...</el-button>
        <el-button v-else @click="loadMore">加载更多</el-button>
      </div>

      <div v-if="showTotal && total > 0" class="total-info">
        共 {{ total }} 条记录
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VirtualScroll from './VirtualScroll.vue'

interface Props {
  data: any[]
  total?: number
  loading?: boolean
  virtualScroll?: boolean
  itemHeight?: number
  scrollHeight?: string
  showTotal?: boolean
  getKey?: (item: any, index: number) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  loading: false,
  virtualScroll: false,
  itemHeight: 60,
  scrollHeight: '400px',
  showTotal: true,
  getKey: (item: any, index: number) => index
})

const emit = defineEmits<{
  (e: 'load-more'): void
}>()

const hasMore = computed(() => props.total > props.data.length)

function loadMore() {
  emit('load-more')
}
</script>

<style scoped>
.cached-list {
  width: 100%;
}

.cached-list.loading {
  opacity: 0.8;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.total-info {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 12px 0;
}

.default-loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
