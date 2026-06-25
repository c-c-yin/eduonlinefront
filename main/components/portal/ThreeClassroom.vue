<template>
  <div class="three-classroom">
    <div class="classroom-grid">
      <a
        v-for="item in classrooms"
        :key="item.id"
        :href="item.linkUrl"
        :target="item.linkTarget || '_blank'"
        class="classroom-item"
        rel="noopener noreferrer"
      >
        <div class="item-image">
          <img :src="item.imageUrl" :alt="item.title" />
        </div>
        <div class="item-content">
          <h4 class="item-title">{{ item.title }}</h4>
          <p class="item-desc">{{ item.description }}</p>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ClassroomItem {
  id: number
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  linkTarget?: string
}

interface Props {
  classrooms: ClassroomItem[]
}

defineProps<Props>()
</script>

<style scoped>
.three-classroom {
  width: 100%;
}

.classroom-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.classroom-item {
  display: block;
  background: var(--bg-color);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-card);
}

.classroom-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.item-image {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.classroom-item:hover .item-image img {
  transform: scale(1.05);
}

.item-content {
  padding: 16px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.item-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .classroom-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .classroom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
