import { get, post, put, del } from '@/utils/request'
import type { LoginParams, LoginResult, UserInfo } from '@/types'

export function useAuthApi() {
  const login = (data: LoginParams): Promise<LoginResult> => {
    return post('/auth/edu-login', data).then((res: any) => res?.data || res)
  }

  const logout = (): Promise<void> => {
    return del('/auth/logout')
  }

  const register = (data: any): Promise<void> => {
    return post('/auth/register', data)
  }

  const getUserInfo = (): Promise<UserInfo> => {
    return get('/user/info').then((res: any) => res?.data)
  }

  const updateProfile = (data: Partial<UserInfo>): Promise<void> => {
    return put('/user/profile', data)
  }

  const changePassword = (data: { oldPassword: string; newPassword: string }): Promise<void> => {
    return put('/user/password', data)
  }

  return {
    login,
    logout,
    register,
    getUserInfo,
    updateProfile,
    changePassword
  }
}