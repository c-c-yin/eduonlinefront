export const apiVersionConfig = {
  current: 'v1',

  versions: {
    v1: {
      name: 'v1',
      status: 'stable',
      prefix: '/api/v1',
      endpoints: {
        user: '/edu-user',
        admin: '/edu'
      },
      deprecated: false
    },
    legacy: {
      name: 'legacy',
      status: 'deprecated',
      prefix: '',
      endpoints: {
        user: '/edu-user',
        admin: '/edu'
      },
      deprecated: true,
      sunsetDate: '2025-12-31',
      migrationGuide: '请迁移至 /api/v1 版本'
    }
  },

  defaultVersion: 'v1',

  getVersion(version?: string) {
    const ver = version || this.current
    const versions = this.versions as Record<string, any>
    return versions[ver] || this.versions.v1
  },

  isDeprecated(version?: string): boolean {
    const ver = this.getVersion(version)
    return ver.deprecated === true
  },

  getMigrationInfo(path: string) {
    if (path.startsWith('/edu/')) {
      return {
        from: '/edu/**',
        to: '/api/v1/edu/**',
        guide: '请迁移至 /api/v1/edu/**',
        deadline: '2025-12-31'
      }
    }
    if (path.startsWith('/edu-user/')) {
      return {
        from: '/edu-user/**',
        to: '/api/v1/edu-user/**',
        guide: '请迁移至 /api/v1/edu-user/**',
        deadline: '2025-12-31'
      }
    }
    return null
  }
}

export function buildApiUrl(version: string, endpoint: string, path: string): string {
  const ver = apiVersionConfig.getVersion(version)
  if (!ver.prefix) {
    return `${ver.endpoints[endpoint]}${path}`
  }
  return `${ver.prefix}${ver.endpoints[endpoint]}${path}`
}

export const apiVersions = {
  v1: {
    user: {
      base: '/api/v1/edu-user',
      banner: '/api/v1/edu-user/banner',
      notice: '/api/v1/edu-user/notice',
      vodCourse: '/api/v1/edu-user/vodCourse',
      videoResource: '/api/v1/edu-user/video-resource',
      userMenu: '/api/v1/edu-user/user-menu',
      globalConfig: '/api/v1/edu-user/global-config',
      friendLink: '/api/v1/edu-user/friend-link',
      question: '/api/v1/edu-user/question',
      collect: '/api/v1/edu-user/collect',
      studyRecord: '/api/v1/edu-user/studyRecord',
      userScore: '/api/v1/edu-user/userScore'
    },
    admin: {
      base: '/api/v1/edu',
      video: '/api/v1/edu/video',
      videoResource: '/api/v1/edu/video-resource',
      question: '/api/v1/edu/question',
      teacher: '/api/v1/edu/teacher'
    }
  },
  legacy: {
    user: {
      base: '/edu-user',
      banner: '/edu-user/banner',
      notice: '/edu-user/notice',
      vodCourse: '/edu-user/vodCourse',
      videoResource: '/edu-user/video-resource',
      userMenu: '/edu-user/user-menu',
      globalConfig: '/edu-user/global-config',
      friendLink: '/edu-user/friend-link',
      question: '/edu-user/question',
      collect: '/edu-user/collect',
      studyRecord: '/edu-user/studyRecord',
      userScore: '/edu-user/userScore'
    },
    admin: {
      base: '/edu',
      video: '/edu/video',
      videoResource: '/edu/video-resource',
      question: '/edu/question',
      teacher: '/edu/teacher'
    }
  }
}

export default apiVersionConfig
