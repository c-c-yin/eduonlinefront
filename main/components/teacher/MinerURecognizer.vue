<template>
  <el-dialog
    v-model="visible"
    title="智能识题"
    width="900px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 上传区域 -->
    <div v-if="!results.length && !submitting && taskStatus !== 'failed'" class="upload-area">
      <input
        ref="fileInputRef"
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf"
        style="display: none"
        @change="handleFileSelect"
      />
      <div
        class="upload-drop-zone"
        :class="{ 'is-drag-over': dragOver }"
        @click="fileInputRef?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="handleDrop"
      >
        <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
        <p class="upload-text">点击或拖拽上传图片/PDF</p>
        <p class="upload-tip">支持 jpg、png、gif、bmp、webp、pdf 格式，文件大小不超过 20MB</p>
      </div>
    </div>

    <!-- 提交/处理进度 -->
    <div v-if="submitting || taskStatus === 'queued' || taskStatus === 'processing'" class="status-area">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span class="status-text">{{ statusText }}</span>
      <el-progress
        v-if="taskStatus === 'processing'"
        :percentage="progress"
        :stroke-width="6"
        style="margin-top: 12px; max-width: 400px"
      />
    </div>

    <!-- 识别失败 -->
    <div v-if="taskStatus === 'failed'" class="status-area">
      <el-icon :size="24" color="#f56c6c"><CircleClose /></el-icon>
      <span class="status-text" style="color: #f56c6c">识别失败：{{ taskError }}</span>
      <el-button type="primary" style="margin-top: 12px" @click="resetState">重新上传</el-button>
    </div>

    <!-- 识别结果列表 -->
    <div v-if="results.length > 0" class="result-list">
      <div class="result-header">
        <span class="result-title">识别结果（{{ results.length }} 道试题）</span>
        <el-button type="primary" size="small" @click="resetState">重新上传</el-button>
      </div>

      <div class="result-cards">
        <div
          v-for="(item, idx) in results"
          :key="idx"
          class="question-card"
        >
          <div class="card-header">
            <span class="card-index">试题 {{ idx + 1 }}</span>
            <el-tag size="small" style="margin-left: 8px">
              {{ getQuestionTypeLabel(item.questionType) }}
            </el-tag>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="handleApply(item)">
                填入表单
              </el-button>
              <el-button type="danger" link size="small" @click="removeResult(idx)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
          <div class="card-content">
            <div class="card-section">
              <span class="section-label">题干：</span>
              <div class="section-html" v-html="item.questionContent || '（无内容）'"></div>
            </div>
            <div v-if="item.optionsJson" class="card-section">
              <span class="section-label">选项：</span>
              <div class="section-options">
                <div v-for="(opt, oi) in parseOptions(item.optionsJson)" :key="oi" class="option-line">
                  <span class="option-key">{{ opt.optionKey || String.fromCharCode(65 + oi) }}.</span>
                  <span v-html="opt.content || opt.optionContent || ''"></span>
                </div>
              </div>
            </div>
            <div v-if="item.answerContent" class="card-section">
              <span class="section-label">答案：</span>
              <div class="section-html" v-html="item.answerContent"></div>
            </div>
            <div v-if="item.answerAnalysis" class="card-section">
              <span class="section-label">解析：</span>
              <div class="section-html" v-html="item.answerAnalysis"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Loading, Delete, CircleClose } from '@element-plus/icons-vue'
import { useTeacherQuestionApi, type MinerUTaskStatus } from '@/composables/useTeacherQuestionApi'

interface MinerUResult {
  questionContent: string
  questionType: number
  optionsJson?: string
  answerContent?: string
  answerAnalysis?: string
}

const { recognizeMinerU, recognizeMinerUAsync, getMinerUTaskStatus } = useTeacherQuestionApi()

// ========== Props & Emits ==========
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [result: MinerUResult]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

// ========== 状态 ==========
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const submitting = ref(false)
const taskStatus = ref<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle')
const taskError = ref('')
const taskId = ref('')
const progress = ref(0)
const results = ref<MinerUResult[]>([])
let pollTimer: ReturnType<typeof setInterval> | null = null

const statusText = computed(() => {
  if (submitting.value) return '正在提交识别任务...'
  if (taskStatus.value === 'queued') return '任务排队中，请稍候...'
  if (taskStatus.value === 'processing') return '正在识别试题...'
  return '处理中...'
})

// ========== 文件选择 & 拖拽 ==========
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf']
const MAX_FILE_SIZE = 20 * 1024 * 1024

function isFileValid(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    ElMessage.warning('仅支持 jpg、png、gif、bmp、webp、pdf 格式文件')
    return false
  }
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.warning('文件大小不能超过 20MB')
    return false
  }
  return true
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (isFileValid(file)) {
    submitRecognize(file)
  }
  input.value = ''
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (isFileValid(file)) {
    submitRecognize(file)
  }
}

// ========== 提交识别 ==========
async function submitRecognize(file: File) {
  submitting.value = true
  taskStatus.value = 'idle'
  taskError.value = ''
  results.value = []
  progress.value = 0

  const formData = new FormData()
  formData.append('file', file)

  try {
    // 先尝试异步提交
    const res: any = await recognizeMinerUAsync(formData)
    const id = res?.data?.taskId || res?.taskId || res?.data?.id || res?.id

    if (id) {
      taskId.value = id
      taskStatus.value = 'queued'
      startPolling()
    } else {
      // 无 taskId 说明同步返回了结果
      const data = res?.data || res
      if (Array.isArray(data)) {
        results.value = data
        taskStatus.value = 'completed'
      } else if (data?.questions && Array.isArray(data.questions)) {
        results.value = data.questions
        taskStatus.value = 'completed'
      } else {
        taskStatus.value = 'failed'
        taskError.value = '未获取到识别结果'
      }
    }
  } catch (_e: any) {
    // 异步提交失败，回退到同步模式
    try {
      const syncRes: any = await recognizeMinerU(formData)
      const data = syncRes?.data || syncRes
      if (Array.isArray(data)) {
        results.value = data
        taskStatus.value = 'completed'
      } else if (data?.questions && Array.isArray(data.questions)) {
        results.value = data.questions
        taskStatus.value = 'completed'
      } else {
        taskStatus.value = 'failed'
        taskError.value = '未获取到识别结果'
      }
    } catch (syncErr: any) {
      taskStatus.value = 'failed'
      taskError.value = syncErr?.message || '识别失败'
      ElMessage.error('识别失败')
    }
  } finally {
    submitting.value = false
  }
}

// ========== 轮询任务状态 ==========
function startPolling() {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (!taskId.value) return
    try {
      const status: MinerUTaskStatus = await getMinerUTaskStatus(taskId.value)
      taskStatus.value = status.status

      if (status.status === 'completed') {
        stopPolling()
        const data = status.data
        if (Array.isArray(data) && data.length > 0) {
          results.value = data
        } else {
          results.value = []
          ElMessage.info('未识别到试题')
        }
      } else if (status.status === 'failed') {
        stopPolling()
        taskError.value = status.errorMessage || '识别失败'
        ElMessage.error(taskError.value)
      } else if (status.status === 'processing') {
        progress.value = Math.min(progress.value + Math.random() * 15, 90)
      }
    } catch (e) {
      console.error('轮询任务状态失败:', e)
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// ========== 结果操作 ==========
function handleApply(item: MinerUResult) {
  emit('apply', { ...item })
  ElMessage.success('已填入表单')
}

async function removeResult(idx: number) {
  try {
    await ElMessageBox.confirm('确定要删除该试题吗？', '提示', { type: 'warning' })
    results.value.splice(idx, 1)
    ElMessage.success('已删除')
  } catch { /* cancel */ }
}

// ========== 工具函数 ==========
function parseOptions(optionsJson: string): any[] {
  if (!optionsJson) return []
  try { return JSON.parse(optionsJson) } catch { return [] }
}

function getQuestionTypeLabel(type: number): string {
  const map: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算' }
  return map[type] || '未知'
}

// ========== 重置 & 关闭 ==========
function resetState() {
  stopPolling()
  submitting.value = false
  taskStatus.value = 'idle'
  taskError.value = ''
  taskId.value = ''
  progress.value = 0
  results.value = []
  dragOver.value = false
}

function handleClose() {
  stopPolling()
  resetState()
}

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.upload-area {
  padding: 20px 0;
}

.upload-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
}

.upload-drop-zone:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.upload-drop-zone.is-drag-over {
  border-color: #67c23a;
  background: #f0f9eb;
  border-style: solid;
}

.upload-text {
  margin: 12px 0 4px;
  font-size: 16px;
  color: #606266;
}

.upload-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.status-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px 0;
}

.status-text {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.result-list {
  max-height: 600px;
  overflow-y: auto;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.result-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
  transition: box-shadow 0.2s;
}

.question-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.card-index {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.card-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.card-section {
  margin-bottom: 6px;
}

.section-label {
  font-weight: 600;
  color: #909399;
  font-size: 12px;
  margin-right: 4px;
}

.section-html {
  display: inline;
  word-break: break-word;
}

.section-html :deep(img) {
  max-width: 100%;
  max-height: 60px;
  vertical-align: middle;
}

.section-options {
  display: inline;
}

.option-line {
  display: inline;
  margin-right: 16px;
}

.option-key {
  font-weight: 600;
  margin-right: 2px;
}

@media (max-width: 768px) {
  .upload-drop-zone {
    min-height: 160px;
    padding: 16px;
  }

  .result-list {
    max-height: 400px;
  }
}
</style>
