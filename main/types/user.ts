export interface User {
  userId: number
  userName: string
  realName: string
  nickName: string
  email: string
  phone: string
  gender: '0' | '1' | '2'
  avatar: string
  status: number
  userType: string
  orgId: number
  orgName: string
  createTime: string
  loginDate: string
}

export interface Teacher extends User {
  teacherId: number
  teacherNo: string
  title: string
  mainSubjectId: number
  mainSubjectName: string
  honorIntro: string
}

export interface Student extends User {
  studentId: number
  studentNo: string
  birthday: string
  enrollmentYear: string
  gradeId: number
  gradeName: string
}

export interface UserInfo extends User {
  teacherId?: number
  teacherNo?: string
  title?: string
  studentId?: number
  studentNo?: string
  gradeId?: number
  gradeName?: string
  className?: string
  roles?: string[]
  permissions?: string[]
}

export interface LoginParams {
  username: string
  password: string
  userType: string
  code?: string
  uuid?: string
}

export interface RegisterParams {
  username: string
  password: string
  confirmPassword?: string
  userType: 'teacher' | 'student'
  realName: string
  phone?: string
  email?: string
  code?: string
  captcha?: string
  uuid?: string
}

export interface LoginResult {
  access_token: string
  expires_in: number
  user_type: string
}
