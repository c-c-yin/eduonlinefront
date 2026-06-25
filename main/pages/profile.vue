<template>
  <div class="profile-page">
    <div class="container">
      <div class="profile-header">
        <div class="user-info">
          <el-avatar :src="userInfo.avatar || '/images/default-avatar.svg'" :size="80" class="avatar" />
          <div class="info-detail">
            <h2 class="user-name">{{ userInfo.realName || userInfo.userName }}</h2>
            <p class="user-meta">
              <span v-if="userInfo.teacherId">工号: {{ userInfo.teacherNo }}</span>
              <span v-if="userInfo.studentId">学号: {{ userInfo.studentNo }}</span>
              <span v-if="userStore.userType === 'teacher'">教师</span>
              <span v-if="userStore.userType === 'student'">学生</span>
            </p>
          </div>
        </div>
      </div>

      <div class="profile-content">
        <div class="sidebar">
          <el-menu :default-active="activeMenu" @select="handleMenuSelect">
            <el-menu-item index="info">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </el-menu-item>
            <el-menu-item index="settings">
              <el-icon><Setting /></el-icon>
              <span>账号设置</span>
            </el-menu-item>
          </el-menu>

          <!-- 快捷链接 -->
          <div class="quick-links">
            <h4 class="quick-links-title">快捷链接</h4>
            <NuxtLink to="/student/homework" class="quick-link-item">
              <el-icon><Notebook /></el-icon>
              <span>我的作业</span>
            </NuxtLink>
            <NuxtLink to="/student/scores" class="quick-link-item">
              <el-icon><Tickets /></el-icon>
              <span>我的成绩</span>
            </NuxtLink>
            <NuxtLink to="/student/dashboard" class="quick-link-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>学习中心</span>
            </NuxtLink>
            <NuxtLink to="/student/profile" class="quick-link-item">
              <el-icon><User /></el-icon>
              <span>我的画像</span>
            </NuxtLink>
            <NuxtLink to="/student/wrong" class="quick-link-item">
              <el-icon><Edit /></el-icon>
              <span>错题本</span>
            </NuxtLink>
            <NuxtLink to="/student/knowledge-report" class="quick-link-item">
              <el-icon><TrendCharts /></el-icon>
              <span>学习报告</span>
            </NuxtLink>
          </div>
        </div>

        <div class="main-content">
          <el-card v-if="activeMenu === 'info'" class="info-card">
            <template #header>
              <div class="card-header">
                <span>个人信息</span>
                <el-button type="primary" link @click="handleEditInfo">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户名">{{ userInfo.userName }}</el-descriptions-item>
              <el-descriptions-item label="真实姓名">{{ userInfo.realName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号码">{{ userInfo.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="电子邮箱">{{ userInfo.email || '-' }}</el-descriptions-item>
              <el-descriptions-item v-if="userInfo.teacherNo" label="工号">{{ userInfo.teacherNo }}</el-descriptions-item>
              <el-descriptions-item v-if="userInfo.studentNo" label="学号">{{ userInfo.studentNo }}</el-descriptions-item>
              <el-descriptions-item v-if="userInfo.title" label="职称">{{ userInfo.title }}</el-descriptions-item>
              <el-descriptions-item v-if="userInfo.gradeName" label="年级">{{ userInfo.gradeName }}</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ userInfo.createTime || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card v-else-if="activeMenu === 'settings'" class="info-card">
            <template #header>
              <div class="card-header">
                <span>账号设置</span>
              </div>
            </template>
            <el-tabs>
              <el-tab-pane label="修改密码">
                <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
                  <el-form-item label="原密码" prop="oldPassword">
                    <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
                  </el-form-item>
                  <el-form-item label="新密码" prop="newPassword">
                    <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
                  </el-form-item>
                  <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 编辑个人信息对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑个人信息" width="560px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="editForm.nickName" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入电子邮箱" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio value="0">男</el-radio>
            <el-radio value="1">女</el-radio>
            <el-radio value="2">保密</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="userStore.isTeacher" label="职称" prop="title">
          <el-select v-model="editForm.title" placeholder="请选择职称" clearable>
            <el-option label="正高级教师" value="正高级教师" />
            <el-option label="高级教师" value="高级教师" />
            <el-option label="一级教师" value="一级教师" />
            <el-option label="二级教师" value="二级教师" />
            <el-option label="三级教师" value="三级教师" />
            <el-option label="未定级" value="未定级" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="userStore.isTeacher" label="荣誉介绍" prop="honorIntro">
          <el-input v-model="editForm.honorIntro" type="textarea" :rows="4" placeholder="请输入荣誉介绍" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="submitEditInfo">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { User, Setting, Notebook, Tickets, DataAnalysis, Edit, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthApi } from '@/composables/useAuthApi'
import type { UserInfo } from '@/types'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const userStore = useUserStore()
const { updateProfile, changePassword } = useAuthApi()

const activeMenu = ref(route.query.tab as string || 'info')
const userInfo = ref<Partial<UserInfo>>({})

const passwordFormRef = ref<FormInstance>()
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 编辑个人信息
const editDialogVisible = ref(false)
const editSaving = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = ref({
  realName: '',
  nickName: '',
  phone: '',
  email: '',
  gender: '2' as '0' | '1' | '2',
  title: '',
  honorIntro: ''
})

const editRules: FormRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
}

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

function handleMenuSelect(index: string) {
  activeMenu.value = index
}

function handleEditInfo() {
  editForm.value = {
    realName: userInfo.value.realName || '',
    nickName: userInfo.value.nickName || '',
    phone: userInfo.value.phone || '',
    email: userInfo.value.email || '',
    gender: (userInfo.value.gender as '0' | '1' | '2') || '2',
    title: (userInfo.value as any).title || '',
    honorIntro: (userInfo.value as any).honorIntro || ''
  }
  editDialogVisible.value = true
}

async function submitEditInfo() {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editSaving.value = true
  try {
    await updateProfile(editForm.value)
    ElMessage.success('个人信息修改成功')
    editDialogVisible.value = false
    // 更新本地用户信息
    userStore.updateUserInfo({
      realName: editForm.value.realName,
      nickName: editForm.value.nickName,
      phone: editForm.value.phone,
      email: editForm.value.email,
      gender: editForm.value.gender
    })
    // 更新页面显示
    userInfo.value = { ...userInfo.value, ...editForm.value }
  } catch (error) {
    ElMessage.error('个人信息修改失败')
  } finally {
    editSaving.value = false
  }
}

async function handleChangePassword() {
  if (!passwordFormRef.value) return
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    ElMessage.error('密码修改失败')
  }
}

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }
  userInfo.value = {
    userId: userStore.userId,
    userName: userStore.userName,
    realName: userStore.realName,
    avatar: userStore.avatar,
    phone: userStore.phone || '',
    email: userStore.email || '',
    teacherId: userStore.teacherId,
    teacherNo: userStore.teacherNo,
    studentId: userStore.studentId,
    studentNo: userStore.studentNo,
    createTime: userStore.createTime
  }
})

useSeoMeta({
  title: '个人中心 - 教育云平台',
  description: '个人中心'
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: 24px 0;
}

.profile-header {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  border: 3px solid var(--primary-color-light-9);
}

.info-detail {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.user-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.profile-content {
  display: flex;
  gap: 24px;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
}

.sidebar :deep(.el-menu) {
  border-radius: 8px;
  overflow: hidden;
}

.quick-links {
  margin-top: 16px;
  padding: 16px 12px;
  background: var(--bg-color);
  border-radius: 8px;
}

.quick-links-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px;
  padding: 0 8px;
}

.quick-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  font-size: 14px;
  color: var(--text-primary);
  border-radius: 6px;
  transition: all 0.2s;
}

.quick-link-item:hover {
  background: var(--primary-color-light-9);
  color: var(--primary-color);
}

.main-content {
  flex: 1;
  min-width: 0;
}

.info-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 20px;
  }

  .profile-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .sidebar :deep(.el-menu) {
    display: flex;
  }
}
</style>
