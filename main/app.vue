<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: '教育云平台',
  meta: [
    { name: 'description', content: '在线教育平台，提供优质视频课程和试题练习' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ]
})
</script>

<style>
html, body, #__nuxt {
  height: 100%;
}
</style>
