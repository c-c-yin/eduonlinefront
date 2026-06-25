<template>
  <el-footer v-if="siteConfig" class="footer-bottom">
    <div v-if="siteConfig.copyright" class="copyright">
      <span v-safe-html="siteConfig.copyright" />
    </div>
    <div class="icp_num">
      <span v-if="siteConfig.icp">
        <a href="https://beian.miit.gov.cn/" target="_blank" class="link">{{ siteConfig.icp }}</a>
      </span>
      <span v-if="siteConfig.police">
        &nbsp;|&nbsp;
        <a :href="'https://beian.mps.gov.cn/#/query/webSearch?code=' + siteConfig.police" target="_blank" class="link">
          {{ siteConfig.police }}
        </a>
      </span>
    </div>
  </el-footer>
</template>

<script setup lang="ts">
const appStore = useAppStore()
const siteConfig = computed(() => appStore.siteConfig)
</script>

<style scoped>
.footer-bottom {
  background: #18181b;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  height: auto;
  min-height: var(--footer-height);
}

.copyright {
  line-height: 1.6;
  text-align: center;
  color: #71717a;
  font-size: 12px;
}

.copyright a {
  color: #a1a1aa;
}

.icp_num {
  line-height: 1.6;
  text-align: center;
  color: #71717a;
  font-size: 12px;
}

.link {
  color: #a1a1aa;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link:hover {
  color: #d4d4d8;
}

@media (max-width: 480px) {
  .footer-bottom {
    padding: 10px 12px;
  }

  .copyright,
  .icp_num {
    font-size: 11px;
  }
}
</style>
