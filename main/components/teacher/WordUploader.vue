<template>
  <el-dialog
    v-model="visible"
    title="Word文档导入"
    width="1100px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 上传区域 -->
    <div v-if="!parsedQuestions.length && !parsing && taskStatus !== 'failed'" class="upload-area">
      <input
        ref="fileInputRef"
        type="file"
        accept=".docx"
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="upload-drop-zone" @click="fileInputRef?.click()">
        <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
        <p class="upload-text">点击选择 .docx 文件</p>
        <p class="upload-tip">仅支持 .docx 格式，文件大小不超过 5MB</p>
      </div>
    </div>

    <!-- 解析进度 -->
    <div v-if="parsing || taskStatus === 'processing' || taskStatus === 'queued'" class="parsing-status">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span class="parsing-text">{{ parsingText }}</span>
      <el-progress
        v-if="taskStatus === 'processing'"
        :percentage="parsingProgress"
        :stroke-width="6"
        style="margin-top: 12px; max-width: 400px"
      />
    </div>

    <!-- 解析失败 -->
    <div v-if="taskStatus === 'failed'" class="parsing-status">
      <el-icon :size="24" color="#f56c6c"><CircleClose /></el-icon>
      <span class="parsing-text" style="color: #f56c6c">解析失败：{{ taskError }}</span>
      <el-button type="primary" style="margin-top: 12px" @click="resetState">重新上传</el-button>
    </div>

    <!-- 解析结果列表 -->
    <div v-if="parsedQuestions.length > 0" class="parsed-list">
      <div class="parsed-header">
        <span class="parsed-title">解析结果（{{ parsedQuestions.length }} 道试题）</span>
        <el-button type="primary" size="small" @click="resetState">重新上传</el-button>
      </div>

      <div class="parsed-cards">
        <div
          v-for="(item, idx) in parsedQuestions"
          :key="idx"
          class="question-card"
        >
          <div class="card-header">
            <span class="card-index">试题 {{ idx + 1 }}</span>
            <el-tag size="small" style="margin-left: 8px">
              {{ getQuestionTypeLabel(item.questionType) }}
            </el-tag>
            <div class="card-actions">
              <el-button type="primary" link size="small" @click="openSplitEditor(idx)">
                <el-icon><Edit /></el-icon> 分屏编辑
              </el-button>
              <el-button type="danger" link size="small" @click="removeQuestion(idx)">
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

    <!-- 分屏编辑对话框 -->
    <el-dialog
      v-model="splitEditorVisible"
      title="编辑试题"
      width="900px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
        class="edit-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题型" prop="questionType">
              <el-select v-model="editForm.questionType" placeholder="请选择题型" style="width: 100%">
                <el-option v-for="item in questionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="editForm.difficulty" placeholder="请选择难度" style="width: 100%">
                <el-option v-for="item in difficultyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学科" prop="subjectId">
              <el-select v-model="editForm.subjectId" placeholder="请选择学科" style="width: 100%" @change="handleEditSubjectChange">
                <el-option v-for="item in subjectOptions" :key="item.subjectId" :label="item.subjectName" :value="item.subjectId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教材版本">
              <el-select v-model="editForm.versionId" placeholder="请选择版本" clearable style="width: 100%" @change="handleEditVersionChange">
                <el-option v-for="item in editVersionOptions" :key="item.versionId" :label="item.versionName" :value="item.versionId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="册次">
              <el-select v-model="editForm.volumeId" placeholder="请选择册次" clearable style="width: 100%" @change="handleEditVolumeChange">
                <el-option v-for="item in editVolumeOptions" :key="item.volumeId" :label="item.volumeName" :value="item.volumeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课题">
              <el-tree-select
                v-model="editForm.topicId"
                :data="editTopicTreeOptions"
                placeholder="请选择课题"
                check-strictly
                clearable
                style="width: 100%"
                :props="{ label: 'topicName', value: 'topicId', children: 'children' }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题干内容" prop="questionContent">
          <MathEditor v-model="editForm.questionContent" :min-height="180" />
        </el-form-item>

        <!-- 选项设置（单选/多选） -->
        <template v-if="editForm.questionType === 1 || editForm.questionType === 2">
          <el-form-item label="选项设置">
            <div class="options-editor">
              <div v-for="(opt, idx) in editOptionsList" :key="idx" class="option-item">
                <span class="option-label">{{ String.fromCharCode(65 + idx) }}.</span>
                <MathEditor v-model="opt.content" :min-height="80" class="option-editor" />
                <el-button v-if="editOptionsList.length > 2" link type="danger" @click="removeEditOption(idx)">删除</el-button>
              </div>
              <el-button v-if="editOptionsList.length < 8" type="primary" link @click="addEditOption">+ 添加选项</el-button>
            </div>
          </el-form-item>
        </template>

        <!-- 判断题答案 -->
        <template v-if="editForm.questionType === 3">
          <el-form-item label="正确答案">
            <el-radio-group v-model="editForm.judgeAnswer">
              <el-radio :value="1">正确</el-radio>
              <el-radio :value="0">错误</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <el-form-item label="参考答案">
          <MathEditor v-model="editForm.answerContent" :min-height="100" />
        </el-form-item>
        <el-form-item label="答案解析">
          <MathEditor v-model="editForm.answerAnalysis" :min-height="100" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="splitEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveAndNext">
          保存并{{ hasNextQuestion ? '编辑下一题' : '关闭' }}
        </el-button>
        <el-button type="success" :loading="saving" @click="handleSaveCurrent">仅保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Loading, Edit, Delete, CircleClose } from '@element-plus/icons-vue'
import { useTeacherQuestionApi, type WordTaskStatus } from '@/composables/useTeacherQuestionApi'
import { useEducationApi } from '@/composables/useEducationApi'
import type { EducationSubject, TextbookVersion, TextbookVolume, TextbookTopic } from '@/composables/useEducationApi'
import MathEditor from '@/components/common/MathEditor.vue'
import 'katex/dist/katex.min.css'

const { parseWordAsync, getWordTaskStatus, addQuestion } = useTeacherQuestionApi()
const { getSubjectOptions, getVersionOptionsBySubject, getVolumeOptionsByVersion, getTopicTree } = useEducationApi()

// ========== Props & Emits ==========
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

// ========== 选项常量 ==========
const questionTypeOptions = [
  { value: 1, label: '单选题' },
  { value: 2, label: '多选题' },
  { value: 3, label: '判断题' },
  { value: 4, label: '填空题' },
  { value: 5, label: '简答题' },
  { value: 6, label: '计算题' }
]

const difficultyOptions = [
  { value: 1, label: '简单' },
  { value: 2, label: '中等' },
  { value: 3, label: '较难' },
  { value: 4, label: '困难' },
  { value: 5, label: '极难' }
]

// ========== 上传 & 解析状态 ==========
const fileInputRef = ref<HTMLInputElement | null>(null)
const parsing = ref(false)
const taskStatus = ref<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle')
const taskError = ref('')
const taskId = ref('')
const parsedQuestions = ref<any[]>([])
let pollTimer: ReturnType<typeof setInterval> | null = null

const parsingProgress = ref(0)

const parsingText = computed(() => {
  if (taskStatus.value === 'queued') return '任务排队中，请稍候...'
  if (taskStatus.value === 'processing') return '正在解析文档...'
  if (parsing.value) return '正在提交解析任务...'
  return '处理中...'
})

// ========== 文件选择 & 上传 ==========
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.name.endsWith('.docx')) {
    ElMessage.warning('仅支持 .docx 格式文件')
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过 5MB')
    input.value = ''
    return
  }

  submitParseTask(file)
  input.value = ''
}

async function submitParseTask(file: File) {
  parsing.value = true
  taskStatus.value = 'idle'
  taskError.value = ''
  parsedQuestions.value = []

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result: any = await parseWordAsync(formData)
    const id = result?.data?.taskId || result?.taskId || result?.data?.id || result?.id

    if (id) {
      taskId.value = id
      taskStatus.value = 'queued'
      startPolling()
    } else {
      // 同步返回结果（无 taskId）
      const data = result?.data || result
      if (Array.isArray(data)) {
        parsedQuestions.value = data
        taskStatus.value = 'completed'
      } else if (data?.questions && Array.isArray(data.questions)) {
        parsedQuestions.value = data.questions
        taskStatus.value = 'completed'
      } else {
        taskStatus.value = 'failed'
        taskError.value = '未获取到解析结果'
      }
    }
  } catch (e: any) {
    taskStatus.value = 'failed'
    taskError.value = e?.message || '提交解析任务失败'
    ElMessage.error('提交解析任务失败')
  } finally {
    parsing.value = false
  }
}

// ========== 轮询任务状态 ==========
function startPolling() {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (!taskId.value) return
    try {
      const status: WordTaskStatus = await getWordTaskStatus(taskId.value)
      taskStatus.value = status.status

      if (status.status === 'completed') {
        stopPolling()
        const data = status.data
        if (Array.isArray(data)) {
          parsedQuestions.value = data
        } else {
          parsedQuestions.value = []
          ElMessage.info('未识别到试题')
        }
      } else if (status.status === 'failed') {
        stopPolling()
        taskError.value = status.errorMessage || '解析失败'
        ElMessage.error(taskError.value)
      } else if (status.status === 'processing') {
        // 模拟进度
        parsingProgress.value = Math.min(parsingProgress.value + Math.random() * 15, 90)
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

// ========== 分屏编辑 ==========
const splitEditorVisible = ref(false)
const currentEditIndex = ref(-1)
const saving = ref(false)
const editFormRef = ref()

const editForm = ref<any>({
  questionType: 1,
  difficulty: 2,
  subjectId: undefined,
  versionId: undefined,
  volumeId: undefined,
  topicId: undefined,
  defaultScore: 1.0,
  questionContent: '',
  answerContent: '',
  answerAnalysis: '',
  sourceType: 3,
  isPublic: 1,
  judgeAnswer: undefined
})

const editOptionsList = ref<{ content: string }[]>([
  { content: '' },
  { content: '' },
  { content: '' },
  { content: '' }
])

// 级联选项
const subjectOptions = ref<EducationSubject[]>([])
const editVersionOptions = ref<TextbookVersion[]>([])
const editVolumeOptions = ref<TextbookVolume[]>([])
const editTopicTreeOptions = ref<TextbookTopic[]>([])

const editFormRules = {
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  questionContent: [{ required: true, message: '请输入题干内容', trigger: 'blur' }]
}

const hasNextQuestion = computed(() => {
  return currentEditIndex.value < parsedQuestions.value.length - 1
})

function openSplitEditor(idx: number) {
  currentEditIndex.value = idx
  const item = parsedQuestions.value[idx]

  editForm.value = {
    questionType: item.questionType || 1,
    difficulty: item.difficulty || 2,
    subjectId: item.subjectId || undefined,
    versionId: item.versionId || undefined,
    volumeId: item.volumeId || undefined,
    topicId: item.topicId || undefined,
    defaultScore: item.defaultScore || 1.0,
    questionContent: item.questionContent || '',
    answerContent: item.answerContent || '',
    answerAnalysis: item.answerAnalysis || '',
    sourceType: 3,
    isPublic: 1,
    judgeAnswer: undefined
  }

  // 判断题答案
  if (item.questionType === 3 && item.answerContent) {
    const ans = item.answerContent.trim()
    editForm.value.judgeAnswer = (ans === '正确' || ans === '1' || ans === 'true') ? 1 : 0
  }

  // 选项
  if (item.optionsJson) {
    try {
      const opts = JSON.parse(item.optionsJson)
      editOptionsList.value = opts.map((o: any) => ({ content: o.content || o.optionContent || '' }))
    } catch {
      editOptionsList.value = [{ content: '' }, { content: '' }, { content: '' }, { content: '' }]
    }
  } else if (item.questionType === 1 || item.questionType === 2) {
    editOptionsList.value = [{ content: '' }, { content: '' }, { content: '' }, { content: '' }]
  } else {
    editOptionsList.value = []
  }

  // 加载级联选项
  loadEditCascadeOptions(item)

  splitEditorVisible.value = true
}

async function loadEditCascadeOptions(item: any) {
  try {
    subjectOptions.value = await getSubjectOptions()
  } catch { subjectOptions.value = [] }

  editVersionOptions.value = []
  editVolumeOptions.value = []
  editTopicTreeOptions.value = []

  if (item.subjectId) {
    try { editVersionOptions.value = await getVersionOptionsBySubject(item.subjectId) } catch { editVersionOptions.value = [] }
  }
  if (item.versionId) {
    try { editVolumeOptions.value = await getVolumeOptionsByVersion(item.versionId) } catch { editVolumeOptions.value = [] }
  }
  if (item.volumeId) {
    try { editTopicTreeOptions.value = await getTopicTree(item.volumeId) } catch { editTopicTreeOptions.value = [] }
  }
}

// ========== 编辑表单级联 ==========
async function handleEditSubjectChange(subjectId: number) {
  editForm.value.versionId = undefined
  editForm.value.volumeId = undefined
  editForm.value.topicId = undefined
  editVersionOptions.value = []
  editVolumeOptions.value = []
  editTopicTreeOptions.value = []
  if (subjectId) {
    try { editVersionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { editVersionOptions.value = [] }
  }
}

async function handleEditVersionChange(versionId: number) {
  editForm.value.volumeId = undefined
  editForm.value.topicId = undefined
  editVolumeOptions.value = []
  editTopicTreeOptions.value = []
  if (versionId) {
    try { editVolumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { editVolumeOptions.value = [] }
  }
}

async function handleEditVolumeChange(volumeId: number) {
  editForm.value.topicId = undefined
  editTopicTreeOptions.value = []
  if (volumeId) {
    try { editTopicTreeOptions.value = await getTopicTree(volumeId) } catch { editTopicTreeOptions.value = [] }
  }
}

// ========== 选项操作 ==========
function addEditOption() {
  if (editOptionsList.value.length < 8) editOptionsList.value.push({ content: '' })
}

function removeEditOption(idx: number) {
  editOptionsList.value.splice(idx, 1)
}

// ========== 保存 ==========
async function handleSaveCurrent() {
  await saveCurrentQuestion()
}

async function handleSaveAndNext() {
  const saved = await saveCurrentQuestion()
  if (!saved) return

  if (hasNextQuestion.value) {
    // 自动打开下一题
    const nextIdx = currentEditIndex.value
    openSplitEditor(nextIdx)
  } else {
    splitEditorVisible.value = false
    if (parsedQuestions.value.length === 0) {
      ElMessage.success('所有试题已保存完毕')
    }
  }
}

async function saveCurrentQuestion(): Promise<boolean> {
  try {
    await editFormRef.value?.validate()
  } catch { return false }

  saving.value = true
  try {
    const submitData = { ...editForm.value }

    // 构建选项JSON
    if (submitData.questionType === 1 || submitData.questionType === 2) {
      submitData.optionsJson = JSON.stringify(
        editOptionsList.value.map((opt, idx) => ({
          optionKey: String.fromCharCode(65 + idx),
          content: opt.content
        }))
      )
    } else if (submitData.questionType === 3) {
      submitData.optionsJson = JSON.stringify([
        { optionKey: 'A', content: '正确' },
        { optionKey: 'B', content: '错误' }
      ])
      if (submitData.judgeAnswer !== undefined) {
        submitData.answerContent = submitData.judgeAnswer === 1 ? '正确' : '错误'
      }
    }

    delete submitData.judgeAnswer

    await addQuestion(submitData)
    ElMessage.success('试题保存成功')

    // 从列表中移除已保存的试题
    parsedQuestions.value.splice(currentEditIndex.value, 1)
    emit('saved')

    return true
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
    return false
  } finally {
    saving.value = false
  }
}

// ========== 删除试题 ==========
async function removeQuestion(idx: number) {
  try {
    await ElMessageBox.confirm('确定要删除该试题吗？', '提示', { type: 'warning' })
    parsedQuestions.value.splice(idx, 1)
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
  parsing.value = false
  taskStatus.value = 'idle'
  taskError.value = ''
  taskId.value = ''
  parsedQuestions.value = []
  parsingProgress.value = 0
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

.parsing-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px 0;
}

.parsing-text {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.parsed-list {
  max-height: 600px;
  overflow-y: auto;
}

.parsed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.parsed-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.parsed-cards {
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

/* 编辑表单 */
.edit-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.options-editor {
  width: 100%;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.option-label {
  font-weight: bold;
  min-width: 24px;
}

.option-editor {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .upload-drop-zone {
    min-height: 160px;
    padding: 16px;
  }

  .parsed-list {
    max-height: 400px;
  }

  .edit-form {
    max-height: 55vh;
  }
}
</style>
