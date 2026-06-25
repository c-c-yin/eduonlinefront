<template>
  <div ref="chartRef" class="base-chart" :style="{ height: height }" />
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: string
}>(), {
  height: '300px'
})

const chartRef = ref<HTMLElement>()
let chartInstance: any = null

function initChart() {
  if (!chartRef.value) return
  const { $echarts } = useNuxtApp()
  if (!$echarts) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = $echarts.init(chartRef.value)
  chartInstance.setOption(props.option, true)
}

function handleResize() {
  chartInstance?.resize()
}

watch(() => props.option, () => {
  if (chartInstance) {
    chartInstance.setOption(props.option, true)
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.base-chart {
  width: 100%;
}
</style>