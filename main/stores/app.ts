导入 { 定义Store } 来自 'pinia'
导入 类型 { 菜单项, 全局配置, 网站配置, 通知, 友链, 横幅, 主页模块配置, 平台统计 } 来自 '@/types'
导入 { 使用门户API } 来自 '@/组合/使用门户API'

常量 缓存键前缀 = 'edu_cache_ts:'
常量 缓存有效期: 记录<字符串, 数字> = {
  全局配置: 30 * 60 * 1000,
  菜单列表: 60 * 60 * 1000,
  友情链接: 30 * 60 * 1000,
  通知: 5 * 60 * 1000
}

函数 isCacheValid(键: 字符串): 布尔值 {
  如果 (类型 窗口 === '未定义') 返回 假
  常量 ts = localStorage.getItem(CACHE_KEY_PREFIX + key)
  如果 (!ts) 返回 假
  返回 日期.现在() - 解析整数(ts) < (缓存 TTL[键] || 0)
}

函数 标记缓存时间(键: 字符串) {
  如果 (类型 窗口 === '未定义') 返回
  localStorage.setItem(CACHE_KEY_PREFIX + key, String(Date.now()))
}

interface AppState {
  menuList: MenuItem[]
  globalConfig: Record<string, string>
  siteConfig: SiteConfig | null
  notices: Notice[]
  friendLinks: FriendLink[]
  banners: Record<string, Banner[]>
  isMourningMode: boolean
  isMaintenanceMode: boolean
  sidebarCollapsed: boolean
  deviceType: 'desktop' | 'tablet' | 'mobile'
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    menuList: [],
    globalConfig: {},
    siteConfig: null,
    notices: [],
    friendLinks: [],
    banners: {},
    isMourningMode: false,
    isMaintenanceMode: false,
    sidebarCollapsed: false,
    deviceType: 'desktop'
  }),
  
  getters: {
    config: (state) => (key: string): string => {
      return state.globalConfig[key] || ''
    },
    topicVisibleToTeacher: (state): boolean => {
      return state.globalConfig['sys.topic.visible_to_teacher'] === '1'
    },
    broadcastVisibleToTeacher: (state): boolean => {
      return state.globalConfig['sys.broadcast.visible_to_teacher'] === '1'
    },
    logo: (state) => state.siteConfig?.logo || '/images/logo.svg',
    title: (state) => state.siteConfig?.title || '教育云平台',
    copyright: (state) => state.siteConfig?.copyright || '',
    slogan: (state): string => {
      return state.globalConfig['site.slogan'] || '智慧教育，赋能未来'
    },
    homeModuleConfig: (state): HomeModuleConfig => {
      return {
        banner: state.globalConfig['home.banner.visible'] !== 'false',
        notice: state.globalConfig['home.notice.visible'] !== 'false',
        shortcuts: state.globalConfig['home.shortcuts.visible'] !== 'false',
        profile: state.globalConfig['home.profile.visible'] !== 'false',
        broadcast: state.globalConfig['home.broadcast.visible'] !== 'false',
        stats: state.globalConfig['home.stats.visible'] !== 'false',
        recommend: state.globalConfig['home.recommend.visible'] !== 'false',
        topic: state.globalConfig['home.topic.visible'] !== 'false',
        paper: state.globalConfig['home.paper.visible'] !== 'false',
        hotquestion: state.globalConfig['home.hotquestion.visible'] !== 'false'
      }
    },
    platformStats: (state): PlatformStats => {
      return {
        courseCount: parseInt(state.globalConfig['stats.course.count'] || '0'),
        questionCount: parseInt(state.globalConfig['stats.question.count'] || '0'),
        paperCount: parseInt(state.globalConfig['stats.paper.count'] || '0'),
        studyHours: parseInt(state.globalConfig['stats.study.hours'] || '0')
      }
    },
    /** 主题色：从全局配置读取，默认 #46c37b */
    themeColor: (state): string => {
      return state.globalConfig['site.theme.color'] || '#46c37b'
    },
    /** 主题色（浅色变体） */
    themeColorLight: (state): string => {
      return state.globalConfig['site.theme.color.light'] || '#5fd996'
    },
    /** 主题色（深色变体） */
    themeColorDark: (state): string => {
      return state.globalConfig['site.theme.color.dark'] || '#2a9d5e'
    }
  },
  
  actions: {
    async fetchMenuList(force: boolean = false, userType?: string) {
      const cacheKey = userType ? `menuList_${userType}` : 'menuList'
      if (!force && this.menuList.length > 0 && isCacheValid(cacheKey)) {
        return this.menuList
      }
      const { getMenuList } = usePortalApi()
      const menus = await getMenuList(userType)
      const validMenus = menus.filter((menu: MenuItem) => {
        if (menu.status !== 0) return false
        if (menu.visible !== 0) return false
        if (!menu.path) return false
        if (menu.path === '/') return true
        if (menu.menuType === 'L' && menu.linkUrl) return true
        if (!menu.path.startsWith('/')) return false
        if (!/^\/[a-zA-Z0-9_\-/]*$/.test(menu.path)) return false
        return true
      })
      this.menuList = validMenus
      markCacheTime(cacheKey)
      return validMenus
    },
    
    async fetchGlobalConfig(force: boolean = false) {
      if (!force && Object.keys(this.globalConfig).length > 0 && isCacheValid('globalConfig')) {
        this.checkMourningMode()
        this.checkMaintenanceMode()
        return this.globalConfig
      }
      const { getGlobalConfig } = usePortalApi()
      const config = await getGlobalConfig()
      this.globalConfig = config
      this.parseSiteConfig(config)
      this.checkMourningMode()
      this.checkMaintenanceMode()
      markCacheTime('globalConfig')
      return config
    },
    
    parseSiteConfig(config: Record<string, string>) {
      this.siteConfig = {
        loginRequired: config['sys.login.required'] === 'true',
        mourningMode: config['sys.mourning.mode'] === 'true',
        mourningStart: config['sys.mourning.start'],
        mourningEnd: config['sys.mourning.end'],
        maintenanceMode: config['sys.maintenance.mode'] === 'true',
        maintenanceTitle: config['sys.maintenance.title'],
        maintenanceContent: config['sys.maintenance.content'],
        logo: config['site.logo'] || '/images/logo.svg',
        title: config['site.title'] || '教育云平台',
        copyright: config['site.copyright'] || '',
        icp: config['site.icp'],
        icpUrl: config['site.icp.url'],
        police: config['site.police'],
        policeUrl: config['site.police.url'],
        contactPhone: config['site.contact.phone'],
        contactEmail: config['site.contact.email'],
        registerSwitch: config['user.register.switch'] !== 'false',
        searchEnable: config['search.enable'] !== 'false',
        hotSearchEnable: config['search.hot.enable'] !== 'false'
      }
    },
    
    checkMourningMode() {
      if (!this.siteConfig?.mourningMode) {
        this.isMourningMode = false
        return
      }
      const now = new Date()
      const start = this.siteConfig.mourningStart ? new Date(this.siteConfig.mourningStart) : null
      const end = this.siteConfig.mourningEnd ? new Date(this.siteConfig.mourningEnd) : null
      if (start && end) {
        this.isMourningMode = now >= start && now <= end
      } else {
        this.isMourningMode = true
      }
      if (typeof window !== 'undefined') {
        if (this.isMourningMode) {
          document.body.classList.add('mourning-mode')
        } else {
          document.body.classList.remove('mourning-mode')
        }
      }
    },
    
    checkMaintenanceMode() {
      this.isMaintenanceMode = this.siteConfig?.maintenanceMode || false
    },
    
    async fetchNotices(limit: number = 5, force: boolean = false) {
      if (!force && this.notices.length > 0 && isCacheValid('notices')) {
        return this.notices
      }
      const { getTopNotices } = usePortalApi()
      const notices = await getTopNotices(limit)
      this.notices = notices
      markCacheTime('notices')
      return notices
    },
    
    async fetchFriendLinks(force: boolean = false) {
      if (!force && this.friendLinks.length > 0 && isCacheValid('friendLinks')) {
        return this.friendLinks
      }
      const { getFriendLinks } = usePortalApi()
      const links = await getFriendLinks()
      this.friendLinks = links
      markCacheTime('friendLinks')
      return links
    },
    
    async fetchBanners(positionCode: string) {
      const { getBannersByCode } = usePortalApi()
      const banners = await getBannersByCode(positionCode)
      this.banners[positionCode] = banners
      return banners
    },
    
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    setDeviceType(type: 'desktop' | 'tablet' | 'mobile') {
      this.deviceType = type
    },
    
    async initApp(userType?: string) {
      await Promise.all([
        this.fetchMenuList(false, userType),
        this.fetchGlobalConfig(),
        this.fetchNotices(),
        this.fetchFriendLinks()
      ])
      this.applyTheme()
    },
    
    /** 用户登录后刷新菜单（按用户类型） */
    async refreshMenuByUserType(userType: string) {
      await this.fetchMenuList(true, userType)
    },
    
    /** 用户登出后重置为公开菜单 */
    async resetToPublicMenu() {
      this.menuList = []
      await this.fetchMenuList(true, 'all')
    },

    /** 应用主题色到 CSS 变量 */
    applyTheme() {
      if (typeof window === 'undefined') return
      const root = document.documentElement
      root.style.setProperty('--primary-color', this.themeColor)
      root.style.setProperty('--primary-light', this.themeColorLight)
      root.style.setProperty('--primary-dark', this.themeColorDark)
      root.style.setProperty('--success-color', this.themeColor)
      root.style.setProperty('--text-link', this.themeColor)
    }
  },
  
  persist: {
    key: 'edu-app',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['sidebarCollapsed', 'deviceType', 'globalConfig', 'siteConfig', 'menuList', 'friendLinks']
  }
})
