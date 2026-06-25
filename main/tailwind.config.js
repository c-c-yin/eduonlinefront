/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f8ef',
          100: '#d1f1df',
          200: '#a3e3bf',
          300: '#75d59f',
          400: '#47c77f',
          500: '#46c37b',
          600: '#2a9d5e',
          700: '#1e7a48',
          800: '#125932',
          900: '#06371c'
        },
        danger: '#d51423',
        success: '#46c37b',
        warning: '#f0ad4e',
        info: '#909399',
        text: {
          primary: '#333333',
          regular: '#666666',
          secondary: '#999999',
          placeholder: '#c0c4cc'
        },
        bg: {
          page: '#f6f8fb',
          overlay: '#ffffff'
        },
        border: '#ebeef5'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'sans-serif']
      },
      fontSize: {
        xs: ['12px', '20px'],
        sm: ['13px', '22px'],
        base: ['14px', '24px'],
        lg: ['16px', '28px'],
        xl: ['18px', '28px'],
        '2xl': ['20px', '32px'],
        '3xl': ['24px', '38px']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        'soft': '0 2px 12px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 2px 12px 0 rgba(0, 0, 0, 0.1)',
        'hover': '0 6px 16px 0 rgba(0, 0, 0, 0.08)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
}
