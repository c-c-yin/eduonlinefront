<template>
  <el-dialog
    v-model="visible"
    title="拍照识题"
    width="700px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 上传区域 -->
    <div v-if="!imageUrl && !recognizing" class="upload-area">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
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
        <el-icon :size="48" color="#c0c4cc"><Camera /></el-icon>
        <p class="upload-text">点击拍照或拖拽图片到此处</p>
        <p class="upload-tip">支持 JPG / PNG / BMP 格式，文件大小不超过 10MB</p>
      </div>
    </div>

    <!-- 识别中 -->
    <div v-if="recognizing" class="status-area">
      <el-icon class="is-loading" :size="32" color="#409eff"><Loading /></el-icon>
      <p class="status-text">正在识别题目内容，请稍候...</p>
    </div>

    <!-- 图片预览 + 识别结果 -->
    <div v-if="imageUrl && !recognizing" class="result-area">
      <div class="image-preview">
        <div class="preview-header">
          <span class="preview-title">上传图片</span>
          <el-button type="primary" link size="small" @click="resetState">重新上传</el-button>
        </div>
        <div class="preview-image-wrapper">
          <img :src="imageUrl" alt="题目图片" class="preview-image" />
        </div>
      </div>

      <div v-if="ocrResult" class="recognized-result">
        <div class="result-header">
          <span class="result-title">识别结果</span>
          <el-tag size="small">{{ getQuestionTypeLabel(ocrResult.questionType) }}</el-tag>
        </div>

        <div class="result-section">
          <span class="section-label">题干：</span>
          <div class="section-html" v-html="ocrResult.questionContent || '（无内容）'"></div>
        </div>

        <div v-if="parsedOptions.length > 0" class="result-section">
          <span class="section-label">选项：</span>
          <div class="section-options">
            <div v-for="(opt, idx) in parsedOptions" :key="idx" class="option-line">
              <span class="option-key">{{ opt.optionKey || String.fromCharCode(65 + idx) }}.</span>
              <span v-html="opt.content || opt.optionContent || ''"></span>
            </div>
          </div>
        </div>

        <div v-if="ocrResult.answerContent" class="result-section">
          <span class="section-label">答案：</span>
          <div class="section-html" v-html="ocrResult.answerContent"></div>
        </div>

        <div v-if="ocrResult.answerAnalysis" class="result-section">
          <span class="section-label">解析：</span>
          <div class="section-html" v-html="ocrResult.answerAnalysis"></div>
        </div>
      </div>

      <div v-if="!ocrResult && recognizeError" class="result-error">
        <el-icon :size="20" color="#f56c6c"><CircleClose /></el-icon>
        <span style="color: #f56c6c; margin-left: 6px">识别失败：{{ recognizeError }}</span>
        <el-button type="primary" size="small" style="margin-left: 12px" @click="resetState">重新上传</el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!ocrResult"
        @click="handleApply"
      >
        填入表单
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Loading, CircleClose } from '@element-plus/icons-vue'
import { useTeacherQuestionApi } from '@/composables/useTeacherQuestionApi'

interface OcrResult {
  questionContent: string
  questionType: number
  optionsJson?: string
  answerContent?: string
  answerAnalysis?: string
}

const { recognizeQuestion } = useTeacherQuestionApi()

// ========== Props & Emits ==========
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [result: OcrResult]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

// ========== 状态 ==========
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const recognizing = ref(false)
const imageUrl = ref('')
const imageFile = ref<File | null>(null)
const ocrResult = ref<OcrResult | null>(null)
const recognizeError = ref('')

// ========== 计算属性 ==========
const parsedOptions = computed(() => {
  if (!ocrResult.value?.optionsJson) return []
  try {
    return JSON.parse(ocrResult.value.optionsJson)
  } catch {
    return []
  }
})

// ========== 文件选择 ==========
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!validateFile(file)) {
    input.value = ''
    return
  }

  setImage(file)
  input.value = ''
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!validateFile(file)) return

  setImage(file)
}

function validateFile(file: File): boolean {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 10MB')
    return false
  }
  return true
}

function setImage(file: File) {
  imageFile.value = file
  imageUrl.value = URL.createObjectURL(file)
  ocrResult.value = null
  recognizeError.value = ''
  doRecognize(file)
}

// ========== 识别 ==========
async function doRecognize(file: File) {
  recognizing.value = true
  recognizeError.value = ''
  ocrResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const res: any = await recognizeQuestion(formData)
    const data = res?.data || res

    if (data && data.questionContent) {
      ocrResult.value = {
        questionContent: data.questionContent,
        questionType: data.questionType || 1,
        optionsJson: data.optionsJson,
        answerContent: data.answerContent,
        answerAnalysis: data.answerAnalysis
      }
    } else {
      recognizeError.value = '未识别到题目内容'
      ElMessage.warning('未识别到题目内容，请重新拍照')
    }
  } catch (e: any) {
    recognizeError.value = e?.message || '识别失败'
    ElMessage.error('拍照识题失败：' + (e?.message || '未知错误'))
  } finally {
    recognizing.value = false
  }
}

// ========== 工具函数 ==========
function getQuestionTypeLabel(type: number): string {
  const map: Record<number, string> = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题' }
  return map[type] || '未知题型'
}

// ========== 填入表单 ==========
function handleApply() {
  if (!ocrResult.value) return
  emit('apply', { ...ocrResult.value })
  ElMessage.success('已填入表单，请核对并完善信息')
  visible.value = false
}

// ========== 重置 & 关闭 ==========
function resetState() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  recognizing.value = false
  imageUrl.value = ''
  imageFile.value = null
  ocrResult.value = null
  recognizeError.value = ''
  dragOver.value = false
}

function handleClose() {
  resetState()
}
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
  min-height: 220px;
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

.result-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-preview {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.preview-image-wrapper {
  padding: 12px;
  display: flex;
  justify-content: center;
  max-height: 300px;
  overflow-y: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 280px;
  border-radius: 4px;
  object-fit: contain;
}

.recognized-result {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.result-section {
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
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

.result-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px solid #fde2e2;
  border-radius: 8px;
  background: #fef0f0;
}

@media (max-width: 768px) {
  .upload-drop-zone {
    min-height: 180px;
    padding: 16px;
  }

  .preview-image-wrapper {
    max-height: 220px;
  }
}
</style>
