import { defineStore } from 'pinia'
import type { UserInfo, RegisterParams } from '@/types'
import { getToken, setToken, removeToken, setUserType, getUserType } from '@/utils/auth'
import { useAuthApi } from '@/composables/useAuthApi'

interface UserState {
  token: string
  userInfo: UserInfo | null
  isLoggedIn: boolean
  userType: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken() || '',
    userInfo: null,
    isLoggedIn: !!getToken(),
    userType: getUserType() || ''
  }),
  
  getters: {
    userId: (state) => state.userInfo?.userId || 0,
    userName: (state) => state.userInfo?.userName || '',
    realName: (state) => state.userInfo?.realName || '',
    avatar: (state) => state.userInfo?.avatar || '/images/default-avatar.svg',
    phone: (state) => state.userInfo?.phone || '',
    email: (state) => state.userInfo?.email || '',
    teacherId: (state) => state.userInfo?.teacherId,
    teacherNo: (state) => state.userInfo?.teacherNo || '',
    studentId: (state) => state.userInfo?.studentId,
    studentNo: (state) => state.userInfo?.studentNo || '',
    gradeName: (state) => state.userInfo?.gradeName || '',
    className: (state) => state.userInfo?.className || '',
    createTime: (state) => state.userInfo?.createTime || '',
    isTeacher: (state) => state.userType === 'teacher',
    isStudent: (state) => state.userType === 'student'
  },
  
  actions: {
    async login(username: string, password: string, userType: string, remember: boolean = false) {
      const { login } = useAuthApi()
      const res: any = await login({ username, password, userType })
      const token = res?.access_token || res?.token
      const type = res?.user_type || userType
      this.token = token
      this.isLoggedIn = true
      this.userType = type
      setToken(token, remember)
      setUserType(type)
      return res
    },
    
    async fetchUserInfo() {
      const { getUserInfo } = useAuthApi()
      const info = await getUserInfo()
      this.userInfo = info
      return info
    },
    
    async logout() {
      try {
        const { logout } = useAuthApi()
        await logout()
      } catch (e) {
        console.error('Logout error:', e)
      } finally {
        this.token = ''
        this.userInfo = null
        this.isLoggedIn = false
        this.userType = ''
        removeToken()
      }
    },
    
    updateUserInfo(info: Partial<UserInfo>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...info }
      }
    },

    async register(params: RegisterParams) {
      const { register } = useAuthApi()
      const res: any = await register(params)
      return res
    }
  },
  
  persist: {
    key: 'edu-user',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['token', 'userInfo', 'isLoggedIn', 'userType']
  }
})
