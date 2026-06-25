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
  background: rgb(51, 51, 51);
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  height: auto;
  min-height: 50px;
}

.copyright {
  line-height: 20px;
  text-align: center;
  color: #ccc;
  font-size: 12px;
}

.copyright a {
  color: #ccc;
}

.icp_num {
  line-height: 24px;
  text-align: center;
  color: #ccc;
  font-size: 12px;
}

.link {
  color: #ccc;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
