<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

export type RadarAxisItem = {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    items: RadarAxisItem[]
    color?: string
    max?: number
    height?: string
  }>(),
  {
    color: '#58CC02',
    max: 100,
    height: '220px',
  },
)

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function render() {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'radar',
    data: {
      labels: props.items.map((item) => item.label),
      datasets: [
        {
          data: props.items.map((item) => Math.min(Math.max(item.value, 0), props.max)),
          borderColor: props.color,
          backgroundColor: `${props.color}22`,
          borderWidth: 2,
          pointBackgroundColor: props.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          pointRadius: 3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#243238',
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (context) => {
              const index = context.dataIndex
              const item = props.items[index]
              return `${item.label}: ${item.value.toFixed(1)} 分`
            },
          },
        },
      },
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: props.max,
          beginAtZero: true,
          ticks: {
            display: false,
            stepSize: props.max / 4,
          },
          pointLabels: {
            color: '#6B7280',
            font: { size: 11, weight: 'bold' },
          },
          angleLines: { color: 'rgba(229,231,235,0.8)' },
          grid: { color: 'rgba(229,231,235,0.8)' },
        },
      },
    },
  })
}

onMounted(render)
watch(() => props.items, render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div :style="{ height }">
    <canvas ref="canvas"></canvas>
  </div>
</template>
