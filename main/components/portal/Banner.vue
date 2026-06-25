<template>
  <div class="banner-carousel">
    <el-carousel
      :interval="interval"
      :height="height"
      :arrow="banners.length > 1 ? 'hover' : 'never'"
      indicator-position="outside"
    >
      <el-carousel-item v-for="banner in banners" :key="banner.bannerId">
        <component
          :is="banner.linkUrl ? 'a' : 'div'"
          :href="banner.linkUrl || undefined"
          :target="banner.linkTarget === 1 ? '_blank' : '_self'"
          class="banner-link"
        >
          <img
            :src="banner.bannerImage"
            :alt="banner.bannerTitle"
            class="banner-image"
          />
          <div v-if="banner.bannerTitle || banner.bannerDesc" class="banner-overlay">
            <div class="banner-content">
              <h2 v-if="banner.bannerTitle" class="banner-title">{{ banner.bannerTitle }}</h2>
              <p v-if="banner.bannerDesc" class="banner-desc">{{ banner.bannerDesc }}</p>
            </div>
          </div>
        </component>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup lang="ts">
import type { Banner } from '@/types'

interface Props {
  banners: Banner[]
  height?: string
  interval?: number
}

withDefaults(defineProps<Props>(), {
  height: '400px',
  interval: 5000
})
</script>

<style scoped>
.banner-carousel {
  width: 100%;
  background: #000;
}

.banner-carousel :deep(.el-carousel__indicators) {
  margin-top: 16px;
}

.banner-link {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px 60px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: #fff;
}

.banner-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.banner-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.banner-desc {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  max-width: 600px;
}

@media (max-width: 768px) {
  .banner-overlay {
    padding: 20px;
  }
  
  .banner-title {
    font-size: 20px;
  }
  
  .banner-desc {
    font-size: 14px;
  }
}
</style>
