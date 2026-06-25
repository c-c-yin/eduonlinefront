<template>
  <div class="math-editor-wrapper">
    <div class="editor-toolbar-ext">
      <div class="toolbar-group toolbar-group-formula">
        <el-button size="small" type="primary" plain @click="openFormulaEditor">
          <span class="fx-icon">fx</span> 公式编辑器
        </el-button>
        <el-button size="small" plain @click="openSymbolPanel">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/></svg>
          符号面板
        </el-button>
        <el-dropdown trigger="click" @command="insertQuickFormula">
          <el-button size="small" plain>
            快速模板 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="formula-dropdown">
              <el-dropdown-item v-for="tpl in quickTemplates" :key="tpl.label" :command="tpl">{{ tpl.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-divider direction="vertical" style="margin:0 4px; height:20px" />
      <div class="toolbar-group toolbar-group-image">
        <input
          ref="imageFileInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="handleImageFilesSelect"
        />
        <el-button size="small" plain @click="triggerImageUpload">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          插入图片
        </el-button>
        <el-button size="small" plain @click="openImageSettings" :disabled="!selectedImageEl">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>
          图片设置
        </el-button>
      </div>
      <el-divider direction="vertical" style="margin:0 4px; height:20px" />
      <div class="toolbar-group toolbar-group-media">
        <input
          ref="videoFileInput"
          type="file"
          accept="video/*"
          style="display: none"
          @change="handleVideoFileSelect"
        />
        <input
          ref="audioFileInput"
          type="file"
          accept="audio/*"
          style="display: none"
          @change="handleAudioFileSelect"
        />
        <el-button size="small" plain @click="triggerVideoUpload">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          视频
        </el-button>
        <el-button size="small" plain @click="triggerAudioUpload">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>
          音频
        </el-button>
      </div>
    </div>

    <quill-editor
      ref="quillEditorRef"
      v-model:content="content"
      contentType="html"
      @ready="onEditorReady"
      :options="editorOptions"
      :style="styles"
      class="math-quill-editor"
    />

    <el-dialog v-model="formulaDialogVisible" title="公式编辑器" :width="isDesktop ? '850px' : '100%'" :fullscreen="!isDesktop" append-to-body destroy-on-close :close-on-click-modal="false" :class="{ 'mobile-formula-dialog': !isDesktop }">
      <div class="formula-editor-body" :class="{ 'mobile-layout': !isDesktop }">
        <div class="formula-left">
          <div class="symbol-palette-header">
            <el-radio-group v-model="symbolCategory" size="small">
              <el-radio-button v-for="cat in symbolCategories" :key="cat.key" :value="cat.key">{{ cat.label }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="symbol-palette-grid" v-show="symbolCategory !== 'templates'">
            <div class="symbol-group" v-for="group in currentSymbolGroups" :key="group.name">
              <div class="group-title">{{ group.name }}</div>
              <div class="group-symbols">
                <div
                  class="symbol-btn"
                  v-for="sym in group.symbols"
                  :key="sym.label"
                  @click="insertSymbol(sym.latex)"
                  :title="sym.label + (sym.tip ? ' - ' + sym.tip : '')"
                >
                  <span v-if="sym.html" v-html="sym.html" class="sym-display"></span>
                  <span v-else class="sym-text">{{ sym.label }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="template-palette" v-show="symbolCategory === 'templates'">
            <div class="template-group" v-for="group in formulaTemplates" :key="group.level">
              <div class="template-level-title">{{ group.level }}</div>
              <div class="template-cards">
                <div
                  class="template-card"
                  v-for="tpl in group.templates"
                  :key="tpl.label"
                  @click="applyFormulaTemplate(tpl)"
                >
                  <div class="template-name">{{ tpl.label }}</div>
                  <div class="template-example" v-html="tpl.rendered || ''"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="formula-right">
          <el-form label-width="80px" size="small">
            <el-form-item label="公式类型">
              <el-radio-group v-model="mathType">
                <el-radio value="inline">行内</el-radio>
                <el-radio value="block">块级</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="LaTeX代码">
              <el-input
                ref="latexInput"
                v-model="mathInput"
                type="textarea"
                :rows="5"
                placeholder="在此编辑LaTeX公式，也可从左侧点击符号插入"
                @input="previewMath"
              />
            </el-form-item>
            <el-form-item label="预览">
              <div class="math-preview-box" v-html="mathPreview || '<span style=\'color:#999\'>公式预览区域</span>'"></div>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="formulaDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="insertFormula">插入公式</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="imageSettingsVisible" title="图片设置" width="420px" append-to-body destroy-on-close :close-on-click-modal="false">
      <el-form label-width="80px" size="small">
        <el-form-item label="宽度">
          <el-slider v-model="imageWidth" :min="50" :max="800" :step="10" show-input style="width: 100%" />
        </el-form-item>
        <el-form-item label="旋转">
          <div class="image-rotate-controls">
            <el-button @click="rotateImageBy(-90)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.06 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11a7.906 7.906 0 00-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.93v2.02a7.935 7.935 0 003.89-1.62l-1.42-1.42c-.75.54-1.59.89-2.47 1.02zm3.89-2.42l1.42 1.41A7.906 7.906 0 0019.93 13h-2.02a5.963 5.963 0 01-1.02 2.51z"/></svg>
              左旋90°
            </el-button>
            <el-button @click="rotateImageBy(90)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8.45 5.55L13 1v3.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93v-2.02c2.84-.48 5-2.94 5-5.91s-2.16-5.43-5-5.91V10L8.45 5.55zM4.07 13a7.935 7.935 0 001.62 3.89l1.42-1.42A5.963 5.963 0 016.09 13H4.07zM11 17.93v2.02a7.935 7.935 0 01-3.89-1.62l1.42-1.42c.75.54 1.59.89 2.47 1.02zM7.11 13.51L5.69 14.9A7.906 7.906 0 004.07 11h2.02c.14.87.48 1.72 1.02 2.51z"/></svg>
              右旋90°
            </el-button>
            <el-button @click="resetImageRotation">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
              重置
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="对齐">
          <el-radio-group v-model="imageAlign" @change="applyImageAlign">
            <el-radio-button value="left">左对齐</el-radio-button>
            <el-radio-button value="center">居中</el-radio-button>
            <el-radio-button value="right">右对齐</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="imageSettingsVisible = false">关闭</el-button>
        <el-button type="primary" @click="applyImageSettings">应用</el-button>
      </template>
    </el-dialog>

    <div
      v-show="selectedImageEl && imageToolbarVisible"
      class="image-floating-toolbar"
      :style="imageToolbarStyle"
    >
      <el-button-group size="small">
        <el-button title="缩小" @click="resizeSelectedImage(-50)">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>
        </el-button>
        <el-button title="放大" @click="resizeSelectedImage(50)">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </el-button>
        <el-button title="旋转90°" @click="rotateSelectedImage">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.06 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11a7.906 7.906 0 00-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.93v2.02a7.935 7.935 0 003.89-1.62l-1.42-1.42c-.75.54-1.59.89-2.47 1.02zm3.89-2.42l1.42 1.41A7.906 7.906 0 0019.93 13h-2.02a5.963 5.963 0 01-1.02 2.51z"/></svg>
        </el-button>
        <el-button title="删除图片" type="danger" @click="deleteSelectedImage">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </el-button>
      </el-button-group>
    </div>

    <el-drawer v-model="symbolDrawerVisible" title="数学符号面板" direction="rtl" :size="isDesktop ? '420px' : '85%'" append-to-body>
      <div class="symbol-drawer-body">
        <div class="quick-search">
          <el-input v-model="symbolSearch" placeholder="搜索符号..." clearable size="small" />
        </div>
        <el-tabs v-model="symbolDrawerTab" tab-position="left">
          <el-tab-pane v-for="cat in symbolCategories" :key="cat.key" :label="cat.label" :name="cat.key">
            <div class="drawer-symbol-group" v-for="group in getSymbolGroupsByCategory(cat.key)" :key="group.name">
              <div class="drawer-group-title">{{ group.name }}</div>
              <div class="drawer-symbols">
                <div
                  class="drawer-symbol-btn"
                  v-for="sym in filterSymbols(group.symbols)"
                  :key="sym.label"
                  @click="insertSymbolToEditor(sym.latex)"
                  :title="sym.label + (sym.tip || '')"
                >
                  <span v-if="sym.html" v-html="sym.html" class="sym-display"></span>
                  <span v-else class="sym-text">{{ sym.label }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, getCurrentInstance, onBeforeUnmount } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import Quill from 'quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import axios from 'axios'
import { getToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

const Delta = Quill.import('delta')
const BlockEmbed = Quill.import('blots/block/embed')

class VideoBlot extends BlockEmbed {
  static create(value) {
    const node = super.create()
    node.setAttribute('src', value)
    node.setAttribute('controls', 'true')
    node.setAttribute('controlslist', 'nodownload')
    node.setAttribute('style', 'max-width:100%;border-radius:4px;margin:4px 0')
    node.setAttribute('preload', 'metadata')
    return node
  }
  static value(node) { return node.getAttribute('src') }
}
VideoBlot.blotName = 'video'
VideoBlot.tagName = 'video'
Quill.register(VideoBlot)

class AudioBlot extends BlockEmbed {
  static create(value) {
    const node = super.create()
    node.setAttribute('src', value)
    node.setAttribute('controls', 'true')
    node.setAttribute('controlslist', 'nodownload')
    node.setAttribute('style', 'width:100%;margin:4px 0')
    node.setAttribute('preload', 'metadata')
    return node
  }
  static value(node) { return node.getAttribute('src') }
}
AudioBlot.blotName = 'audio'
AudioBlot.tagName = 'audio'
Quill.register(AudioBlot)

const { proxy } = getCurrentInstance()

const isDesktop = ref(window.innerWidth >= 768)

const quillEditorRef = ref(null)
const latexInput = ref(null)

const uploadUrl = '/edu-user/file/upload'
const authHeaders = { Authorization: 'Bearer ' + getToken() }

const formulaDialogVisible = ref(false)
const symbolDrawerVisible = ref(false)
const mathInput = ref('')
const mathPreview = ref('')
const mathType = ref('inline')
const symbolCategory = ref('elementary')
const symbolSearch = ref('')
const symbolDrawerTab = ref('elementary')
const content = ref('')

const imageFileInput = ref(null)
const selectedImageEl = ref(null)
const imageToolbarVisible = ref(false)
const imageToolbarStyle = ref({ top: '0px', left: '0px' })
const imageSettingsVisible = ref(false)
const imageWidth = ref(300)
const imageRotation = ref(0)
const imageAlign = ref('left')
const isDraggingImage = ref(false)
const dragStartX = ref(0)
const dragStartWidth = ref(0)

const videoFileInput = ref(null)
const audioFileInput = ref(null)

const props = defineProps({
  modelValue: { type: String },
  height: { type: Number, default: null },
  minHeight: { type: Number, default: null },
  readOnly: { type: Boolean, default: false },
  type: { type: String, default: 'url' }
})

const emit = defineEmits(['update:modelValue'])

watch(() => props.modelValue, (v) => {
  if (v !== content.value) content.value = v == undefined ? '<p></p>' : v
}, { immediate: true })

watch(content, () => {
  handleTextChange()
})

function handleTextChange() {
  emit('update:modelValue', content.value)
}

const styles = computed(() => {
  let s = {}
  if (props.minHeight) s.minHeight = props.minHeight + 'px'
  if (props.height) s.height = props.height + 'px'
  return s
})

const editorOptions = ref({
  theme: 'snow',
  bounds: document.body,
  debug: 'warn',
  modules: { toolbar: false },
  placeholder: '请输入内容，支持图片、公式、符号等',
  readOnly: props.readOnly
})

const symbolCategories = [
  { key: 'elementary', label: '小学' },
  { key: 'middle', label: '初中' },
  { key: 'high', label: '高中' },
  { key: 'physics', label: '物理' },
  { key: 'chemistry', label: '化学' },
  { key: 'greek', label: '希腊字母' },
  { key: 'operators', label: '运算符' },
  { key: 'templates', label: '公式模板' }
]

const ALL_SYMBOLS = {
  elementary: [
    {
      name: '数字与运算',
      symbols: [
        { label: '+', latex: '+' },
        { label: '−', latex: '-' },
        { label: '×', latex: '\\times' },
        { label: '÷', latex: '\\div' },
        { label: '=', latex: '=' },
        { label: '≠', latex: '\\neq' },
        { label: '≈', latex: '\\approx' },
        { label: '＜', latex: '<' },
        { label: '＞', latex: '>' },
        { label: '≤', latex: '\\leq' },
        { label: '≥', latex: '\\geq' },
        { label: '( )', latex: '( )' },
      ]
    },
    {
      name: '分数与小数',
      symbols: [
        { label: '分数', latex: '\\frac{a}{b}', tip: '分数' },
        { label: '带分数', latex: 'a\\frac{b}{c}', tip: '带分数' },
        { label: '¼', latex: '\\frac{1}{4}' },
        { label: '½', latex: '\\frac{1}{2}' },
        { label: '¾', latex: '\\frac{3}{4}' },
        { label: '百分比', latex: 'a\\%', tip: '百分数' },
        { label: '小数点', latex: 'a.b', tip: '小数' },
      ]
    },
    {
      name: '几何图形',
      symbols: [
        { label: '∠', latex: '\\angle', tip: '角' },
        { label: '△', latex: '\\triangle', tip: '三角形' },
        { label: '□', latex: '\\square', tip: '正方形' },
        { label: '◯', latex: '\\bigcirc', tip: '圆' },
        { label: '⊥', latex: '\\perp', tip: '垂直' },
        { label: '∥', latex: '\\parallel', tip: '平行' },
        { label: '°', latex: '^{\\circ}', tip: '度' },
        { label: '′', latex: '{}^{\'}', tip: '分' },
        { label: '″', latex: '{}^{\'\'}', tip: '秒' },
      ]
    },
    {
      name: '单位',
      symbols: [
        { label: 'cm', latex: '\\text{cm}' },
        { label: 'm', latex: '\\text{m}' },
        { label: 'km', latex: '\\text{km}' },
        { label: 'kg', latex: '\\text{kg}' },
        { label: 'g', latex: '\\text{g}' },
        { label: 'L', latex: '\\text{L}' },
        { label: 'mL', latex: '\\text{mL}' },
        { label: 'h', latex: '\\text{h}', tip: '小时' },
        { label: 'min', latex: '\\text{min}', tip: '分钟' },
        { label: 's', latex: '\\text{s}', tip: '秒' },
        { label: '元', latex: '\\text{元}' },
      ]
    }
  ],
  middle: [
    {
      name: '代数基础',
      symbols: [
        { label: '平方', latex: 'x^{2}' },
        { label: '立方', latex: 'x^{3}' },
        { label: 'n次方', latex: 'x^{n}' },
        { label: '下标', latex: 'x_{n}' },
        { label: '平方根', latex: '\\sqrt{x}' },
        { label: '立方根', latex: '\\sqrt[3]{x}' },
        { label: '绝对值', latex: '|x|' },
        { label: '正负号', latex: '\\pm' },
        { label: '恒等于', latex: '\\equiv' },
      ]
    },
    {
      name: '函数',
      symbols: [
        { label: '一次函数', latex: 'y = kx + b' },
        { label: '二次函数', latex: 'y = ax^{2} + bx + c' },
        { label: '反比例', latex: 'y = \\frac{k}{x}' },
        { label: '指数函数', latex: 'y = a^{x}' },
        { label: '对数', latex: '\\log_{a}x' },
        { label: '正弦', latex: '\\sin \\theta' },
        { label: '余弦', latex: '\\cos \\theta' },
        { label: '正切', latex: '\\tan \\theta' },
      ]
    },
    {
      name: '几何证明',
      symbols: [
        { label: '∵', latex: '\\because', tip: '因为' },
        { label: '∴', latex: '\\therefore', tip: '所以' },
        { label: '≌', latex: '\\cong', tip: '全等' },
        { label: '∼', latex: '\\sim', tip: '相似' },
        { label: '∽', latex: '\\backsim', tip: '反向相似' },
        { label: '弧AB', latex: '\\overset{\\frown}{AB}', tip: '圆弧' },
      ]
    },
    {
      name: '统计概率',
      symbols: [
        { label: '平均数', latex: '\\bar{x}', tip: '样本均值' },
        { label: '方差', latex: 's^{2}' },
        { label: '概率', latex: 'P(A)' },
        { label: '∑', latex: '\\sum' },
        { label: '样本空间', latex: '\\Omega' },
      ]
    }
  ],
  high: [
    {
      name: '集合与逻辑',
      symbols: [
        { label: '∈', latex: '\\in' },
        { label: '∉', latex: '\\notin' },
        { label: '∋', latex: '\\ni' },
        { label: '⊂', latex: '\\subset' },
        { label: '⊃', latex: '\\supset' },
        { label: '⊆', latex: '\\subseteq' },
        { label: '∪', latex: '\\cup' },
        { label: '∩', latex: '\\cap' },
        { label: '∅', latex: '\\varnothing' },
        { label: '∀', latex: '\\forall' },
        { label: '∃', latex: '\\exists' },
        { label: '⇒', latex: '\\Rightarrow' },
        { label: '⇔', latex: '\\Leftrightarrow' },
      ]
    },
    {
      name: '实数与复数',
      symbols: [
        { label: 'R', latex: '\\mathbb{R}', tip: '实数集' },
        { label: 'N', latex: '\\mathbb{N}', tip: '自然数集' },
        { label: 'Z', latex: '\\mathbb{Z}', tip: '整数集' },
        { label: 'Q', latex: '\\mathbb{Q}', tip: '有理数集' },
        { label: 'C', latex: '\\mathbb{C}', tip: '复数集' },
      ]
    },
    {
      name: '解析几何',
      symbols: [
        { label: '向量a', latex: '\\vec{a}' },
        { label: '点积', latex: '\\vec{a} \\cdot \\vec{b}' },
        { label: '叉积', latex: '\\vec{a} \\times \\vec{b}' },
        { label: '椭圆', latex: '\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1' },
        { label: '双曲线', latex: '\\frac{x^{2}}{a^{2}}-\\frac{y^{2}}{b^{2}}=1' },
        { label: '抛物线', latex: 'y^{2}=2px' },
      ]
    },
    {
      name: '极限与导数',
      symbols: [
        { label: '极限', latex: '\\lim_{x \\to a} f(x)' },
        { label: '→∞', latex: '\\to \\infty' },
        { label: '导数', latex: "f'(x)" },
        { label: '偏导数', latex: '\\frac{\\partial f}{\\partial x}' },
        { label: '积分', latex: '\\int_{a}^{b} f(x)\\,dx' },
        { label: '定积分', latex: '\\int_{a}^{b}' },
        { label: '不定积分', latex: '\\int' },
      ]
    },
    {
      name: '数列与不等式',
      symbols: [
        { label: '求和公式', latex: '\\sum_{i=1}^{n}' },
        { label: '连乘号', latex: '\\prod_{i=1}^{n}' },
        { label: '无穷大', latex: '\\infty' },
        { label: '排列', latex: 'A_{n}^{m}' },
        { label: '组合', latex: 'C_{n}^{m}' },
      ]
    }
  ],
  physics: [
    {
      name: '力学',
      symbols: [
        { label: '牛顿定律', latex: 'F = ma' },
        { label: '重力', latex: 'G = mg' },
        { label: '速度', latex: 'v = \\frac{s}{t}' },
        { label: '加速度', latex: 'a = \\frac{\\Delta v}{\\Delta t}' },
        { label: '位移', latex: 's = v_0 t + \\frac{1}{2}at^2' },
        { label: '动量', latex: 'p = mv' },
        { label: '冲量', latex: 'I = Ft' },
        { label: '功', latex: 'W = Fs' },
        { label: '功率', latex: 'P = \\frac{W}{t}' },
        { label: '动能', latex: 'E_k = \\frac{1}{2}mv^2' },
        { label: '势能', latex: 'E_p = mgh' },
        { label: '机械能', latex: 'E = E_k + E_p' },
        { label: '胡克定律', latex: 'F = kx' },
        { label: '万有引力', latex: 'F = G\\frac{m_1 m_2}{r^2}' },
        { label: '向心力', latex: 'F = m\\frac{v^2}{r}' },
        { label: '周期', latex: 'T = \\frac{2\\pi}{\\omega}' },
      ]
    },
    {
      name: '电磁学',
      symbols: [
        { label: '库仑定律', latex: 'F = k\\frac{q_1 q_2}{r^2}' },
        { label: '电场强度', latex: 'E = \\frac{F}{q}' },
        { label: '欧姆定律', latex: 'U = IR' },
        { label: '电功率', latex: 'P = UI' },
        { label: '焦耳定律', latex: 'Q = I^2 R t' },
        { label: '磁场力', latex: 'F = BIL' },
        { label: '洛伦兹力', latex: 'F = qvB' },
        { label: '法拉第定律', latex: '\\mathcal{E} = -\\frac{d\\Phi}{dt}' },
        { label: '磁通量', latex: '\\Phi = BS' },
      ]
    },
    {
      name: '热学与光学',
      symbols: [
        { label: '热容公式', latex: 'Q = cm\\Delta t' },
        { label: '理想气体', latex: 'pV = nRT' },
        { label: '折射定律', latex: 'n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2' },
        { label: '光速', latex: 'c = \\lambda f' },
        { label: '单缝衍射', latex: 'a\\sin\\theta = k\\lambda' },
      ]
    },
    {
      name: '近代物理',
      symbols: [
        { label: '质能方程', latex: 'E = mc^2' },
        { label: '光子能量', latex: 'E = h\\nu' },
        { label: '光电效应', latex: 'E_k = h\\nu - W_0' },
        { label: '玻尔模型', latex: 'h\\nu = E_n - E_m' },
        { label: '波函数', latex: '\\psi (\\vec{r}, t)' },
        { label: '普朗克常数', latex: 'h' },
        { label: '约化普朗克', latex: '\\hbar' },
      ]
    }
  ],
  chemistry: [
    {
      name: '化学方程式',
      symbols: [
        { label: '化合反应', latex: '\\ce{A + B -> AB}' },
        { label: '分解反应', latex: '\\ce{AB -> A + B}' },
        { label: '置换反应', latex: '\\ce{A + BC -> AC + B}' },
        { label: '复分解', latex: '\\ce{AB + CD -> AD + CB}' },
        { label: '可逆反应', latex: '\\ce{A <=> B}' },
        { label: '沉淀↓', latex: '\\ce{BaSO4 v}' },
        { label: '气体↑', latex: '\\ce{H2 ^}' },
        { label: '加热Δ', latex: '\\xrightarrow{\\Delta}' },
        { label: '催化剂', latex: '\\xrightarrow{\\text{催化剂}}' },
      ]
    },
    {
      name: '常见化学式',
      symbols: [
        { label: '水', latex: '\\ce{H2O}' },
        { label: '二氧化碳', latex: '\\ce{CO2}' },
        { label: '氯化钠', latex: '\\ce{NaCl}' },
        { label: '硫酸', latex: '\\ce{H2SO4}' },
        { label: '盐酸', latex: '\\ce{HCl}' },
        { label: '氢氧化钠', latex: '\\ce{NaOH}' },
        { label: '碳酸钙', latex: '\\ce{CaCO3}' },
        { label: '高锰酸钾', latex: '\\ce{KMnO4}' },
        { label: '氧化铁', latex: '\\ce{Fe2O3}' },
      ]
    },
    {
      name: '离子与化学键',
      symbols: [
        { label: 'Na⁺', latex: '\\ce{Na+}' },
        { label: 'Cl⁻', latex: '\\ce{Cl-}' },
        { label: 'OH⁻', latex: '\\ce{OH-}' },
        { label: 'SO₄²⁻', latex: '\\ce{SO4^{2-}}' },
        { label: 'NO₃⁻', latex: '\\ce{NO3-}' },
        { label: '电子式', latex: '\\ce{:Na:Cl:}' },
        { label: 'pH值', latex: '\\text{pH}' },
      ]
    },
    {
      name: '有机化学',
      symbols: [
        { label: '甲烷', latex: '\\ce{CH4}' },
        { label: '乙烯', latex: '\\ce{C2H4}' },
        { label: '乙炔', latex: '\\ce{C2H2}' },
        { label: '苯', latex: '\\ce{C6H6}' },
        { label: '乙醇', latex: '\\ce{C2H5OH}' },
        { label: '乙酸', latex: '\\ce{CH3COOH}' },
        { label: '葡萄糖', latex: '\\ce{C6H12O6}' },
        { label: '酯化反应', latex: '\\ce{CH3COOH + C2H5OH <=>[H+] CH3COOC2H5 + H2O}' },
      ]
    }
  ],
  greek: [
    {
      name: '小写希腊字母',
      symbols: [
        { label: 'α', latex: '\\alpha' },
        { label: 'β', latex: '\\beta' },
        { label: 'γ', latex: '\\gamma' },
        { label: 'δ', latex: '\\delta' },
        { label: 'ε', latex: '\\varepsilon' },
        { label: 'ζ', latex: '\\zeta' },
        { label: 'η', latex: '\\eta' },
        { label: 'θ', latex: '\\theta' },
        { label: 'ι', latex: '\\iota' },
        { label: 'κ', latex: '\\kappa' },
        { label: 'λ', latex: '\\lambda' },
        { label: 'μ', latex: '\\mu' },
        { label: 'ν', latex: '\\nu' },
        { label: 'ξ', latex: '\\xi' },
        { label: 'ρ', latex: '\\rho' },
        { label: 'σ', latex: '\\sigma' },
        { label: 'τ', latex: '\\tau' },
        { label: 'υ', latex: '\\upsilon' },
        { label: 'φ', latex: '\\varphi' },
        { label: 'χ', latex: '\\chi' },
        { label: 'ψ', latex: '\\psi' },
        { label: 'ω', latex: '\\omega' },
      ]
    },
    {
      name: '大写希腊字母',
      symbols: [
        { label: 'Γ', latex: '\\Gamma' },
        { label: 'Δ', latex: '\\Delta' },
        { label: 'Θ', latex: '\\Theta' },
        { label: 'Λ', latex: '\\Lambda' },
        { label: 'Ξ', latex: '\\Xi' },
        { label: 'Π', latex: '\\Pi' },
        { label: 'Σ', latex: '\\Sigma' },
        { label: 'Φ', latex: '\\Phi' },
        { label: 'Ψ', latex: '\\Psi' },
        { label: 'Ω', latex: '\\Omega' },
      ]
    }
  ],
  operators: [
    {
      name: '关系符号',
      symbols: [
        { label: '≠', latex: '\\neq' },
        { label: '≈', latex: '\\approx' },
        { label: '≡', latex: '\\equiv' },
        { label: '∝', latex: '\\propto', tip: '正比于' },
        { label: '≤', latex: '\\leq' },
        { label: '≥', latex: '\\geq' },
        { label: '≪', latex: '\\ll', tip: '远小于' },
        { label: '≫', latex: '\\gg', tip: '远大于' },
        { label: '≅', latex: '\\approxeq' },
      ]
    },
    {
      name: '箭头',
      symbols: [
        { label: '→', latex: '\\to' },
        { label: '⇒', latex: '\\Rightarrow' },
        { label: '⇔', latex: '\\Leftrightarrow' },
        { label: '←', latex: '\\leftarrow' },
        { label: '⇐', latex: '\\Leftarrow' },
        { label: '⇑', latex: '\\Uparrow' },
        { label: '⇓', latex: '\\Downarrow' },
        { label: '↔', latex: '\\leftrightarrow' },
      ]
    },
    {
      name: '特殊运算符',
      symbols: [
        { label: '±', latex: '\\pm' },
        { label: '∓', latex: '\\mp', tip: '负正号' },
        { label: '·', latex: '\\cdot' },
        { label: '×', latex: '\\times' },
        { label: '÷', latex: '\\div' },
        { label: '√', latex: '\\sqrt{}' },
        { label: '∞', latex: '\\infty' },
        { label: '∇', latex: '\\nabla', tip: '梯度/Laplace算子' },
        { label: '∂', latex: '\\partial' },
        { label: '∫', latex: '\\int' },
        { label: '∮', latex: '\\oint', tip: '环路积分' },
        { label: '∬', latex: '\\iint', tip: '二重积分' },
        { label: '∭', latex: '\\iiint', tip: '三重积分' },
        { label: '∏', latex: '\\prod' },
        { label: '∑', latex: '\\sum' },
        { label: '¬', latex: '\\neg', tip: '逻辑非' },
        { label: '∧', latex: '\\land', tip: '逻辑与' },
        { label: '∨', latex: '\\lor', tip: '逻辑或' },
      ]
    },
    {
      name: '矩阵与括号',
      symbols: [
        { label: '圆括号', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { label: '方括号', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
        { label: '行列式', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
        { label: '方程', latex: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}' },
        { label: '大括号', latex: '\\begin{Bmatrix} a & b \\\\ c & d \\end{Bmatrix}' },
        { label: '花括号', latex: '\\{a, b, c\\}' },
        { label: '绝对值', latex: '|x|' },
        { label: '范数', latex: '\\lVert x \\rVert' },
        { label: '向上取整', latex: '\\lceil x \\rceil' },
        { label: '向下取整', latex: '\\lfloor x \\rfloor' },
      ]
    },
    {
      name: '特殊符号',
      symbols: [
        { label: '…', latex: '\\dots', tip: '省略号' },
        { label: '…', latex: '\\cdots', tip: '水平省略号' },
        { label: '⋮', latex: '\\vdots', tip: '垂直省略号' },
        { label: '⋱', latex: '\\ddots', tip: '对角省略号' },
        { label: '△', latex: '\\triangle' },
        { label: '□', latex: '\\square' },
        { label: '▽', latex: '\\triangledown' },
        { label: '♢', latex: '\\diamondsuit' },
        { label: '∠', latex: '\\angle' },
        { label: '⊥', latex: '\\perp' },
        { label: '∥', latex: '\\parallel' },
        { label: '°/℃/℉', latex: '^{\\circ}' },
      ]
    }
  ]
}

const ALL_TEMPLATES = [
  {
    level: '小学常用',
    templates: [
      { label: '鸡兔同笼', latex: '\\text{鸡 + 兔 = 总数}\\\\\\text{2 × 鸡 + 4 × 兔 = 脚数}' },
      { label: '行程问题', latex: 's = vt' },
      { label: '面积公式', latex: '\\begin{aligned} S_{\\square} &= a^{2} \\\\ S_{\\triangle} &= \\frac{1}{2}ah \\\\ S_{\\bigcirc} &= \\pi r^{2} \\end{aligned}' },
    ]
  },
  {
    level: '初中常用',
    templates: [
      { label: '一元二次', latex: 'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}' },
      { label: '勾股定理', latex: 'a^{2} + b^{2} = c^{2}' },
      { label: '三角形面积', latex: 'S = \\frac{1}{2}ab \\sin C' },
      { label: '三角函数', latex: '\\sin \\theta = \\frac{\\text{对边}}{\\text{斜边}}' },
    ]
  },
  {
    level: '高中常用',
    templates: [
      { label: '导数定义', latex: "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0+\\Delta x) - f(x_0)}{\\Delta x}" },
      { label: '二项式定理', latex: '(a+b)^n = \\sum_{k=0}^{n} C_n^k a^{n-k} b^k' },
      { label: '正弦定理', latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R' },
      { label: '余弦定理', latex: 'a^{2} = b^{2} + c^{2} - 2bc\\cos A' },
    ]
  },
  {
    level: '物理常用',
    templates: [
      { label: '匀变速直线运动', latex: '\\begin{cases} v = v_0 + at \\\\ s = v_0 t + \\frac{1}{2}at^{2} \\\\ v^{2} - v_0^{2} = 2as \\end{cases}' },
      { label: '动能定理', latex: 'W = \\Delta E_k = \\frac{1}{2}mv_2^{2} - \\frac{1}{2}mv_1^{2}' },
      { label: '闭合电路欧姆', latex: 'I = \\frac{E}{R+r}' },
      { label: '安培力', latex: 'F = BIL\\sin\\theta' },
    ]
  },
  {
    level: '化学常用',
    templates: [
      { label: '酸碱中和', latex: '\\ce{HCl + NaOH -> NaCl + H2O}' },
      { label: '实验室制CO₂', latex: '\\ce{CaCO3 + 2HCl -> CaCl2 + H2O + CO2 ^}' },
      { label: '铝与氢氧化钠', latex: '\\ce{2Al + 2NaOH + 2H2O -> 2NaAlO2 + 3H2 ^}' },
    ]
  }
]

const currentSymbolGroups = computed(() => {
  if (symbolCategory.value === 'templates') return []
  return ALL_SYMBOLS[symbolCategory.value] || []
})

const formulaTemplates = computed(() => {
  return ALL_TEMPLATES.map(group => ({
    level: group.level,
    templates: group.templates.map(t => {
      let rendered = ''
      try {
        rendered = katex.renderToString(t.latex, { throwOnError: false, displayMode: true })
      } catch(e) { rendered = '' }
      return { ...t, rendered }
    })
  }))
})

const quickTemplates = computed(() => {
  const list = []
  ALL_TEMPLATES.forEach(g => {
    g.templates.forEach(t => { list.push(t) })
  })
  return list
})

function getSymbolGroupsByCategory(key) {
  return ALL_SYMBOLS[key] || []
}

function filterSymbols(symbols) {
  if (!symbolSearch.value) return symbols
  const q = symbolSearch.value.toLowerCase()
  return symbols.filter(s => s.label.toLowerCase().includes(q) || (s.tip && s.tip.includes(q)) || s.latex.toLowerCase().includes(q))
}

function openFormulaEditor() {
  mathInput.value = ''
  mathPreview.value = ''
  mathType.value = 'inline'
  symbolCategory.value = 'elementary'
  formulaDialogVisible.value = true
  nextTick(() => latexInput.value?.focus())
}

function openSymbolPanel() {
  symbolDrawerVisible.value = true
  symbolSearch.value = ''
}

function insertSymbolToEditor(latex) {
  mathInput.value = latex
  previewMath()
  formulaDialogVisible.value = true
  nextTick(() => latexInput.value?.focus())
}

function insertSymbol(latex) {
  mathInput.value += latex
  previewMath()
  nextTick(() => latexInput.value?.focus())
}

function previewMath() {
  if (!mathInput.value) {
    mathPreview.value = ''
    return
  }
  try {
    mathPreview.value = katex.renderToString(mathInput.value, {
      throwOnError: false,
      displayMode: mathType.value === 'block'
    })
  } catch (e) {
    mathPreview.value = '<span style="color:red">公式语法有误，请检查</span>'
  }
}

function applyFormulaTemplate(tpl) {
  mathInput.value = tpl.latex
  previewMath()
}

function insertQuickFormula(tpl) {
  mathInput.value = tpl.latex
  previewMath()
  formulaDialogVisible.value = true
  nextTick(() => latexInput.value?.focus())
}

function insertFormula() {
  if (!mathInput.value) return

  const quill = quillEditorRef.value.getQuill()
  const range = quill.getSelection(true)
  const index = range ? range.index : 0

  const span = document.createElement('span')
  span.className = 'ql-formula'
  span.setAttribute('data-value', mathInput.value)
  span.setAttribute('contenteditable', 'false')

  try {
    span.innerHTML = katex.renderToString(mathInput.value, {
      throwOnError: false,
      displayMode: mathType.value === 'block'
    })
  } catch(e) {}

  if (mathType.value === 'block') {
    span.style.display = 'block'
    span.style.textAlign = 'center'
    span.style.margin = '8px 0'
  }

  quill.insertEmbed(index, 'formula', mathInput.value)
  quill.setSelection(index + 1)
  formulaDialogVisible.value = false
  mathInput.value = ''
}

function uploadImageAsync(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: authHeaders.Authorization }
    }).then(res => {
      if (res.data.code === 200 && res.data.data?.url) {
        resolve(res.data.data.url)
      } else {
        reject(new Error(res.data.msg || 'upload failed'))
      }
    }).catch(reject)
  })
}

function uploadAndInsertImage(file) {
  const quill = quillEditorRef.value.getQuill()
  const range = quill.getSelection(true)
  uploadImageAsync(file).then(url => {
    quill.insertEmbed(range ? range.index : 0, 'image', url)
    quill.setSelection((range ? range.index : 0) + 1)
    // 标记为Math编辑器图片，保存时processImages会跳过
    nextTick(() => {
      const imgs = quill.root.querySelectorAll('img')
      imgs.forEach(img => {
        if (img.getAttribute('src') === url) {
          img.setAttribute('data-math-image', 'true')
        }
      })
    })
  }).catch(() => {
    ElMessage.error('图片上传失败')
  })
}

function triggerImageUpload() {
  imageFileInput.value?.click()
}

function handleImageFilesSelect(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  for (const file of files) {
    uploadAndInsertImage(file)
  }
  event.target.value = ''
}

function findSelectedImage() {
  const quill = quillEditorRef.value?.getQuill()
  if (!quill) return null
  const selection = quill.getSelection()
  if (!selection) return null
  const root = quill.root
  const imgs = root.querySelectorAll('img')
  for (const img of imgs) {
    const rect = img.getBoundingClientRect()
    const editorRect = root.getBoundingClientRect()
    if (selection.index !== null) {
      const blot = quill.scroll.find(blot => {
        return blot.domNode === img
      })
      if (blot) return img
    }
  }
  const range = document.caretRangeFromPoint ? null : null
  return null
}

function showImageToolbar(img) {
  selectedImageEl.value = img
  imageToolbarVisible.value = true
  updateImageToolbarPosition()
  img.classList.add('ql-image-selected')
  const nativeWidth = img.naturalWidth || parseInt(img.getAttribute('width')) || 300
  imageWidth.value = Math.min(nativeWidth, 800)
}

function hideImageToolbar() {
  if (selectedImageEl.value) {
    selectedImageEl.value.classList.remove('ql-image-selected')
  }
  selectedImageEl.value = null
  imageToolbarVisible.value = false
}

function updateImageToolbarPosition() {
  nextTick(() => {
    if (!selectedImageEl.value) return
    const rect = selectedImageEl.value.getBoundingClientRect()
    const editorEl = quillEditorRef.value?.$el || quillEditorRef.value
    if (!editorEl) return
    const editorRect = editorEl.getBoundingClientRect()
    imageToolbarStyle.value = {
      top: Math.max(0, rect.top - editorRect.top - 40) + 'px',
      left: Math.max(0, rect.left - editorRect.left + rect.width / 2 - 80) + 'px'
    }
  })
}

function resizeSelectedImage(delta) {
  if (!selectedImageEl.value) return
  const img = selectedImageEl.value
  let currentWidth = img.width || parseInt(img.getAttribute('width')) || 300
  let newWidth = Math.max(50, Math.min(800, currentWidth + delta))
  img.width = newWidth
  img.removeAttribute('height')
  img.style.width = newWidth + 'px'
  img.style.height = 'auto'
  imageWidth.value = newWidth
  updateImageToolbarPosition()
}

function rotateSelectedImage() {
  if (!selectedImageEl.value) return
  const img = selectedImageEl.value
  const current = parseFloat(img.style.rotate || img.style.transform?.match(/rotate\(([^)]+)\)/)?.[1] || '0')
  img.style.rotate = (current + 90) + 'deg'
  imageRotation.value = current + 90
}

function deleteSelectedImage() {
  if (!selectedImageEl.value) return
  const quill = quillEditorRef.value?.getQuill()
  if (!quill) return
  const img = selectedImageEl.value
  const blot = Quill.find(img)
  if (blot) {
    const index = quill.getIndex(blot)
    quill.deleteText(index, 1)
  } else {
    img.remove()
  }
  hideImageToolbar()
}

function openImageSettings() {
  if (!selectedImageEl.value) return
  const img = selectedImageEl.value
  imageWidth.value = parseInt(img.getAttribute('width')) || img.width || 300
  const currentRotate = parseFloat(img.style.rotate || '0')
  imageRotation.value = isNaN(currentRotate) ? 0 : currentRotate
  const imgAlign = img.style.display === 'block'
    ? (img.style.marginLeft === 'auto' && img.style.marginRight === 'auto' ? 'center'
      : img.style.float === 'right' ? 'right' : 'left')
    : 'left'
  imageAlign.value = imgAlign
  imageSettingsVisible.value = true
}

function applyImageSettings() {
  if (!selectedImageEl.value) return
  const img = selectedImageEl.value
  img.width = imageWidth.value
  img.removeAttribute('height')
  img.style.width = imageWidth.value + 'px'
  img.style.height = 'auto'
  img.style.rotate = imageRotation.value + 'deg'
  applyImageAlign()
  updateImageToolbarPosition()
  imageSettingsVisible.value = false
}

function rotateImageBy(deg) {
  imageRotation.value = (imageRotation.value || 0) + deg
}

function resetImageRotation() {
  imageRotation.value = 0
}

function applyImageAlign() {
  if (!selectedImageEl.value) return
  const img = selectedImageEl.value
  if (imageAlign.value === 'center') {
    img.style.display = 'block'
    img.style.marginLeft = 'auto'
    img.style.marginRight = 'auto'
    img.style.float = 'none'
  } else if (imageAlign.value === 'right') {
    img.style.float = 'right'
    img.style.display = 'inline'
    img.style.marginLeft = 'auto'
    img.style.marginRight = '0'
  } else {
    img.style.float = 'none'
    img.style.display = 'inline'
    img.style.margin = '0'
  }
}

function handleImageDragStart(e, img) {
  isDraggingImage.value = true
  dragStartX.value = e.clientX
  dragStartWidth.value = img.width || parseInt(img.getAttribute('width')) || 300
  document.addEventListener('mousemove', handleImageDragMove)
  document.addEventListener('mouseup', handleImageDragEnd)
  e.preventDefault()
}

function handleImageDragMove(e) {
  if (!isDraggingImage.value || !selectedImageEl.value) return
  const delta = e.clientX - dragStartX.value
  const newWidth = Math.max(50, Math.min(800, dragStartWidth.value + delta))
  const img = selectedImageEl.value
  img.width = newWidth
  img.removeAttribute('height')
  img.style.width = newWidth + 'px'
  img.style.height = 'auto'
  imageWidth.value = newWidth
  updateImageToolbarPosition()
}

function handleImageDragEnd() {
  isDraggingImage.value = false
  document.removeEventListener('mousemove', handleImageDragMove)
  document.removeEventListener('mouseup', handleImageDragEnd)
}

function triggerVideoUpload() {
  videoFileInput.value?.click()
}

function triggerAudioUpload() {
  audioFileInput.value?.click()
}

function handleVideoFileSelect(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  const file = files[0]
  uploadAndInsertMedia(file, 'video')
  event.target.value = ''
}

function handleAudioFileSelect(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  const file = files[0]
  uploadAndInsertMedia(file, 'audio')
  event.target.value = ''
}

function uploadAndInsertMedia(file, type) {
  const quill = quillEditorRef.value?.getQuill()
  if (!quill) return
  const range = quill.getSelection(true)
  uploadImageAsync(file).then(url => {
    quill.insertEmbed(range ? range.index : 0, type, url)
    quill.setSelection((range ? range.index : 0) + 1)
    ElMessage.success(type === 'video' ? '视频已插入' : '音频已插入')
  }).catch(() => {
    ElMessage.error(type === 'video' ? '视频上传失败' : '音频上传失败')
  })
}

function insertProcessedHtml(html) {
  const quill = quillEditorRef.value?.getQuill()
  if (!quill) return
  const range = quill.getSelection(true)
  const index = range ? range.index : quill.getLength()
  quill.clipboard.dangerouslyPasteHTML(index, html)
  quill.setSelection(index + 1)
  nextTick(renderExistingMath)
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function ommExtractText(fragment) {
  let text = ''
  let inner = fragment
  const allT = inner.match(/<m:t[^>]*>([^]*?)<\/m:t>/gi)
  if (allT) {
    text = allT.map(m => m.replace(/<\/?m:t[^>]*>/gi, '')).join('')
  }
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/\u00d7/g, '\\times').replace(/\u00f7/g, '\\div')
    .replace(/\u03b1/g, '\\alpha').replace(/\u03b2/g, '\\beta')
    .replace(/\u03b3/g, '\\gamma').replace(/\u03b4/g, '\\delta')
    .replace(/\u03b8/g, '\\theta').replace(/\u03c0/g, '\\pi')
    .replace(/\u03c3/g, '\\sigma').replace(/\u03c9/g, '\\omega')
    .replace(/\u03bb/g, '\\lambda').replace(/\u03bc/g, '\\mu')
  return text
}

function ommToLatex(omml) {
  let result = omml

  result = result.replace(/<m:fPr>[\s\S]*?<\/m:fPr>/gi, '')

  result = result.replace(/<m:f>([\s\S]*?)<\/m:f>/gi, (m, inner) => {
    const numMatch = inner.match(/<m:num>([\s\S]*?)<\/m:num>/i)
    const denMatch = inner.match(/<m:den>([\s\S]*?)<\/m:den>/i)
    const num = numMatch ? ommExtractText(numMatch[1]) : ''
    const den = denMatch ? ommExtractText(denMatch[1]) : ''
    return `\\frac{${num}}{${den}}`
  })

  result = result.replace(/<m:rad>([\s\S]*?)<\/m:rad>/gi, (m, inner) => {
    const degMatch = inner.match(/<m:deg>([\s\S]*?)<\/m:deg>/i)
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    const e = eMatch ? ommExtractText(eMatch[1]) : ''
    if (degMatch) {
      const deg = ommExtractText(degMatch[1])
      return `\\sqrt[${deg}]{${e}}`
    }
    return `\\sqrt{${e}}`
  })

  result = result.replace(/<m:sSubSup>([\s\S]*?)<\/m:sSubSup>/gi, (m, inner) => {
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    const subMatch = inner.match(/<m:sub>([\s\S]*?)<\/m:sub>/i)
    const supMatch = inner.match(/<m:sup>([\s\S]*?)<\/m:sup>/i)
    const e = eMatch ? ommExtractText(eMatch[1]) : ''
    const sub = subMatch ? ommExtractText(subMatch[1]) : ''
    const sup = supMatch ? ommExtractText(supMatch[1]) : ''
    return `${e}_{${sub}}^{${sup}}`
  })

  result = result.replace(/<m:sSup>([\s\S]*?)<\/m:sSup>/gi, (m, inner) => {
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    const supMatch = inner.match(/<m:sup>([\s\S]*?)<\/m:sup>/i)
    const e = eMatch ? ommExtractText(eMatch[1]) : ''
    const sup = supMatch ? ommExtractText(supMatch[1]) : ''
    return `${e}^{${sup}}`
  })

  result = result.replace(/<m:sSub>([\s\S]*?)<\/m:sSub>/gi, (m, inner) => {
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    const subMatch = inner.match(/<m:sub>([\s\S]*?)<\/m:sub>/i)
    const e = eMatch ? ommExtractText(eMatch[1]) : ''
    const sub = subMatch ? ommExtractText(subMatch[1]) : ''
    return `${e}_{${sub}}`
  })

  result = result.replace(/<m:bar>([\s\S]*?)<\/m:bar>/gi, (m, inner) => {
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    return `\\bar{${eMatch ? ommExtractText(eMatch[1]) : ''}}`
  })

  result = result.replace(/<m:nary[^>]*>([\s\S]*?)<\/m:nary>/gi, (m, inner) => {
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    const subMatch = inner.match(/<m:sub>([\s\S]*?)<\/m:sub>/i)
    const supMatch = inner.match(/<m:sup>([\s\S]*?)<\/m:sup>/i)
    const e = eMatch ? ommExtractText(eMatch[1]) : ''
    const sub = subMatch ? ommExtractText(subMatch[1]) : ''
    const sup = supMatch ? ommExtractText(supMatch[1]) : ''
    if (e) return `\\sum_{${sub}}^{${sup}}{${e}}`
    return ''
  })

  result = result.replace(/<m:acc>([\s\S]*?)<\/m:acc>/gi, (m, inner) => {
    const eMatch = inner.match(/<m:e>([\s\S]*?)<\/m:e>/i)
    const accMatch = inner.match(/<m:accPr[^>]*\/?>/i)
    if (accMatch && /hat|hat/.test(accMatch[0])) {
      return `\\hat{${eMatch ? ommExtractText(eMatch[1]) : ''}}`
    }
    return eMatch ? ommExtractText(eMatch[1]) : ''
  })

  result = result.replace(/<m:eqArr>([\s\S]*?)<\/m:eqArr>/gi, (m, inner) => {
    const eMatches = inner.match(/<m:e>([\s\S]*?)<\/m:e>/gi) || []
    return eMatches.map(em => ommExtractText(em)).join(' \\\\\\\\ ')
  })

  result = result.replace(/<m:d>([\s\S]*?)<\/m:d>/gi, (m, inner) => {
    const eMatches = inner.match(/<m:e>([\s\S]*?)<\/m:e>/gi)
    const boundary = inner.match(/<m:dPr>[\s\S]*?<m:begChr[^>]*val="([^"]*)"[\s\S]*?<m:endChr[^>]*val="([^"]*)"[\s\S]*?<\/m:dPr>/i)
    const beg = boundary ? boundary[1] : '('
    const end = boundary ? boundary[2] : ')'
    const content = eMatches ? eMatches.map(em => ommExtractText(em)).join(', ') : ''
    return `${beg}${content}${end}`
  })

  result = result.replace(/<m:e>([\s\S]*?)<\/m:e>/gi, (m, inner) => ommExtractText(inner))
  result = result.replace(/<m:r[^>]*>([\s\S]*?)<\/m:r>/gi, (m, inner) => ommExtractText(inner))
  result = result.replace(/<m:t[^>]*>([^]*)<\/m:t>/gi, '$1')

  result = result.replace(/<[^>]+>/g, '')

  return result.trim()
}

function convertOMMLFormulas(html) {
  if (!/<m:oMath/i.test(html)) return html

  html = html.replace(/<m:oMathPara>([\s\S]*?)<\/m:oMathPara>/gi, (match, inner) => {
    return `<m:oMath>${inner}</m:oMath>`
  })

  html = html.replace(/<m:oMath>([\s\S]*?)<\/m:oMath>/gi, (match) => {
    const latex = ommToLatex(match)
    if (latex && latex.trim()) {
      try {
        const rendered = katex.renderToString(latex, { throwOnError: false, displayMode: false })
        return `<span class="ql-formula" data-value="${escapeHtml(latex)}" contenteditable="false">${rendered}</span>`
      } catch (e) {
        return `$${latex}$`
      }
    }
    return ''
  })

  return html
}

function handleWordFormula(html) {
  if (!html) return html

  html = html.replace(/<!--\[if gte mso.*?-->/gi, '').replace(/<!\[endif\]-->/gi, '')
  html = html.replace(/<o:p><\/o:p>/gi, '')
  html = html.replace(/<o:p>\s*<\/o:p>/gi, '')
  html = html.replace(/style="[^"]*"/gi, '')
  html = html.replace(/class="[^"]*"/gi, '')
  html = html.replace(/lang="[^"]*"/gi, '')

  html = html.replace(/<math[^>]*>([\s\S]*?)<\/math>/gi, (match) => {
    const mrowRegex = /<mrow>([\s\S]*?)<\/mrow>/gi
    let expr = match

    expr = expr.replace(/<mfrac>([\s\S]*?)<\/mfrac>/gi, (m, inner) => {
      const cleaned = inner.replace(mrowRegex, '$1')
      const parts = cleaned.split(/<mfenced|<\/mfrac|<\/mrow/i)
      const numerator = parts[0] ? parts[0].replace(/<[^>]+>/g, '').trim() : ''
      const denominator = parts[1] ? parts[1].replace(/<[^>]+>/g, '').trim() : ''
      return `\\frac{${numerator}}{${denominator}}`
    })

    expr = expr.replace(/<msqrt>([\s\S]*?)<\/msqrt>/gi, (m, inner) => {
      const baseEnd = inner.indexOf('<')
      const content = baseEnd > 0 ? inner.substring(0, baseEnd).replace(/<[^>]+>/g, '').trim() : inner.replace(/<[^>]+>/g, '').trim()
      return '\\sqrt{' + content + '}'
    })

    expr = expr.replace(/<msup>([\s\S]*?)<\/msup>/gi, (m, inner) => {
      const baseEnd = inner.indexOf('<m')
      const base2 = inner.indexOf('</m')
      const splitAt = Math.min(
        baseEnd > 0 ? baseEnd : Infinity,
        base2 > 0 ? base2 : Infinity
      )
      const base = splitAt < Infinity ? inner.substring(0, splitAt).replace(/<[^>]+>/g, '').trim() : inner.replace(/<[^>]+>/g, '').trim()
      const power = splitAt < Infinity ? inner.substring(splitAt).replace(/<[^>]+>/g, '').trim() : ''
      return `${base}^{${power}}`
    })

    expr = expr.replace(/<msub>([\s\S]*?)<\/msub>/gi, (m, inner) => {
      const baseEnd = inner.indexOf('<m')
      const base2 = inner.indexOf('</m')
      const splitAt = Math.min(
        baseEnd > 0 ? baseEnd : Infinity,
        base2 > 0 ? base2 : Infinity
      )
      const base = splitAt < Infinity ? inner.substring(0, splitAt).replace(/<[^>]+>/g, '').trim() : inner.replace(/<[^>]+>/g, '').trim()
      const sub = splitAt < Infinity ? inner.substring(splitAt).replace(/<[^>]+>/g, '').trim() : ''
      return `${base}_{${sub}}`
    })

    expr = expr.replace(/<mo[^>]*>([^<]*)<\/mo>/gi, (m, c) => {
      if (c === '\u00d7' || c === '×') return '\\times'
      if (c === '\u00f7' || c === '÷') return '\\div'
      if (c === '\u00b1' || c === '±') return '\\pm'
      if (c === '\u2260' || c === '≠') return '\\neq'
      if (c === '\u2264' || c === '≤') return '\\leq'
      if (c === '\u2265' || c === '≥') return '\\geq'
      if (c === '\u2248' || c === '≈') return '\\approx'
      if (c === '\u221e' || c === '∞') return '\\infty'
      return c
    })

    expr = expr.replace(/<mi[^>]*>([^<]*)<\/mi>/gi, '$1')
    expr = expr.replace(/<mn[^>]*>([^<]*)<\/mn>/gi, '$1')
    expr = expr.replace(mrowRegex, '$1')
    expr = expr.replace(/<[^>]+>/g, '').trim()

    if (expr) {
      try {
        const rendered = katex.renderToString(expr, { throwOnError: false, displayMode: false })
        return `<span class="ql-formula" data-value="${escapeHtml(expr)}" contenteditable="false">${rendered}</span>`
      } catch (e) {}
    }
    return ''
  })

  html = html.replace(/&#215;/g, '×').replace(/&#247;/g, '÷')
    .replace(/&#8800;/g, '≠').replace(/&#8804;/g, '≤')
    .replace(/&#8805;/g, '≥').replace(/&#8776;/g, '≈')
    .replace(/&#8730;/g, '√').replace(/&#8734;/g, '∞')
    .replace(/&#8721;/g, '∑').replace(/&#8747;/g, '∫')

  html = html.replace(/<\/?(?:o:|w:|v:|st1:)[^>]*>/gi, '')
  html = html.replace(/mso-[^:;]+[:;][^"']*/gi, '')

  return html
}

onMounted(() => {
  const onResize = () => { isDesktop.value = window.innerWidth >= 768 }
  window.addEventListener('resize', onResize)
  onBeforeUnmount(() => window.removeEventListener('resize', onResize))
})

function onEditorReady() {
  window.katex = katex
  const quill = quillEditorRef.value?.getQuill()
  if (!quill) return

  const editorEl = quillEditorRef.value.$el || quillEditorRef.value

  quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
    const html = node.outerHTML || node.innerHTML || ''
    if (html && /mso-|<o:p>|<m:oMath|<math|<w:|\/w:/i.test(html)) {
      let cleaned = convertOMMLFormulas(html)
      cleaned = handleWordFormula(cleaned)
      cleaned = cleaned.replace(/<img[^>]*src=["']file:\/\/[^"']*["'][^>]*\/?>/gi, '')
      const temp = document.createElement('div')
      temp.innerHTML = cleaned
      return quill.clipboard.convert(temp)
    }
    return delta
  })

  quill.root.addEventListener('paste', async (e) => {
    const clipboard = e.clipboardData || window.clipboardData
    if (!clipboard || !clipboard.items) return

    let hasImage = false
    for (let i = 0; i < clipboard.items.length; i++) {
      const item = clipboard.items[i]
      if (item.type.indexOf('image') !== -1) {
        hasImage = true
        e.preventDefault()
        e.stopPropagation()
        const file = item.getAsFile()
        uploadAndInsertImage(file)
        return
      }
    }

    if (hasImage) return
  }, true)

  quill.root.addEventListener('click', (e) => {
    const img = e.target.closest('img')
    if (img && quill.root.contains(img)) {
      e.stopPropagation()
      const blot = Quill.find(img)
      if (blot) {
        const index = quill.getIndex(blot)
        quill.setSelection(index, 1)
      }
      showImageToolbar(img)
      return
    }
    const formulaSpan = e.target.closest('.ql-formula')
    if (formulaSpan) return
    hideImageToolbar()
  }, true)

  quill.root.addEventListener('dblclick', (e) => {
    const img = e.target.closest('img')
    if (img && quill.root.contains(img)) {
      e.stopPropagation()
      const blot = Quill.find(img)
      if (blot) {
        const index = quill.getIndex(blot)
        quill.setSelection(index, 1)
      }
      showImageToolbar(img)
      openImageSettings()
    }
  }, true)

  nextTick(renderExistingMath)
}

function renderExistingMath() {
  nextTick(() => {
    const editorEl = quillEditorRef.value?.getQuill()?.root
    if (editorEl) {
      editorEl.querySelectorAll('.ql-formula').forEach(el => {
        const latex = el.getAttribute('data-value') || el.textContent
        try {
          el.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: false })
          el.setAttribute('data-value', latex)
        } catch(e) {}
      })
    }
  })
}
</script>

<style>
.math-editor-wrapper {
  position: relative;
}
.editor-toolbar-ext {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
  background: #f8f9fc;
  border: 1px solid #dcdfe6;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.fx-icon {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-weight: bold;
  font-size: 16px;
}
.math-quill-editor {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.math-quill-editor .ql-container {
  border-radius: 0 0 4px 4px;
  font-size: 14px;
}
.math-quill-editor .ql-editor {
  min-height: 200px;
  line-height: 1.8;
}
.math-quill-editor .ql-editor.ql-blank::before {
  color: #909399;
  font-style: normal;
  margin-left: 4px;
}

.formula-editor-body {
  display: flex;
  gap: 16px;
  height: 520px;
}
.formula-left {
  flex: 0 0 500px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
}
.formula-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.symbol-palette-header {
  margin-bottom: 12px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
  padding-bottom: 8px;
}

.symbol-group {
  margin-bottom: 16px;
}
.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  padding-left: 4px;
  border-left: 3px solid #409eff;
}
.group-symbols {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.symbol-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 36px;
  padding: 2px 8px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
  color: #303133;
}
.symbol-btn:hover {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}
.sym-display {
  line-height: 1.4;
}
.sym-text {
  font-size: 12px;
  white-space: nowrap;
}

.template-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.template-level-title {
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
}
.template-card {
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
}
.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.2);
}
.template-name {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}
.template-example {
  overflow-x: auto;
  margin-top: 4px;
}

.math-preview-box {
  min-height: 50px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  overflow-x: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-symbol-group {
  margin-bottom: 14px;
}
.drawer-group-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.drawer-symbols {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.drawer-symbol-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 32px;
  padding: 2px 6px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.drawer-symbol-btn:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.quick-search {
  margin-bottom: 10px;
}

.formula-dropdown {
  max-height: 300px;
  overflow-y: auto;
}

.math-quill-editor .ql-formula {
  display: inline-block;
  vertical-align: middle;
  padding: 2px 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  cursor: pointer;
  max-width: 100%;
  overflow-x: auto;
}
.math-quill-editor .ql-formula:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}
.math-quill-editor .ql-formula[style*="display: block"] {
  display: block !important;
  text-align: center;
  margin: 8px 0;
}

.math-quill-editor .ql-editor img.ql-image-selected {
  outline: 3px solid #409eff;
  outline-offset: 2px;
  box-shadow: 0 0 6px rgba(64, 158, 255, 0.4);
  cursor: default;
}

.math-quill-editor .ql-editor img {
  max-width: 100%;
  cursor: pointer;
  transition: outline 0.15s ease;
}

.image-floating-toolbar {
  position: absolute;
  z-index: 100;
  background: #303133;
  border-radius: 6px;
  padding: 4px 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  gap: 2px;
  pointer-events: auto;
}

.image-floating-toolbar .el-button {
  color: #fff;
  border: none;
  background: transparent;
  border-radius: 4px;
  padding: 4px 8px;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.15);
  --el-button-hover-text-color: #fff;
  --el-button-active-bg-color: rgba(255, 255, 255, 0.25);
}

.image-floating-toolbar .el-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.image-floating-toolbar .el-button.is-danger:hover {
  background: rgba(245, 108, 108, 0.8);
}

.image-rotate-controls {
  display: flex;
  gap: 8px;
}

.image-rotate-controls .el-button {
  flex: 1;
}

.math-quill-editor .ql-editor .image-resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #409eff;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  z-index: 10;
  cursor: nwse-resize;
}

.math-quill-editor .ql-editor .image-resize-handle.se {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}

.math-quill-editor .ql-editor .image-resize-handle.sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.math-quill-editor .ql-editor .image-resize-handle.ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.math-quill-editor .ql-editor .image-resize-handle.nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

@media (max-width: 768px) {
  .editor-toolbar-ext {
    gap: 4px;
    padding: 4px 6px;
  }
  .editor-toolbar-ext .el-divider {
    display: none;
  }
  .math-quill-editor .ql-editor {
    min-height: 150px;
    font-size: 14px;
  }
  .formula-editor-body.mobile-layout {
    flex-direction: column;
    height: auto;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }
  .formula-editor-body.mobile-layout .formula-left {
    flex: none;
    max-height: 300px;
    overflow-y: auto;
  }
  .formula-editor-body.mobile-layout .formula-right {
    flex: none;
  }
  .mobile-formula-dialog .el-dialog__body {
    padding: 12px;
  }
  .symbol-palette-header .el-radio-group {
    flex-wrap: wrap;
  }
  .symbol-palette-header .el-radio-button__inner {
    padding: 4px 8px;
    font-size: 12px;
  }
  .template-cards {
    grid-template-columns: 1fr;
  }
  .symbol-drawer-body .el-tabs--left {
    flex-direction: column;
  }
  .symbol-drawer-body .el-tabs--left .el-tabs__header.is-left {
    flex: none;
    width: 100%;
  }
  .symbol-drawer-body .el-tabs--left .el-tabs__nav-wrap.is-left {
    flex-direction: row;
    overflow-x: auto;
  }
  .symbol-drawer-body .el-tabs--left .el-tabs__nav-scroll {
    overflow-x: auto;
  }
}
</style>
