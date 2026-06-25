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
        <el-carousel height="200px" :interval="5000" arrow="hover">
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

function isValidRedirect(url: string | undefined): boolean {
  if (!url) return false
  if (!url.startsWith('/')) return false
  if (url.startsWith('//')) return false
  if (url.includes('://')) return false
  return true
}

async function getCaptcha() {
  try {
    const res: any = await get('/code', {}, { requestKey: 'login-captcha' })
    captchaEnabled.value = res?.captchaEnabled !== false
    if (captchaEnabled.value && res?.img) {
      loginForm.uuid = res?.uuid || ''
      captchaUrl.value = `data:image/gif;base64,${res.img}`
    }
  } catch (e) {
    console.error('获取验证码失败：', e)
  }
}

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
  background: var(--bg-page);
}

.login-left {
  width: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px 60px;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.login-left::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
}

.brand-area {
  text-align: center;
  margin-bottom: 48px;
  position: relative;
  z-index: 1;
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 16px;
}

.brand-logo {
  height: 48px;
  width: auto;
  filter: brightness(0) invert(1);
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 0.5px;
}

.brand-slogan {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  letter-spacing: 2px;
  font-weight: 400;
}

.left-carousel {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 48px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

.carousel-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.platform-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.stat-item .el-icon {
  font-size: 20px;
  opacity: 0.9;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  opacity: 0.8;
}

.left-footer {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 1;
}

.left-footer p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin: 0;
}

.login-right {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
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
  margin-bottom: 4px;
}

.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.type-tab:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.type-tab.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-50);
  font-weight: 600;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 12px;
  box-shadow: none;
  border: 1.5px solid var(--border-color);
  transition: all 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #d4d4d8;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
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
  width: 110px;
  height: 40px;
  cursor: pointer;
  border-radius: 10px;
  border: 1.5px solid var(--border-color);
  transition: all 0.2s ease;
}

.captcha-image:hover {
  border-color: var(--primary-color);
}

.login-button {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  background: var(--primary-color);
  transition: all 0.2s ease;
}

.login-button:hover {
  background: var(--primary-dark);
}

@media (max-width: 1024px) {
  .login-left {
    width: 45%;
    padding: 36px 40px;
  }

  .login-right {
    width: 55%;
    padding: 32px;
  }

  .brand-title {
    font-size: 26px;
  }
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
    min-height: auto;
  }

  .login-left {
    width: 100%;
    padding: 40px 24px;
  }

  .left-carousel {
    display: none;
  }

  .platform-stats {
    display: none;
  }

  .brand-area {
    margin-bottom: 0;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-slogan {
    font-size: 13px;
  }

  .login-right {
    width: 100%;
    padding: 32px 24px;
  }

  .login-card {
    max-width: 100%;
  }

  .left-footer {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-left {
    padding: 32px 20px;
  }

  .login-right {
    padding: 24px 20px;
  }

  .brand-header {
    flex-direction: column;
    gap: 8px;
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
