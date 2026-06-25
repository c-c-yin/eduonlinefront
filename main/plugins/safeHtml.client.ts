import { vSafeHtml } from '@/directives/safeHtml'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('safe-html', vSafeHtml)
})