<template>
  <div class="tier-config-panel">
    <div class="tier-strategy">
      <span class="label">分层依据：</span>
      <el-radio-group v-model="strategy" size="small">
        <el-radio value="score_range">按分数段</el-radio>
        <el-radio value="percentile">按比例</el-radio>
      </el-radio-group>
    </div>

    <div v-if="strategy === 'score_range'" class="tier-strategy-config">
      <span class="label">层数：</span>
      <el-input-number v-model="tierCount" :min="2" :max="5" size="small" style="width:100px" />
    </div>

    <div class="tier-actions">
      <el-button type="primary" size="small" @click="handleAutoTier" :loading="loading" :disabled="!homeworkId">
        自动分层
      </el-button>
    </div>

    <div v-if="tierData.length > 0" class="tier-preview">
      <h4>分层预览</h4>
      <div v-for="(tier, idx) in tierData" :key="idx" class="tier-group">
        <div class="tier-header">
          <el-tag :type="tierTagType(idx)" size="default">{{ tier.tier_label || `第${idx+1}层` }}</el-tag>
          <span class="tier-count">{{ tier.student_count || 0 }}人</span>
        </div>
        <div class="tier-students">
          <el-tag
            v-for="s in tier.students"
            :key="s.student_id"
            closable
            size="small"
            style="margin:2px"
            @close="removeFromTier(s, idx)"
          >
            {{ s.student_name || s.student_id }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const props = defineProps<{
  homeworkId: number | null
  referenceHomeworkId?: number
  classId?: number
  subjectId?: number
}>()

const emit = defineEmits<{
  'tier-updated': [tierConfig: string, studentTierMap: Record<number, number>]
}>()

const strategy = ref('score_range')
const tierCount = ref(3)
const loading = ref(false)
const tierData = ref<any[]>([])

let homeworkApi: any = null

function tierTagType(idx: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined {
  const types: Array<'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined> = ['danger', 'warning', undefined, 'success', 'primary']
  return types[idx]
}

async function handleAutoTier() {
  if (!props.homeworkId) {
    ElMessage.warning('请先保存作业基本信息')
    return
  }
  if (!homeworkApi) {
    const mod = await import('@/composables/useHomeworkApi')
    homeworkApi = mod.useHomeworkApi()
  }
  loading.value = true
  try {
    await homeworkApi.autoTier(props.homeworkId, {
      referenceHomeworkId: props.referenceHomeworkId,
      strategy: strategy.value,
      tierCount: tierCount.value
    })
    const preview = await homeworkApi.tierPreview(props.homeworkId)
    buildTierData(preview)
    ElMessage.success('自动分层完成')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function buildTierData(preview: any[]) {
  const grouped: Record<number, any[]> = {}
  preview.forEach((s: any) => {
    const tid = s.tierId ?? 0
    if (!grouped[tid]) grouped[tid] = []
    grouped[tid].push(s)
  })

  const defaultLabels = ['基础层', '提高层', '拓展层', '精英层', '挑战层']
  tierData.value = Object.keys(grouped).sort().map((tid) => ({
    tier_id: Number(tid),
    tier_label: grouped[Number(tid)]?.[0]?.tierLabel || defaultLabels[Number(tid)] || `第${Number(tid)+1}层`,
    student_count: grouped[Number(tid)]?.length || 0,
    students: grouped[Number(tid)]
  }))
}

function removeFromTier(student: any, tierIdx: number) {
  if (tierData.value[tierIdx]) {
    tierData.value[tierIdx].students = tierData.value[tierIdx].students.filter(
      (s: any) => s.student_id !== student.student_id
    )
    tierData.value[tierIdx].student_count = tierData.value[tierIdx].students.length
    // 通知父组件分层变更
    const studentTierMap: Record<number, number> = {}
    tierData.value.forEach((tier, idx) => {
      tier.students?.forEach((s: any) => {
        studentTierMap[s.student_id] = idx + 1
      })
    })
    emit('tier-updated', strategy.value, studentTierMap)
  }
}
</script>

<style scoped>
.tier-config-panel { padding: 12px; }
.tier-strategy { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.tier-strategy-config { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.label { font-weight: 500; color: #606266; white-space: nowrap; }
.tier-actions { margin-bottom: 16px; }
.tier-preview { border-top: 1px solid #ebeef5; padding-top: 16px; }
.tier-preview h4 { margin: 0 0 12px 0; font-size: 15px; }
.tier-group { margin-bottom: 16px; }
.tier-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.tier-count { font-size: 13px; color: #909399; }
.tier-students { display: flex; flex-wrap: wrap; gap: 2px; }
</style>