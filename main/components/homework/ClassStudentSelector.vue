<template>
  <div class="class-student-selector">
    <div class="toolbar">
      <el-input v-model="searchText" placeholder="搜索学生姓名/学号" clearable size="small" style="width:200px" />
      <el-button size="small" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</el-button>
    </div>

    <div v-loading="loading" class="student-list">
      <el-empty v-if="!loading && filteredStudents.length === 0" description="暂无学生" />
      <div
        v-for="s in filteredStudents"
        :key="s.student_id"
        class="student-item"
        :class="{ selected: isSelected(s.student_id) }"
        @click="toggleStudent(s)"
      >
        <el-checkbox :model-value="isSelected(s.student_id)" @click.stop @change="toggleStudent(s)" />
        <span class="student-name">{{ s.student_name }}</span>
        <span class="student-no">{{ s.student_no }}</span>
        <span v-if="s.last_score != null" class="student-score" :class="scoreClass(s.last_score)">
          {{ s.last_score }}分
        </span>
        <el-tag v-if="s.mastery_level != null" :type="masteryTagType(s.mastery_level)" size="small">
          {{ masteryLabel(s.mastery_level) }}
        </el-tag>
      </div>
    </div>

    <div class="selector-footer">
      <span>已选择 <b>{{ selectedIds.length }}</b> / {{ students.length }} 名学生</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  classId: number
  subjectId?: number
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const loading = ref(false)
const students = ref<any[]>([])
const searchText = ref('')
const selectedIds = computed(() => props.modelValue)

let homeworkApi: any = null

const filteredStudents = computed(() => {
  if (!searchText.value) return students.value
  const kw = searchText.value.toLowerCase()
  return students.value.filter((s: any) =>
    (s.student_name || '').toLowerCase().includes(kw) ||
    (s.student_no || '').toLowerCase().includes(kw)
  )
})

const isAllSelected = computed(() => {
  return filteredStudents.value.length > 0 && filteredStudents.value.every((s: any) => isSelected(s.student_id))
})

function isSelected(id: number): boolean {
  return selectedIds.value.includes(id)
}

function toggleStudent(s: any) {
  const ids = [...selectedIds.value]
  const idx = ids.indexOf(s.student_id)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(s.student_id)
  emit('update:modelValue', ids)
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    const deselectIds = filteredStudents.value.map((s: any) => s.student_id)
    emit('update:modelValue', selectedIds.value.filter((id: number) => !deselectIds.includes(id)))
  } else {
    const newIds = new Set(selectedIds.value)
    filteredStudents.value.forEach((s: any) => newIds.add(s.student_id))
    emit('update:modelValue', Array.from(newIds))
  }
}

function scoreClass(score: number): string {
  if (score >= 85) return 'score-high'
  if (score >= 60) return 'score-mid'
  return 'score-low'
}

function masteryTagType(level: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined {
  if (level >= 4) return 'success'
  if (level >= 3) return undefined
  if (level >= 2) return 'warning'
  return 'danger'
}

function masteryLabel(level: number): string {
  const labels: Record<number, string> = { 5: '优秀', 4: '良好', 3: '一般', 2: '薄弱', 1: '待加强' }
  return labels[level] || '未知'
}

async function loadStudents() {
  if (!homeworkApi) {
    const mod = await import('@/composables/useHomeworkApi')
    homeworkApi = mod.useHomeworkApi()
  }
  loading.value = true
  try {
    students.value = await homeworkApi.getClassStudents(props.classId, props.subjectId)
  } catch { students.value = [] }
  finally { loading.value = false }
}

watch(() => props.classId, () => { loadStudents() }, { immediate: true })
</script>

<style scoped>
.class-student-selector { border: 1px solid #ebeef5; border-radius: 4px; padding: 12px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.student-list { max-height: 350px; overflow-y: auto; }
.student-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 4px; border-bottom: 1px solid #f2f6fc; cursor: pointer;
}
.student-item:hover { background: #f5f7fa; }
.student-item.selected { background: #ecf5ff; }
.student-name { font-weight: 500; min-width: 60px; }
.student-no { color: #909399; font-size: 12px; }
.student-score { font-weight: 600; margin-left: auto; }
.score-high { color: #67c23a; }
.score-mid { color: #e6a23c; }
.score-low { color: #f56c6c; }
.selector-footer { margin-top: 8px; font-size: 13px; color: #606266; }
</style>