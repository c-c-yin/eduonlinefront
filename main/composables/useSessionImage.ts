import { useTeacherQuestionApi } from '@/composables/useTeacherQuestionApi'

/**
 * Session图片管理工具
 * 用于在保存试题时将HTML内容中的图片统一迁移到文件服务 staticimages/ 目录
 *
 * 设计思路：
 * - 互联网试题解析阶段：图片存到临时目录 web/images/（由后端 /statics/web/images/ 对外服务）
 * - 编辑器上传图片：通过 /file/upload 存到 upload/
 * - Math编辑器图片：标记 data-math-image="true"，保存时跳过
 * - 保存时：将所有图片（除Math编辑器外）统一迁移到 staticimages/
 *           最终URL为 http://{fileDomain}/statics/staticimages/...
 */
export function useSessionImage() {
  let sessionUuid: string | null = null

  const {
    createImageSession,
    uploadSessionImage,
    uploadSessionImageByUrl,
    copyImageToStatic,
    downloadDocxImage
  } = useTeacherQuestionApi()

  /**
   * 确保session存在，没有则创建
   */
  async function ensureSession(): Promise<string | null> {
    if (sessionUuid) return sessionUuid
    try {
      const res = await createImageSession() as any
      sessionUuid = res?.data?.sessionUuid || res?.sessionUuid
      return sessionUuid
    } catch (e) {
      console.error('创建图片session失败:', e)
      return null
    }
  }

  /**
   * 设置当前session（用于Word解析后的session复用）
   */
  function setSessionUuid(uuid: string): void {
    sessionUuid = uuid
  }

  /**
   * 获取当前session
   */
  function getSessionUuid(): string | null {
    return sessionUuid
  }

  /**
   * 从HTML内容中提取所有图片URL
   */
  function extractImageUrls(html: string): string[] {
    if (!html) return []
    const urls: string[] = []
    const temp = document.createElement('div')
    temp.innerHTML = html
    const imgs = temp.querySelectorAll('img')
    imgs.forEach(img => {
      const src = img.getAttribute('src')
      if (src) urls.push(src)
    })
    return urls
  }

  /**
   * 将URL转换为Blob（支持 data:、blob:、同源http/https、相对路径）
   */
  async function urlToBlob(url: string): Promise<Blob | null> {
    if (url.startsWith('data:')) {
      const parts = url.split(',')
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
      const byteString = atob(parts[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      return new Blob([ab], { type: mime })
    }
    if (url.startsWith('blob:')) {
      const response = await fetch(url)
      return await response.blob()
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          return await response.blob()
        }
      } catch (e) {
        console.warn('下载图片失败:', url, e)
      }
    }
    return null
  }

  /**
   * 判断是否已是正式目录 staticimages/ 的URL（无需再处理）
   */
  function isStaticImagesUrl(url: string): boolean {
    if (!url) return false
    return url.includes('/statics/staticimages/')
  }

  /**
   * 判断是否已是上传服务 upload/images/ 的URL（DOCX解析图片，无需再处理）
   */
  function isUploadImagesUrl(url: string): boolean {
    if (!url) return false
    return url.includes('/upload/images/')
  }

  /**
   * 判断是否为临时目录 web/images/ 的URL（互联网试题解析阶段图片）
   */
  function isWebTempImageUrl(url: string): boolean {
    if (!url) return false
    return url.includes('/statics/web/images/')
  }

  /**
   * 判断是否为Math编辑器图片（通过 data-math-image 属性标识）
   */
  function isMathEditorImage(img: Element): boolean {
    return img.getAttribute('data-math-image') === 'true'
  }

  /**
   * 上传图片到正式目录 staticimages/
   */
  async function uploadImageToSession(blob: Blob, filename: string): Promise<string> {
    const sid = await ensureSession()
    if (!sid) throw new Error('Session未创建')

    const formData = new FormData()
    formData.append('sessionUuid', sid)
    formData.append('image', blob, filename || 'image.png')

    const res = await uploadSessionImage(formData) as any
    return res?.data?.url || res?.url
  }

  /**
   * 通过URL上传图片到正式目录 staticimages/（后端代理下载，解决跨域问题）
   */
  async function uploadImageByUrlToSession(imageUrl: string): Promise<string> {
    const sid = await ensureSession()
    if (!sid) throw new Error('Session未创建')

    const res = await uploadSessionImageByUrl({
      sessionUuid: sid,
      fileUrl: imageUrl
    }) as any
    return res?.data?.url || res?.url
  }

  /**
   * 将 web/images/ 下的临时图片磁盘复制到 staticimages/
   */
  async function copyImageToStaticDirectory(imageUrl: string): Promise<string> {
    const res = await copyImageToStatic(imageUrl) as any
    return res?.data?.url || res?.url
  }

  /**
   * 判断是否为Python DOCX解析器临时图片URL
   */
  function isDocxParserImageUrl(url: string): boolean {
    if (!url) return false
    return url.includes('/images/') && !url.includes('/upload/images/') && (
      url.includes('10.255.251.111:8000') ||
      url.includes('127.0.0.1:8000') ||
      url.includes('localhost:8000') ||
      url.includes('localhost:9800')
    )
  }

  /**
   * 将Python DOCX解析器临时图片下载到 docx-parser/images/ 目录
   */
  async function downloadDocxParserImage(imageUrl: string): Promise<string> {
    const sid = sessionUuid || await ensureSession()
    if (!sid) throw new Error('Session未创建')

    const res = await downloadDocxImage({
      sessionUuid: sid,
      fileUrl: imageUrl
    }) as any
    return res?.data?.url || res?.url
  }

  /**
   * 处理HTML内容中的所有图片，统一迁移到 staticimages/ 目录并替换URL
   *
   * 处理逻辑：
   *   1. data-math-image="true"      → 跳过（Math编辑器图片）
   *   2. /statics/staticimages/      → 跳过（已在正式目录）
   *   2.5 /upload/images/            → 跳过（DOCX解析图片已处理）
   *   3. /images/ (docx-parser)      → 后端从Python服务下载到 docx-parser/images/
   *   4. /statics/web/images/        → disk copy to staticimages/
   *   5. data:/blob:/同源URL         → 上传到 staticimages/
   *   6. 跨域 http(s):// URL        → 后端代理下载到 staticimages/
   */
  async function processImages(html: string): Promise<string> {
    if (!html) return html

    const sid = await ensureSession()
    if (!sid) return html

    const temp = document.createElement('div')
    temp.innerHTML = html
    const imgs = temp.querySelectorAll('img')

    for (const img of imgs) {
      const src = img.getAttribute('src')
      if (!src) continue

      // 1. Math编辑器图片 → 跳过
      if (isMathEditorImage(img)) continue

      // 2. 已在正式目录 → 跳过
      if (isStaticImagesUrl(src)) continue

      // 2.5 已在上传服务目录 → 跳过
      if (isUploadImagesUrl(src)) continue

      try {
        // 3. DOCX解析器临时图片 → 后端从Python服务下载到 docx-parser/images/
        if (isDocxParserImageUrl(src)) {
          const newUrl = await downloadDocxParserImage(src)
          img.setAttribute('src', newUrl)
          continue
        }

        // 4. web/images/ 临时图片 → 磁盘复制到 staticimages/
        if (isWebTempImageUrl(src)) {
          const newUrl = await copyImageToStaticDirectory(src)
          img.setAttribute('src', newUrl)
          continue
        }

        // 5. 尝试blob方式上传（data:、blob:、同源URL）
        const blob = await urlToBlob(src)
        if (blob) {
          const ext = blob.type === 'image/png' ? '.png'
            : blob.type === 'image/jpeg' ? '.jpg'
            : blob.type === 'image/gif' ? '.gif'
            : blob.type === 'image/svg+xml' ? '.svg'
            : blob.type === 'image/webp' ? '.webp'
            : '.png'
          let filename = `img_${Date.now()}${ext}`
          try {
            const urlPath = new URL(src).pathname
            const urlName = urlPath.split('/').pop()
            if (urlName && urlName.includes('.')) {
              filename = urlName
            }
          } catch { /* 非完整URL，使用默认文件名 */ }
          const newUrl = await uploadImageToSession(blob, filename)
          img.setAttribute('src', newUrl)
        } else if (src.startsWith('http://') || src.startsWith('https://')) {
          // 6. blob转换失败（跨域），通过后端代理下载
          const newUrl = await uploadImageByUrlToSession(src)
          img.setAttribute('src', newUrl)
        }
      } catch (e) {
        console.warn('图片处理失败，保留原始URL:', src, e)
      }
    }

    return temp.innerHTML
  }

  /**
   * 重置session
   */
  function resetSession(): void {
    sessionUuid = null
  }

  return {
    ensureSession,
    setSessionUuid,
    getSessionUuid,
    extractImageUrls,
    processImages,
    uploadImageByUrlToSession,
    copyImageToStaticDirectory,
    downloadDocxParserImage,
    isDocxParserImageUrl,
    resetSession,
    isStaticImagesUrl,
    isUploadImagesUrl,
    isWebTempImageUrl,
    isMathEditorImage
  }
}
