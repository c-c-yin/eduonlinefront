<template>
  <div class="latest-papers">
    <div v-if="papers && papers.length" class="paper-grid">
      <div v-for="paper in papers" :key="paper.paperId" class="paper-card" @click="goPaper(paper.paperId)">
        <div class="paper-header">
          <span class="paper-difficulty" :class="'diff-' + paper.difficulty">
            {{ difficultyMap[paper.difficulty] || '中等' }}
          </span>
        </div>
        <h4 class="paper-name">{{ paper.paperName }}</h4>
        <div class="paper-meta">
          <span>{{ paper.totalQuestion || 0 }}题</span>
          <span>{{ paper.totalScore || 0 }}分</span>
          <span>{{ paper.useCount || 0 }}次使用</span>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无试卷" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import type { LatestPaperItem } from '@/types'

interface Props {
  papers?: LatestPaperItem[] | null
}

const props = defineProps<Props>()
const router = useRouter()
const userStore = useUserStore()

const difficultyMap: Record<number, string> = {
  1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难'
}

function goPaper(id: number) {
  router.push(userStore.isTeacher ? `/teacher/papers/${id}` : `/papers/${id}`)
}
</script>

<style scoped>
.latest-papers {
  min-height: 100px;
}

.paper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.paper-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.paper-card:hover {
  background: #fff;
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(255, 80, 0, 0.1);
}

.paper-header {
  margin-bottom: 8px;
}

.paper-difficulty {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.diff-1 { background: #67C23A; }
.diff-2 { background: #95d475; }
.diff-3 { background: #E6A23C; }
.diff-4 { background: #f56c6c9e; }
.diff-5 { background: #F56C6C; }

.paper-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .paper-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
