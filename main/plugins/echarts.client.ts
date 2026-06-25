import { defineNuxtPlugin } from '#app'
import * as echarts from 'echarts/core'
import { RadarChart, BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  DatasetComponent,
  ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  RadarChart, BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, RadarComponent, DatasetComponent,
  ToolboxComponent, CanvasRenderer
])

export default defineNuxtPlugin(() => {
  return {
    provide: {
      echarts
    }
  }
})