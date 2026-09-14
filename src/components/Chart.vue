<script setup lang="ts">
import {
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  type ChartType,
  registerables,
} from 'chart.js'
import { merge } from 'lodash-es'
import { onBeforeUnmount, useTemplateRef, watchEffect } from 'vue'
import { useTheme } from '../composables'

ChartJS.register(...registerables)

export interface ChartProps {
  type: ChartType
  data: ChartData
  options?: ChartOptions
}

const props = defineProps<ChartProps>()

const { resolved } = useTheme()

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

let chart: ChartJS | undefined
let chartType: ChartType | undefined

function themeOptions(): ChartOptions {
  const styles = getComputedStyle(document.documentElement)
  const ink = styles.getPropertyValue('--color-ink').trim()
  const surface = styles.getPropertyValue('--color-surface').trim()

  return {
    color: ink,
    borderColor: surface,
    plugins: {
      legend: {
        labels: { color: ink },
      },
    },
  }
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return

  const options = merge({}, themeOptions(), props.options)

  if (chart && chartType === props.type) {
    chart.data = props.data
    chart.options = options
    chart.update()
    return
  }

  chart?.destroy()
  chart = new ChartJS(canvas, {
    type: props.type,
    data: props.data,
    options,
  })
  chartType = props.type
}

watchEffect(() => {
  resolved.value
  props.type
  props.data
  props.options

  render()
})

onBeforeUnmount(() => {
  chart?.destroy()
  chart = undefined
  chartType = undefined
})
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>
