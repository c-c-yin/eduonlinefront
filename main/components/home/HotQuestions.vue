<template>
  <div class="hot-questions">
    <div v-if="questions && questions.length" class="question-list">
      <div v-for="q in questions" :key="q.questionId" class="question-item" @click="goQuestion(q.questionId)">
        <span :class="['q-type-tag', 'type-' + q.questionType]">{{ questionTypeMap[q.questionType] || '其他' }}</span>
        <span class="q-content">{{ q.questionContentText || '点击查看详情' }}</span>
        <div class="q-meta">
          <span class="q-difficulty">{{ difficultyMap[q.difficulty] || '' }}</span>
          <span class="q-rate" v-if="q.correctRate != null">{{ (q.correctRate * 100).toFixed(0) }}%</span>
          <span class="q-collect"><el-icon><Star /></el-icon>{{ q.collectCount || 0 }}</span>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无试题" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { Star } from '@element-plus/icons-vue'
import type { HotQuestionItem } from '@/types'

interface Props {
  questions?: HotQuestionItem[] | null
}

const props = defineProps<Props>()
const router = useRouter()

const questionTypeMap: Record<number, string> = {
  1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算', 7: '证明', 8: '应用'
}

const difficultyMap: Record<number, string> = {
  1: '易', 2: '较易', 3: '中等', 4: '较难', 5: '难'
}

function goQuestion(id: number) {
  router.push(`/questions/${id}`)
}
</script>

<style scoped>
.hot-questions {
  min-height: 100px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.question-item:hover {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.q-type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
  min-width: 36px;
  text-align: center;
}

.type-1 { background: #409EFF; }
.type-2 { background: #67C23A; }
.type-3 { background: #E6A23C; }
.type-4 { background: #F56C6C; }
.type-5, .type-6, .type-7, .type-8 { background: #909399; }

.q-content {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.q-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.q-difficulty {
  padding: 1px 6px;
  border-radius: 3px;
  background: #f0f0f0;
}

.q-collect {
  display: flex;
  align-items: center;
  gap: 2px;
}

.q-collect .el-icon {
  font-size: 13px;
}
</style>
