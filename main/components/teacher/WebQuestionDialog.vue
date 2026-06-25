<template>
  <el-dialog
    v-model="visible"
    title="互联网试题录入"
    width="1100px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @opened="onDialogOpened"
  >
    <div class="webq-container">
      <el-row :gutter="20" style="margin-bottom: 12px">
        <el-col :span="12">
          <div class="section-title">粘贴网页内容</div>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button size="small" type="primary" plain @click="showExample">示例内容</el-button>
          <el-tooltip content="从网页复制题目内容，包括公式、图片等，直接粘贴到下方文本框" placement="top">
            <el-icon style="margin-left: 6px; cursor: help; color: #909399"><InfoFilled /></el-icon>
          </el-tooltip>
        </el-col>
      </el-row>

      <div class="paste-wrapper">
        <div
          ref="pasteAreaRef"
          class="paste-area"
          :class="{ 'is-focus': pasteFocused, 'is-drag-over': dragOver }"
          contenteditable="true"
          @focus="pasteFocused = true"
          @blur="pasteFocused = false"
          @paste="handlePaste"
          @input="onPasteInput"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="handleDrop"
        ></div>
        <div v-show="!hasContent" class="paste-placeholder-overlay" @click="focusPasteArea">
          <p>在此处粘贴从网页复制的试题内容（Ctrl+V）</p>
          <p class="tip">支持粘贴带公式、图片、表格的网页内容</p>
        </div>
      </div>

      <div v-if="imageTasks.length > 0 || processing" class="process-status">
        <div v-if="processing" class="status-item">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在解析内容...
        </div>
        <div v-for="task in imageTasks" :key="task.id" class="status-item">
          <el-icon v-if="task.status === 'uploading'" class="is-loading"><Loading /></el-icon>
          <el-icon v-else-if="task.status === 'done'" color="#67c23a"><CircleCheck /></el-icon>
          <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
          {{ task.name }} - {{ task.statusText }}
        </div>
      </div>

      <div class="section-title" style="margin-top: 16px">
        识别结果预览
        <el-tag v-if="detectedMathCount" size="small" type="success" style="margin-left: 8px">
          {{ detectedMathCount }}个公式
        </el-tag>
        <el-tag v-if="detectedImageCount" size="small" type="warning" style="margin-left: 4px">
          {{ detectedImageCount }}张图片
        </el-tag>
        <el-tag v-if="detectedOptionCount" size="small" type="info" style="margin-left: 4px">
          {{ detectedOptionCount }}个选项
        </el-tag>
      </div>

      <div class="preview-area">
        <div class="preview-content" ref="previewRef" v-html="previewHtml"></div>
      </div>

      <div style="margin-top: 12px">
        <el-alert
          title="提示：请核对预览结果，确保公式和图片识别正确后再填入表单"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="applyToForm" :disabled="!hasContent || processing">
        填入表单并继续编辑
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose, InfoFilled } from '@element-plus/icons-vue'
import { useTeacherQuestionApi } from '@/composables/useTeacherQuestionApi'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface ImageTask {
  id: number
  name: string
  url: string
  status: 'uploading' | 'done' | 'error'
  statusText: string
}

interface ProcessedContent {
  questionContent: string
  questionContentText: string
  questionType: number | null
  sourceType: number
}

const {
  uploadTempImage,
  uploadTempImageByUrl,
  createImageSession
} = useTeacherQuestionApi()

const props = defineProps<{
  modelValue: boolean
  sessionUuid: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [result: any]
}>()

const pasteAreaRef = ref<HTMLDivElement | null>(null)
const previewRef = ref<HTMLDivElement | null>(null)
const pasteFocused = ref(false)
const dragOver = ref(false)
const hasContent = ref(false)
const processing = ref(false)
const previewHtml = ref('')
const rawHtml = ref('')
const processedContent = ref<ProcessedContent | null>(null)
const imageTasks = ref<ImageTask[]>([])
const detectedMathCount = ref(0)
const detectedImageCount = ref(0)
const detectedOptionCount = ref(0)
const detectedQuestionType = ref<number | null>(null)

const internalSessionUuid = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

watch(visible, (v) => {
  if (!v) {
    resetState()
  }
})

function resetState() {
  hasContent.value = false
  processing.value = false
  previewHtml.value = ''
  rawHtml.value = ''
  processedContent.value = null
  imageTasks.value = []
  detectedMathCount.value = 0
  detectedImageCount.value = 0
  detectedOptionCount.value = 0
  detectedQuestionType.value = null
  if (pasteAreaRef.value) {
    pasteAreaRef.value.innerHTML = ''
  }
}

function onDialogOpened() {
  resetState()
  nextTick(() => {
    pasteAreaRef.value?.focus()
  })
}

function onPasteInput() {
  const el = pasteAreaRef.value
  if (!el) return
  const text = (el.textContent || '').trim()
  const hasImg = el.querySelector('img') !== null
  hasContent.value = text.length > 0 || hasImg
}

function focusPasteArea() {
  pasteAreaRef.value?.focus()
}

function showExample() {
  const example = `
    <p><strong>【例题】</strong>已知函数 $f(x) = x^2 - 2x + 3$，求：</p>
    <p>（1）$f(x)$ 的最小值；</p>
    <p>（2）不等式 $f(x) \\leq 6$ 的解集。</p>
    <p><img src="https://example.com/formula.png" alt="函数图像"></p>
    <p>A. $x \\in [-1, 3]$ &nbsp;&nbsp; B. $x \\in [0, 2]$</p>
    <p>C. $x \\in [1, 4]$ &nbsp;&nbsp; D. $x \\in [-2, 1]$</p>
  `
  if (pasteAreaRef.value) {
    pasteAreaRef.value.innerHTML = example
  }
  hasContent.value = true
  processContent()
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function uploadImage(blob: Blob, name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('sessionUuid', internalSessionUuid.value)
    formData.append('image', blob, name)
    uploadTempImage(formData).then((res: any) => {
      if (res.code === 200) {
        const url = res.data?.url
        if (url) {
          resolve(url)
        } else {
          reject(new Error(res.msg || 'upload failed'))
        }
      } else {
        reject(new Error(res.msg || 'upload failed'))
      }
    }).catch(reject)
  })
}

function uploadImageByUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uploadTempImageByUrl({
      sessionUuid: internalSessionUuid.value,
      fileUrl: imageUrl
    }).then((res: any) => {
      if (res.code === 200) {
        const url = res.data?.url
        if (url) {
          resolve(url)
        } else {
          reject(new Error(res.msg || 'uploadByUrl failed'))
        }
      } else {
        reject(new Error(res.msg || 'uploadByUrl failed'))
      }
    }).catch(reject)
  })
}

async function ensureSession(): Promise<string | null> {
  if (props.sessionUuid) {
    internalSessionUuid.value = props.sessionUuid
    return props.sessionUuid
  }
  if (internalSessionUuid.value) return internalSessionUuid.value
  try {
    const res: any = await createImageSession()
    internalSessionUuid.value = res.data?.sessionUuid || res.sessionUuid
    return internalSessionUuid.value
  } catch (e) {
    console.error('创建图片session失败:', e)
    return null
  }
}

function convertMathJaxToLatex(html: string): string {
  let result = html

  result = result.replace(/<script[^>]*type=["']math\/tex[^>]*>([\s\S]*?)<\/script>/gi, (_m: string, content: string) => {
    content = content.replace(/\\begin\{aligned\}/g, '\\begin{aligned}').replace(/\\end\{aligned\}/g, '\\end{aligned}')
    return `$$${content}$$`
  })

  result = result.replace(/<script[^>]*type=["']math\/mml[^>]*>([\s\S]*?)<\/script>/gi, (_m: string, content: string) => {
    const latex = mmlToLatex(content)
    return latex ? `$$${latex}$$` : ''
  })

  result = result.replace(/<math[^>]*>([\s\S]*?)<\/math>/gi, (_m: string, content: string) => {
    const latex = mmlToLatex(content)
    return latex ? `$$${latex}$$` : ''
  })

  result = result.replace(/<span[^>]*class=["'][^"']*MathJax[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '$1')

  return result
}

function mmlToLatex(mml: string): string {
  let result = mml

  result = result
    .replace(/<mi[^>]*>([^<]*)<\/mi>/gi, '$1')
    .replace(/<mn[^>]*>([^<]*)<\/mn>/gi, '$1')
    .replace(/<mo[^>]*>([^<]*)<\/mo>/gi, (_m: string, c: string) => {
      const map: Record<string, string> = {
        '×': '\\times', '÷': '\\div', '±': '\\pm', '≠': '\\neq',
        '≤': '\\leq', '≥': '\\geq', '≈': '\\approx', '∞': '\\infty',
        '→': '\\to', '⇒': '\\Rightarrow', '∑': '\\sum', '∫': '\\int',
        '∂': '\\partial', '√': '\\sqrt{}'
      }
      return map[c] || c
    })

  result = result
    .replace(/<mfrac>([\s\S]*?)<\/mfrac>/gi, (_m: string, inner: string) => {
      const parts = inner.split(/<mrow>|<mfrac|<\/mfrac|<\/mrow/i)
      const num = (parts[0] || '').replace(/<[^>]+>/g, '').trim()
      const den = (parts[1] || '').replace(/<[^>]+>/g, '').trim()
      return `\\frac{${num}}{${den}}`
    })
    .replace(/<msqrt>([\s\S]*?)<\/msqrt>/gi, (_m: string, inner: string) => `\\sqrt{${inner.replace(/<[^>]+>/g, '').trim()}}`)
    .replace(/<msup>([\s\S]*?)<\/msup>/gi, (_m: string, inner: string) => {
      const cleaned = inner.replace(/<[^>]+>/g, '').trim()
      const parts = cleaned.split(/(\d+)/)
      return parts.length >= 2 ? `${parts[0]}^{${parts[1]}}` : cleaned
    })
    .replace(/<msub>([\s\S]*?)<\/msub>/gi, (_m: string, inner: string) => {
      const cleaned = inner.replace(/<[^>]+>/g, '').trim()
      const parts = cleaned.split(/(\d+)/)
      return parts.length >= 2 ? `${parts[0]}_{${parts[1]}}` : cleaned
    })
    .replace(/<mover[^>]*>([\s\S]*?)<\/mover>/gi, (m: string) => {
      const accent = m.match(/<mo[^>]*>(.)</gi)
      const hasArrow = m.includes('&#x2192;') || m.includes('\u2192')
      if (hasArrow) return '\\vec{...}'
      if (accent) {
        const ch = accent[0].match(/>([^<]+)</)
        if (ch) {
          if (ch[1] === '\u00af' || ch[1] === '¯') return '\\bar{...}'
        }
      }
      return m.replace(/<[^>]+>/g, '').trim()
    })
    .replace(/<mrow>([\s\S]*?)<\/mrow>/gi, '$1')
    .replace(/<mfenced>([\s\S]*?)<\/mfenced>/gi, '($1)')

  result = result.replace(/<[^>]+>/g, '')
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_m: string, hex: string) => {
    const cp = parseInt(hex, 16)
    if (cp === 0x2192) return '\\to'
    if (cp === 0x21d2) return '\\Rightarrow'
    return String.fromCodePoint(cp)
  })

  const trim = result.trim()
  return trim.length > 0 && trim.length < 200 ? trim : ''
}

function detectAndRenderFormulas(html: string): string {
  let result = html
  let mathCount = 0

  result = result.replace(/\$\$([^$]*)\$\$/g, (_match: string, latex: string) => {
    mathCount++
    try {
      const rendered = katex.renderToString(latex.trim(), { throwOnError: false, displayMode: true })
      return `<div style="text-align:center;margin:8px 0">${rendered}</div>`
    } catch (_e) {
      return `<code>$$${latex.trim()}$$</code>`
    }
  })

  result = result.replace(/\$([^$]+?)\$/g, (_match: string, latex: string) => {
    mathCount++
    try {
      const rendered = katex.renderToString(latex.trim(), { throwOnError: false, displayMode: false })
      return rendered
    } catch (_e) {
      return `<code>$${latex.trim()}$</code>`
    }
  })

  result = result.replace(/\\ce\{([^}]+)\}/g, (_match: string, content: string) => {
    mathCount++
    return `<code class="chem-formula">${escapeHtml(content)}</code>`
  })

  detectedMathCount.value = mathCount
  return result
}

function convertSpecialChars(html: string): string {
  return html
    .replace(/&#215;/g, '×').replace(/&#247;/g, '÷')
    .replace(/&#8800;/g, '≠').replace(/&#8804;/g, '≤')
    .replace(/&#8805;/g, '≥').replace(/&#8776;/g, '≈')
    .replace(/&#8730;/g, '√').replace(/&#8734;/g, '∞')
    .replace(/&#8721;/g, '∑').replace(/&#8747;/g, '∫')
    .replace(/&#916;/g, 'Δ').replace(/&#928;/g, 'Π')
    .replace(/&#931;/g, 'Σ').replace(/&#937;/g, 'Ω')
    .replace(/&#945;/g, 'α').replace(/&#946;/g, 'β')
    .replace(/&#947;/g, 'γ').replace(/&#948;/g, 'δ')
    .replace(/&#952;/g, 'θ').replace(/&#955;/g, 'λ')
    .replace(/&#956;/g, 'μ').replace(/&#960;/g, 'π')
    .replace(/&#961;/g, 'ρ').replace(/&#963;/g, 'σ')
    .replace(/&#966;/g, 'φ').replace(/&#969;/g, 'ω')
    .replace(/&alpha;/g, 'α').replace(/&beta;/g, 'β')
    .replace(/&gamma;/g, 'γ').replace(/&delta;/g, 'δ')
    .replace(/&theta;/g, 'θ').replace(/&lambda;/g, 'λ')
    .replace(/&mu;/g, 'μ').replace(/&pi;/g, 'π')
    .replace(/&rho;/g, 'ρ').replace(/&sigma;/g, 'σ')
    .replace(/&phi;/g, 'φ').replace(/&omega;/g, 'ω')
}

function detectQuestionOptions(html: string): void {
  const div = document.createElement('div')
  div.innerHTML = html
  const text = div.textContent || ''

  const optionPatterns = [
    /[A-D][\.\s、：:)]+/g,
    /[①②③④⑤⑥⑦⑧]/g,
    /选项[：:]/g,
  ]

  let optionCount = 0
  optionPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) optionCount += matches.length
  })

  detectedOptionCount.value = optionCount

  if (optionCount >= 4) {
    detectedQuestionType.value = 2
  } else if (optionCount >= 2) {
    detectedQuestionType.value = 1
  }
}

function normalizeHtmlForQuill(html: string): string {
  const doc = document.createElement('div')
  doc.innerHTML = html

  const fragment = document.createDocumentFragment()
  const nodes = Array.from(doc.childNodes)

  for (let i = 0; i < nodes.length; i++) {
    flattenNode(nodes[i], fragment)
    if (i < nodes.length - 1) {
      const last = fragment.lastChild
      if (last && last.nodeType === Node.TEXT_NODE && !(last.textContent || '').endsWith(' ')) {
        last.textContent += ' '
      }
    }
  }

  doc.innerHTML = ''
  doc.appendChild(fragment)
  const normalized = doc.innerHTML
  return '<p>' + (normalized || '&nbsp;') + '</p>'
}

function flattenNode(node: Node, target: Node): void {
  const blockTags = new Set([
    'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR',
    'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'ASIDE',
    'BLOCKQUOTE', 'PRE', 'HR', 'UL', 'OL', 'DL', 'DT', 'DD',
    'FIGURE', 'FIGCAPTION', 'FORM', 'FIELDSET', 'TABLE', 'THEAD',
    'TBODY', 'TFOOT', 'COLGROUP', 'ADDRESS', 'DETAILS', 'SUMMARY', 'DIALOG'
  ])

  if (!node) return

  if (node.nodeType === Node.TEXT_NODE) {
    let text = node.textContent || ''
    text = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').replace(/\t/g, ' ')
    if (text.length > 0) {
      target.appendChild(document.createTextNode(text))
    }
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const element = node as Element
  const tagName = element.tagName

  if (tagName === 'BR') {
    target.appendChild(document.createTextNode(' '))
    return
  }

  if (tagName === 'IMG') {
    target.appendChild(node.cloneNode(true))
    return
  }

  if (blockTags.has(tagName)) {
    const children = Array.from(node.childNodes)
    for (let i = 0; i < children.length; i++) {
      flattenNode(children[i], target)
    }
    const last = target.lastChild
    if (last && last.nodeType === Node.TEXT_NODE) {
      last.textContent = (last.textContent || '').replace(/\s+$/, '') + ' '
    }
    return
  }

  const inline = node.cloneNode(false)
  const children = Array.from(node.childNodes)
  for (const child of children) {
    flattenNode(child, inline)
  }
  target.appendChild(inline)
}

async function processContent(): Promise<void> {
  if (processing.value) return
  processing.value = true
  imageTasks.value = []
  detectedMathCount.value = 0
  detectedImageCount.value = 0
  detectedOptionCount.value = 0

  try {
    await ensureSession()

    const pasteArea = pasteAreaRef.value
    if (!pasteArea) return

    let html = pasteArea.innerHTML
    rawHtml.value = html

    html = convertSpecialChars(html)

    html = convertMathJaxToLatex(html)

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    const images = tempDiv.querySelectorAll('img')

    detectedImageCount.value = images.length
    console.log(`[WebQ] processContent检测到 ${images.length} 张图片`)

    if (images.length > 0) {
      imageTasks.value = Array.from(images).map((img, idx) => ({
        id: idx,
        name: `图片${idx + 1}`,
        url: img.src,
        status: 'uploading' as const,
        statusText: '上传中...'
      }))

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const task = imageTasks.value[i]

        const lazySrc = img.getAttribute('data-src')
          || img.getAttribute('data-original-src')
          || img.getAttribute('data-original')
          || img.getAttribute('data-lazy-src')
          || img.getAttribute('data-url')
          || img.getAttribute('data-image')
          || img.getAttribute('data-background')

        const srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset')
        let srcsetUrl: string | null = null
        if (srcset) {
          const firstEntry = srcset.split(',')[0].trim()
          srcsetUrl = firstEntry.split(/\s+/)[0]
        }

        const realSrc = lazySrc || srcsetUrl || img.src

        console.log(`[WebQ] 图片${i + 1}: lazySrc=${lazySrc}, srcsetUrl=${srcsetUrl}, img.src=${img.src}, realSrc=${realSrc}`)

        try {
          if (realSrc.startsWith('data:')) {
            const res = await fetch(realSrc)
            const blob = await res.blob()
            const url = await uploadImage(blob, `web_image_${i + 1}.png`)
            img.setAttribute('data-original-src', realSrc)
            img.removeAttribute('data-src')
            img.removeAttribute('data-lazy-src')
            img.src = url
            task.status = 'done'
            task.statusText = '上传完成'
          } else if (realSrc.startsWith('http://') || realSrc.startsWith('https://')) {
            try {
              const url = await uploadImageByUrl(realSrc)
              img.setAttribute('data-original-src', realSrc)
              img.removeAttribute('data-src')
              img.removeAttribute('data-lazy-src')
              img.src = url
              task.status = 'done'
              task.statusText = '上传完成'
            } catch (_e) {
              console.warn(`[WebQ] 图片${i + 1} 下载失败:`, _e)
              task.status = 'done'
              task.statusText = '保留原地址'
            }
          } else if (realSrc.startsWith('//')) {
            const resolvedUrl = window.location.protocol + realSrc
            try {
              const url = await uploadImageByUrl(resolvedUrl)
              img.setAttribute('data-original-src', realSrc)
              img.removeAttribute('data-src')
              img.removeAttribute('data-lazy-src')
              img.src = url
              task.status = 'done'
              task.statusText = '上传完成'
            } catch (_e) {
              console.warn(`[WebQ] 图片${i + 1} 协议相对URL下载失败:`, _e)
              task.status = 'done'
              task.statusText = '保留原地址'
            }
          } else if (realSrc.startsWith('/')) {
            const resolvedUrl = window.location.origin + realSrc
            try {
              const url = await uploadImageByUrl(resolvedUrl)
              img.setAttribute('data-original-src', realSrc)
              img.removeAttribute('data-src')
              img.removeAttribute('data-lazy-src')
              img.src = url
              task.status = 'done'
              task.statusText = '上传完成'
            } catch (_e) {
              console.warn(`[WebQ] 图片${i + 1} 同源URL下载失败:`, _e)
              task.status = 'done'
              task.statusText = '保留原地址'
            }
          } else if (realSrc && realSrc.length > 0) {
            try {
              const resolvedUrl = new URL(realSrc, window.location.href).href
              if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
                const url = await uploadImageByUrl(resolvedUrl)
                img.setAttribute('data-original-src', realSrc)
                img.src = url
                task.status = 'done'
                task.statusText = '上传完成'
              } else {
                task.status = 'done'
                task.statusText = '无法下载'
              }
            } catch (_e) {
              console.warn(`[WebQ] 图片${i + 1} 相对URL下载失败:`, _e)
              task.status = 'done'
              task.statusText = '无法下载'
            }
          } else {
            task.status = 'done'
            task.statusText = '无图片地址'
          }
        } catch (_e) {
          console.warn(`[WebQ] 图片${i + 1} 处理异常:`, _e)
          task.status = 'done'
          task.statusText = '处理失败'
        }
      }

      html = tempDiv.innerHTML
    }

    html = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript/gi, '')

    const formContentHtml = normalizeHtmlForQuill(html)

    html = detectAndRenderFormulas(html)

    detectQuestionOptions(html)

    previewHtml.value = html

    processedContent.value = {
      questionContent: formContentHtml,
      questionContentText: (tempDiv.textContent || tempDiv.innerText || '').trim().substring(0, 1000),
      questionType: detectedQuestionType.value,
      sourceType: 4
    }

    nextTick(() => {
      const preview = previewRef.value
      if (preview) {
        preview.querySelectorAll('code.chem-formula').forEach((el) => {
          ;(el as HTMLElement).style.cssText = 'font-family:monospace;background:#f0f9eb;padding:2px 6px;border-radius:3px;display:inline-block'
        })
      }
    })

  } catch (e: any) {
    ElMessage.error('内容处理出错: ' + (e.message || '未知错误'))
    console.error('WebQuestionDialog process error:', e)
  } finally {
    processing.value = false
  }
}

async function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  e.stopPropagation()

  const clipboard = e.clipboardData
  if (!clipboard || !clipboard.items) return

  const types = Array.from(clipboard.items).map(item => item.type)
  console.log('[WebQ] 剪贴板类型:', types)

  const htmlItem = Array.from(clipboard.items).find(item => item.type === 'text/html')
  const textItem = Array.from(clipboard.items).find(item => item.type === 'text/plain')

  let hasHtmlPasted = false

  if (htmlItem) {
    hasHtmlPasted = true
    htmlItem.getAsString(async (htmlStr: string) => {
      console.log('[WebQ] 粘贴HTML长度:', htmlStr.length)
      const imgTagCount = (htmlStr.match(/<img[\s>]/gi) || []).length
      console.log('[WebQ] HTML中img标签数:', imgTagCount)

      if (pasteAreaRef.value) {
        pasteAreaRef.value.innerHTML = htmlStr
      }
      hasContent.value = true
      await nextTick()

      const domImgCount = pasteAreaRef.value?.querySelectorAll('img').length || 0
      console.log('[WebQ] DOM中实际img数量:', domImgCount)

      processContent()
    })
  } else if (textItem) {
    hasHtmlPasted = true
    textItem.getAsString(async (textStr: string) => {
      if (pasteAreaRef.value) {
        pasteAreaRef.value.innerHTML = textStr.replace(/\n/g, '<br>')
      }
      hasContent.value = true
      await nextTick()
      processContent()
    })
  }

  setTimeout(async () => {
    const items = e.clipboardData?.items
    if (items) {
      let hasImageFile = false
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (!file) continue
          hasImageFile = true
          const url = await uploadImage(file, file.name || 'pasted_image.png')
          if (pasteAreaRef.value) {
            pasteAreaRef.value.innerHTML += `<br><img src="${url}" style="max-width:100%">`
          }
          hasContent.value = true
        }
      }
      if (hasImageFile && !hasHtmlPasted) {
        processContent()
      }
    }
  }, 100)
}

async function handleDrop(e: DragEvent) {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  let hasImage = false
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      hasImage = true
      processing.value = true
      try {
        const url = await uploadImage(file, file.name)
        if (pasteAreaRef.value) {
          pasteAreaRef.value.innerHTML += `<br><img src="${url}" style="max-width:100%">`
        }
        hasContent.value = true
      } catch (_e) {
        ElMessage.error('图片上传失败: ' + file.name)
      }
      processing.value = false
    }
  }

  if (hasContent.value) {
    processContent()
  }
}

function applyToForm() {
  if (!hasContent.value || processing.value) return

  const pasteArea = pasteAreaRef.value
  if (!pasteArea) return
  const rawText = pasteArea.textContent || pasteArea.innerText || ''

  const result: any = {
    questionContent: processedContent.value?.questionContent || rawHtml.value || pasteArea.innerHTML,
    questionContentText: rawText.trim().substring(0, 1000),
    questionType: processedContent.value?.questionType || null,
    sourceType: 4
  }

  if (detectedOptionCount.value >= 2) {
    const optionLines = rawText.split(/\n/).filter((line: string) => /^[A-D][\.\s、：:)]+/.test(line.trim()))
    if (optionLines.length >= 2) {
      const options = optionLines.map((line: string) => ({
        content: line.trim().replace(/^[A-D][\.\s、：:)]+\s*/, '')
      }))
      result.optionsJson = options
    }
  }

  ElMessage.success('题目内容已填入表单，请核对并保存')
  emit('apply', result)
  visible.value = false
}
</script>

<style scoped>
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.paste-wrapper {
  position: relative;
}

.paste-area {
  min-height: 200px;
  max-height: 360px;
  overflow-y: auto;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: border-color 0.3s, background 0.3s;
  outline: none;
  cursor: text;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.8;
  position: relative;
  z-index: 1;
}

.paste-area:hover {
  border-color: #b3d8ff;
  background: #f5f7fa;
}

.paste-area.is-focus {
  border-color: #409eff;
  border-style: solid;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.paste-area.is-focus + .paste-placeholder-overlay {
  opacity: 0;
  pointer-events: none;
}

.paste-area.is-drag-over {
  border-color: #67c23a;
  background: #f0f9eb;
  border-style: solid;
}

.paste-placeholder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  pointer-events: auto;
  cursor: text;
  z-index: 0;
  border-radius: 8px;
}

.paste-placeholder-overlay p {
  margin: 6px 0 0;
  font-size: 14px;
}

.paste-placeholder-overlay .tip {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.paste-area :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 4px 0;
}

.paste-area :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}

.paste-area :deep(td),
.paste-area :deep(th) {
  border: 1px solid #dcdfe6;
  padding: 6px 10px;
}

.process-status {
  margin-top: 10px;
  padding: 8px 12px;
  background: #f8f9fc;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 3px 0;
}

.preview-area {
  margin-top: 6px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
  background: #fff;
  min-height: 150px;
  max-height: 400px;
  overflow-y: auto;
}

.preview-content {
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
}

.preview-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.preview-content :deep(.katex) {
  font-size: 1.1em;
}

.webq-container {
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .paste-area {
    min-height: 160px;
    max-height: 280px;
    padding: 12px;
    font-size: 13px;
  }
  .preview-area {
    max-height: 280px;
    padding: 12px;
  }
}
</style>
