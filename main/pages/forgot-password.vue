<template>
  <div class="forgot-page">
    <div class="forgot-container">
      <div class="forgot-header">
        <NuxtLink to="/" class="logo">
          <img src="/images/logo.svg" alt="教育云平台" class="logo-img" />
          <span class="logo-text">教育云平台</span>
        </NuxtLink>
        <p class="sub-title">找回密码</p>
      </div>

      <el-steps :active="currentStep" finish-status="success" class="steps">
        <el-step title="验证身份" />
        <el-step title="设置新密码" />
        <el-step title="完成" />
      </el-steps>

      <el-form
        v-if="currentStep === 0"
        ref="formRef"
        :model="step1Form"
        :rules="step1Rules"
        class="forgot-form"
        label-position="top"
      >
        <el-form-item label="手机号码" prop="phone">
          <el-input
            v-model="step1Form.phone"
            placeholder="请输入注册的手机号码"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="step1Form.captcha"
              placeholder="请输入验证码"
              class="captcha-input"
              maxlength="4"
            />
            <img
              :src="captchaUrl"
              alt="验证码"
              class="captcha-img"
              @click="refreshCaptcha"
            />
          </div>
        </el-form-item>

        <el-form-item label="短信验证码" prop="smsCode">
          <div class="sms-row">
            <el-input
              v-model="step1Form.smsCode"
              placeholder="请输入短信验证码"
              class="sms-input"
              maxlength="6"
            />
            <el-button
              :disabled="smsCountdown > 0"
              class="sms-btn"
              @click="sendSmsCode"
            >
              {{ smsCountdown > 0 ? `${smsCountdown}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="submit-btn" @click="handleVerify">
            下一步
          </el-button>
        </el-form-item>
      </el-form>

      <el-form
        v-else-if="currentStep === 1"
        ref="formRef2"
        :model="step2Form"
        :rules="step2Rules"
        class="forgot-form"
        label-position="top"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="step2Form.password"
            type="password"
            placeholder="请输入新密码（6-20位）"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="step2Form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleResetPassword">
            确认重置
          </el-button>
        </el-form-item>
      </el-form>

      <div v-else class="success-step">
        <el-icon class="success-icon" color="#67C23A"><CircleCheck /></el-icon>
        <h3>密码重置成功</h3>
        <p>您的密码已成功重置，请使用新密码登录</p>
        <el-button type="primary" @click="goToLogin">返回登录</el-button>
      </div>

      <div class="form-footer">
        <NuxtLink to="/login" class="link">返回登录</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import { get, post } from '@/utils/request'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()

const formRef = ref<FormInstance>()
const formRef2 = ref<FormInstance>()
const loading = ref(false)
const currentStep = ref(0)
const captchaUrl = ref('')
const smsCountdown = ref(0)

const step1Form = reactive({
  phone: '',
  captcha: '',
  smsCode: '',
  uuid: ''
})

const step2Form = reactive({
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== step2Form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const step1Rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' }
  ]
}

const step2Rules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function getCaptchaCode() {
  try {
    const res: any = await get('/code', {}, { requestKey: 'forgot-captcha' })
    const captchaEnabled = res?.captchaEnabled !== false
    if (captchaEnabled && res?.img) {
      step1Form.uuid = res?.uuid || ''
      captchaUrl.value = `data:image/gif;base64,${res.img}`
    }
  } catch {
    captchaUrl.value = ''
  }
}

async function refreshCaptcha() {
  await getCaptchaCode()
}

async function sendSmsCode() {
  if (!step1Form.phone) {
    ElMessage.warning('请输入手机号码')
    return
  }
  if (!step1Form.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }

  try {
    await post('/auth/edu/sms/send', {
      phone: step1Form.phone,
      captcha: step1Form.captcha,
      uuid: step1Form.uuid,
      type: 'forgot'
    })
    ElMessage.success('短信验证码已发送')
    smsCountdown.value = 60
    const timer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
    refreshCaptcha()
  }
}

async function handleVerify() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await post('/auth/edu/verify-sms', {
      phone: step1Form.phone,
      smsCode: step1Form.smsCode,
      type: 'forgot'
    })
    currentStep.value = 1
  } catch (error: any) {
    ElMessage.error(error.message || '验证失败')
  }
}

async function handleResetPassword() {
  if (!formRef2.value) return

  const valid = await formRef2.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await post('/auth/edu/reset-password', {
      phone: step1Form.phone,
      password: step2Form.password
    })
    currentStep.value = 2
  } catch (error: any) {
    ElMessage.error(error.message || '重置失败')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

onMounted(() => {
  getCaptchaCode()
})

useSeoMeta({
  title: '找回密码 - 教育云平台',
  description: '找回密码'
})
</script>

<style scoped>
.forgot-page {
  width: 100%;
}

.forgot-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.forgot-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  margin-bottom: 16px;
}

.logo-img {
  height: 40px;
  width: auto;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.sub-title {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.steps {
  max-width: 400px;
  margin: 0 auto 32px;
}

.forgot-form {
  max-width: 400px;
  margin: 0 auto;
}

.captcha-row,
.sms-row {
  display: flex;
  gap: 12px;
}

.captcha-input,
.sms-input {
  flex: 1;
}

.captcha-img,
.sms-btn {
  height: 40px;
}

.captcha-img {
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--border-color);
}

.sms-btn {
  width: 120px;
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.success-step {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-step h3 {
  font-size: 20px;
  margin: 0 0 8px;
}

.success-step p {
  color: #666;
  margin: 0 0 24px;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
