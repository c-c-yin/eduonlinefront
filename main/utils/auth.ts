import Cookies from 'js-cookie'

const TokenKey = 'Edu-Token'
const UserTypeKey = 'Edu-UserType'
const UserInfoKey = 'Edu-UserInfo'

const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'

const cookieOptions = {
  sameSite: 'Lax' as const,
  secure: isProduction
}

export function getToken(): string | undefined {
  return Cookies.get(TokenKey)
}

export function setToken(token: string, remember: boolean = false): string | undefined {
  const options = { ...cookieOptions, ...(remember ? { expires: 7 } : {}) }
  return Cookies.set(TokenKey, token, options)
}

export function removeToken(): void {
  Cookies.remove(TokenKey)
  Cookies.remove(UserTypeKey)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(UserInfoKey)
  }
}

export function getUserType(): string | undefined {
  return Cookies.get(UserTypeKey)
}

export function setUserType(userType: string): string | undefined {
  return Cookies.set(UserTypeKey, userType, cookieOptions)
}

export function setUserInfo(userInfo: any): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(UserInfoKey, JSON.stringify(userInfo))
}

export function getUserInfo(): any {
  if (typeof window === 'undefined') return null
  const info = localStorage.getItem(UserInfoKey)
  return info ? JSON.parse(info) : null
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
