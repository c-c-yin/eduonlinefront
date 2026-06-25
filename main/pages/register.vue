<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <NuxtLink to="/" class="logo">
          <img src="/images/logo.svg" alt="教育云平台" class="logo-img" />
          <span class="logo-text">教育云平台</span>
        </NuxtLink>
        <p class="sub-title">注册新账号</p>
      </div>

      <el-form
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        class="register-form"
        label-position="top"
      >
        <el-form-item label="用户类型" prop="userType">
          <el-radio-group v-model="registerForm.userType">
            <el-radio value="student">学生</el-radio>
            <el-radio value="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model="registerForm.userName"
            placeholder="请输入用户名"
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input
            v-model="registerForm.realName"
            placeholder="请输入真实姓名"
            maxlength="50"
          />
        </el-form-item>

        <el-form-item label="手机号码" prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号码"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（6-20位）"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="captchaEnabled" label="验证码" prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="registerForm.captcha"
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

        <el-form-item>
          <el-checkbox v-model="agreeTerms">
            我已阅读并同意
            <a href="#" class="link">《用户协议》</a>
            和
            <a href="#" class="link">《隐私政策》</a>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>

        <div class="form-footer">
          已有账号？
          <NuxtLink to="/login" class="link">立即登录</NuxtLink>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { get, post } from '@/utils/request'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaEnabled = ref(false)
const captchaUrl = ref('')
const agreeTerms = ref(false)

const registerForm = reactive({
  userType: 'student' as 'teacher' | 'student',
  userName: '',
  realName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  uuid: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function getCaptchaCode() {
  try {
    const res: any = await get('/code', {}, { requestKey: 'register-captcha' })
    captchaEnabled.value = res?.captchaEnabled !== false
    if (captchaEnabled.value && res?.img) {
      registerForm.uuid = res?.uuid || ''
      captchaUrl.value = `data:image/gif;base64,${res.img}`
    }
  } catch {
    captchaEnabled.value = false
  }
}

async function refreshCaptcha() {
  await getCaptchaCode()
}

async function handleRegister() {
  if (!formRef.value) return

  if (!agreeTerms.value) {
    ElMessage.warning('请阅读并同意用户协议和隐私政策')
    return
  }

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.register({
      userType: registerForm.userType,
      username: registerForm.userName,
      realName: registerForm.realName,
      phone: registerForm.phone,
      password: registerForm.password,
      captcha: registerForm.captcha,
      uuid: registerForm.uuid
    })
    ElMessage.success('注册成功')
    router.push('/login')
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败')
    if (captchaEnabled.value) {
      refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getCaptchaCode()
})

useSeoMeta({
  title: '注册 - 教育云平台',
  description: '注册新账号'
})
</script>

<style scoped>
.register-page {
  width: 100%;
}

.register-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
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

.register-form {
  max-width: 400px;
  margin: 0 auto;
}

.register-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.captcha-row {
  display: flex;
  gap: 12px;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--border-color);
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.form-footer {
  text-align: center;
  color: #666;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
