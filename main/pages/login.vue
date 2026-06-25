<template>
  <div class="login-page">
    <div class="login-left">
      <div class="brand-area">
        <div class="brand-header">
          <img :src="logo" :alt="title" class="brand-logo" />
          <h1 class="brand-title">{{ title }}</h1>
        </div>
        <p class="brand-slogan">{{ slogan }}</p>
      </div>

      <div class="left-carousel" v-if="loginBanners.length > 0">
        <el-carousel height="240px" :interval="5000" arrow="hover">
          <el-carousel-item v-for="banner in loginBanners" :key="banner.bannerId">
            <img :src="banner.bannerImage" :alt="banner.bannerTitle" class="carousel-img" />
          </el-carousel-item>
        </el-carousel>
      </div>

      <div class="platform-stats" v-if="showStats">
        <div class="stat-item">
          <el-icon><VideoCamera /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(platformStats.courseCount) }}+</span>
            <span class="stat-label">课程视频</span>
          </div>
        </div>
        <div class="stat-item">
          <el-icon><Edit /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(platformStats.questionCount) }}+</span>
            <span class="stat-label">试题资源</span>
          </div>
        </div>
        <div class="stat-item">
          <el-icon><User /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(platformStats.teacherCount ?? 0) }}+</span>
            <span class="stat-label">教师</span>
          </div>
        </div>
        <div class="stat-item">
          <el-icon><Reading /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(platformStats.studentCount ?? 0) }}+</span>
            <span class="stat-label">学生</span>
          </div>
        </div>
      </div>

      <div class="left-footer">
        <p>{{ copyright }}</p>
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">
        <div class="login-header">
          <h2 class="login-title">欢迎登录</h2>
          <p class="login-subtitle">{{ title }}</p>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="userType">
            <div class="user-type-tabs">
              <div
                :class="['type-tab', { active: loginForm.userType === 'teacher' }]"
                @click="loginForm.userType = 'teacher'"
              >
                <el-icon><User /></el-icon>
                <span>教师登录</span>
              </div>
              <div
                :class="['type-tab', { active: loginForm.userType === 'student' }]"
                @click="loginForm.userType = 'student'"
              >
                <el-icon><Reading /></el-icon>
                <span>学生登录</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item prop="code" v-if="captchaEnabled">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码"
                prefix-icon="Picture"
                size="large"
                class="captcha-input"
                @keyup.enter="handleLogin"
              />
              <img
                :src="captchaUrl"
                alt="验证码"
                class="captcha-image"
                @click="refreshCaptcha"
              />
            </div>
          </el-form-item>

          <el-form-item>
            <div class="login-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera, Edit, User, Reading } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Banner } from '@/types'
import { usePortalApi } from '@/composables/usePortalApi'
import { formatNumber } from '@/utils/format'
import { get } from '@/utils/request'

definePageMeta({
  layout: false,
  middleware: ['guest'],
  ssr: false
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const { getBannersByCode } = usePortalApi()

const logo = computed(() => appStore.logo)
const title = computed(() => appStore.title)
const slogan = computed(() => appStore.slogan)
const copyright = computed(() => appStore.copyright)
const platformStats = computed(() => appStore.platformStats)
const showStats = computed(() => appStore.globalConfig['login.show_stats'] !== 'false')

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)
const captchaEnabled = ref(true)
const captchaUrl = ref('')
const loginBanners = ref<Banner[]>([])

const loginForm = reactive({
  username: '',
  password: '',
  userType: 'teacher' as 'teacher' | 'student',
  code: '',
  uuid: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度在 5 到 20 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

const registerEnabled = computed(() => {
  if (!appStore.siteConfig) return true
  return appStore.siteConfig.registerSwitch !== false
})

function isValidRedirect(url: string | undefined): boolean {
  if (!url) return false
  if (!url.startsWith('/')) return false
  if (url.startsWith('//')) return false
  if (url.includes('://')) return false
  return true
}

// 获取验证码：后端 GET /code 返回扁平结构 { code, msg, captchaEnabled, uuid, img }
// img/uuid/captchaEnabled 均在 JSON 根上（非 data 嵌套），request.ts 响应拦截器返回整个对象。
// 注意：/code 返回的是 JSON 而非图片本身，因此不能用 <img src="/code?..."> 直接加载，
//      必须读取 res.img 的 base64 内容拼成 data URI。
async function getCaptcha() {
  try {
    const res: any = await get('/code', {}, { requestKey: 'login-captcha' })
    // 后端关闭验证码时 captchaEnabled=false，隐藏整块表单项
    captchaEnabled.value = res?.captchaEnabled !== false
    if (captchaEnabled.value && res?.img) {
      loginForm.uuid = res?.uuid || ''
      captchaUrl.value = `data:image/gif;base64,${res.img}`
    }
  } catch (e) {
    // 请求失败（后端未启动/网络异常）：保持 captchaEnabled 默认 true，
    // 但不要 fallback 到 '/code?uuid=' —— 那会返回 JSON，<img> 渲染为裂图。
    console.error('获取验证码失败：', e)
  }
}

// 模板里点击图片换一张
async function refreshCaptcha() {
  await getCaptcha()
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(
      loginForm.username,
      loginForm.password,
      loginForm.userType,
      rememberMe.value
    )
    const rawRedirect = route.query.redirect as string
    const safeRedirect = isValidRedirect(rawRedirect) ? rawRedirect : '/'
    router.push(safeRedirect)
  } catch (error) {
    if (captchaEnabled.value) {
      refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  getCaptcha()
  appStore.fetchGlobalConfig().catch(() => {})
  // Load login banners
  try {
    const bannerCode = appStore.globalConfig['login.banner_code'] || 'login_banner'
    const data = await getBannersByCode(bannerCode)
    loginBanners.value = data || []
  } catch {
    loginBanners.value = []
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: var(--bg-page, #f6f8fb);
}

.login-left {
  width: 55%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px 60px;
  position: relative;
  overflow: hidden;
}

.brand-area {
  text-align: center;
  margin-bottom: 40px;
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.brand-logo {
  height: 56px;
  width: auto;
  filter: brightness(0) invert(1);
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.brand-slogan {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  letter-spacing: 2px;
}

.left-carousel {
  width: 100%;
  max-width: 480px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.carousel-img {
  width: 100%;
  height: 240px;
  object-fit: cover;
}

.platform-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 40px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.stat-item .el-icon {
  font-size: 28px;
  opacity: 0.9;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  opacity: 0.8;
}

.left-footer {
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  text-align: center;
}

.left-footer p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin: 0;
}

.login-right {
  width: 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  width: 100%;
}

.user-type-tabs {
  display: flex;
  gap: 12px;
  width: 100%;
}

.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
  color: #666;
}

.type-tab:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.type-tab.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(255, 80, 0, 0.05);
  font-weight: 500;
}

.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 14px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.register-link {
  text-align: center;
  width: 100%;
  font-size: 14px;
  color: var(--text-secondary);
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .login-left {
    width: 100%;
    padding: 32px 24px;
    min-height: auto;
  }

  .left-carousel,
  .platform-stats {
    display: none;
  }

  .brand-area {
    margin-bottom: 24px;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-slogan {
    font-size: 14px;
  }

  .login-right {
    width: 100%;
    padding: 24px;
  }

  .left-footer {
    display: none;
  }
}
</style>
