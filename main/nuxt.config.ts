export default defineNuxtConfig({
  devtools: { enabled: false },

  // @ts-expect-error compatibilityDate is valid at runtime but may not be in the installed Nuxt version's types
  compatibilityDate: '2026-06-12',

  modules: [
    ['@nuxt/devtools', { enabled: false }],
    '@element-plus/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  css: [
    '@/assets/styles/main.css'
  ],

  components: {
    dirs: [
      {
        path: './components',
        pathPrefix: false
      }
    ]
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  elementPlus: {
    importStyle: 'css',
    themes: ['dark']
  },

  pinia: {
    storesDirs: ['./stores/**']
  },

  tailwindcss: {
    cssPath: '@/assets/styles/tailwind.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    viewer: true
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
        }
      }
    },
    optimizeDeps: {
      include: ['video.js', 'hls.js']
    },
    hmr:false
  },
  nitro: {
    devProxy: {
      '/edu-user': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/file': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    },
    routeRules: {
      '/**': {
        headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      siteTitle: process.env.NUXT_PUBLIC_SITE_TITLE || '教育云平台',
      siteLogo: process.env.NUXT_PUBLIC_SITE_LOGO || '/images/logo.svg'
    }
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  experimental: {
    asyncContext: true
  }
})
