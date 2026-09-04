<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ChevronDown, ChartColumn, RefreshCw, Search, Loader2, TrendingUp, CircleCheckBig } from 'lucide-vue-next'
import Chart from 'chart.js/auto'
import {
  getStudentHistoryRanking,
  getStudentHistoryWords,
  getStudentHistoryPhonemes,
  getStudentHistoryWordDetail,
  getStudentHistoryPhonemeDetail,
} from '../../api/endpoints'
import type { HistoryRanking, HistoryWordDetail, HistoryPhonemeDetail } from '../../api/endpoints'

const timeRange = ref('最近一周')
const dataType = ref('单词')
const searchTerm = ref('')
const selectedItem = ref('请选择')
const trendTimeRange = ref('最近一周')

// 排名数据
const ranking = ref<HistoryRanking | null>(null)
const rankingLoading = ref(false)
const rankingError = ref('')

// 可选项目
const wordOptions = ref<string[]>([])
const phonemeOptions = ref<string[]>([])
const optionsLoading = ref(false)

// 图表数据
const chartLoading = ref(false)
const chartError = ref('')
const chartDetail = ref<HistoryWordDetail | HistoryPhonemeDetail | null>(null)
const hasChart = ref(false)

const itemOptions = computed(() => {
  const list = dataType.value === '单词' ? wordOptions.value : phonemeOptions.value
  if (!searchTerm.value.trim()) return list
  const t = searchTerm.value.trim().toLowerCase()
  return list.filter((x) => x.toLowerCase().includes(t))
})

const bestWords = computed(() => ranking.value?.best_words ?? [])
const worstWords = computed(() => ranking.value?.worst_words ?? [])
const bestPhonemes = computed(() => ranking.value?.best_phonemes ?? [])
const worstPhonemes = computed(() => ranking.value?.worst_phonemes ?? [])

const chartTitle = computed(() => {
  const d = chartDetail.value
  if (!d) return ''
  return (d as HistoryWordDetail).word ?? (d as HistoryPhonemeDetail).phoneme ?? ''
})

const chartScores = computed(() => (chartDetail.value?.scores ?? []).slice(-120))

// 雷达图相关依赖（归档页复用逻辑，此处仅保留图表）
const trendCanvas = ref<HTMLCanvasElement | null>(null)
let trendChart: Chart | null = null

function colorCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function renderTrendChart() {
  if (!trendCanvas.value || !hasChart.value) return
  trendChart?.destroy()
  const scores = chartScores.value
  const colorPrimary = colorCssVar('--color-primary', '#58cc02') || '#58cc02'
  const colorInfo = '#1cb0f6'
  const colorMuted = '#6b7280'
  const colorBorder = '#e5e7eb'
  const labels = scores.map((s) => String(s.date).slice(5, 10))
  const data = scores.map((s) => s.score)
  trendChart = new Chart(trendCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '得分',
          data,
          borderColor: colorPrimary,
          backgroundColor: 'rgba(88, 204, 2, 0.14)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: colorPrimary,
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#243238', padding: 10, displayColors: false },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: colorMuted, maxTicksLimit: 10, font: { size: 11 } }, border: { color: colorBorder } },
        y: {
          suggestedMin: 70,
          suggestedMax: 100,
          ticks: { color: colorMuted, stepSize: 5, font: { size: 11 } },
          grid: { color: 'rgba(229,231,235,0.9)' },
          border: { color: colorBorder },
        },
      },
    },
  })
}

async function loadRanking() {
  rankingLoading.value = true
  rankingError.value = ''
  try {
    ranking.value = await getStudentHistoryRanking()
  } catch {
    ranking.value = null
    rankingError.value = '排名数据加载失败，请重试'
  } finally {
    rankingLoading.value = false
  }
}

async function loadOptions() {
  optionsLoading.value = true
  try {
    const [w, p] = await Promise.all([getStudentHistoryWords(), getStudentHistoryPhonemes()])
    wordOptions.value = w.words ?? []
    phonemeOptions.value = p.phonemes ?? []
  } catch {
    wordOptions.value = []
    phonemeOptions.value = []
  } finally {
    optionsLoading.value = false
  }
}

function onDataTypeChange() {
  selectedItem.value = '请选择'
  chartDetail.value = null
  hasChart.value = false
  trendChart?.destroy()
}

async function generateChart() {
  if (selectedItem.value === '请选择') {
    chartError.value = '请先选择一个单词或音素'
    hasChart.value = false
    return
  }
  chartLoading.value = true
  chartError.value = ''
  try {
    if (dataType.value === '单词') {
      chartDetail.value = await getStudentHistoryWordDetail(selectedItem.value)
    } else {
      chartDetail.value = await getStudentHistoryPhonemeDetail(selectedItem.value)
    }
    hasChart.value = true
    await nextTick()
    renderTrendChart()
  } catch {
    chartDetail.value = null
    hasChart.value = false
    chartError.value = '图表数据加载失败，请重试'
  } finally {
    chartLoading.value = false
  }
}

watch(dataType, onDataTypeChange)
watch([searchTerm], () => {
  const list = itemOptions.value
  if (list.length && !list.includes(selectedItem.value)) selectedItem.value = '请选择'
})

onMounted(() => {
  loadRanking()
  loadOptions()
})

onBeforeUnmount(() => {
  trendChart?.destroy()
})
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB]">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- 页面标题 -->
      <h1 class="text-3xl font-black text-[#3C3C3C] mb-8">学习历史记录</h1>

      <!-- Section A: 单词和音素排名 -->
      <div
        class="bg-white rounded-2xl border border-[#F1F5F9] p-6 mb-6"
        style="box-shadow: 0 4px 20px rgba(0,0,0,0.04); border-radius: 16px"
      >
        <h2 class="text-xl font-black text-[#3C3C3C] mb-1">单词和音素排名</h2>
        <p class="text-sm text-[#6B7280] mb-4">您评测中表现最好和最差的单词和音素</p>

        <!-- 筛选行 -->
        <div class="flex items-center gap-3 mb-6">
          <label class="text-sm font-bold text-[#374151]">时间范围:</label>
          <div class="relative">
            <select
              v-model="timeRange"
              class="appearance-none bg-white border-2 border-[#E2E8F0] rounded-xl px-4 py-2 pr-10 font-bold text-sm text-[#3C3C3C] focus:border-[#58CC02] focus:outline-none cursor-pointer"
            >
              <option>最近一周</option>
              <option>最近一月</option>
              <option>最近三月</option>
              <option>全部时间</option>
            </select>
            <ChevronDown class="w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            class="bg-[#58CC02] text-white font-black text-sm px-5 py-2 rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-2"
            style="box-shadow: none"
            :disabled="rankingLoading"
            @click="loadRanking"
          >
            <Loader2 v-if="rankingLoading" class="w-4 h-4 animate-spin" />
            <RefreshCw v-else class="w-4 h-4" />
            更新数据
          </button>
        </div>

        <div v-if="rankingLoading" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#58CC02] rounded-full animate-spin mb-3"></div>
          <span class="text-sm font-bold text-[#9CA3AF]">正在加载排名…</span>
        </div>
        <div v-else-if="rankingError && !bestWords.length && !bestPhonemes.length" class="flex flex-col items-center justify-center py-16 text-center">
          <span class="text-sm font-bold text-[#EF4444] mb-4">{{ rankingError }}</span>
          <button
            class="px-5 py-2 bg-[#58CC02] text-white font-black text-sm rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer"
            @click="loadRanking"
          >
            重新加载
          </button>
        </div>
        <template v-else>
        <!-- 单词排名 -->
        <div class="mb-6">
          <h3 class="text-base font-black text-[#1CB0F6] mb-3">单词排名</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-[#F0F9FF] border border-[#B3EAFF] rounded-xl p-4">
              <div class="font-black text-[#1899D6] mb-3">表现最好的单词</div>
              <div v-if="!bestWords.length" class="text-[#9CA3AF] text-sm font-medium text-center">暂无数据</div>
              <ul v-else class="flex flex-col gap-2">
                <li
                  v-for="item in bestWords"
                  :key="`bw-${item.word}`"
                  class="flex items-center justify-between px-3 py-2 bg-white rounded-lg"
                >
                  <span class="text-sm font-bold text-[#1F2937] truncate">{{ item.word }}</span>
                  <span class="text-sm font-black text-[#58CC02]">{{ Math.round(item.score) }}</span>
                </li>
              </ul>
            </div>
            <div class="bg-[#FFF0F9] border border-[#FFD6EE] rounded-xl p-4">
              <div class="font-black text-[#CF3EA5] mb-3">需要改进的单词</div>
              <div v-if="!worstWords.length" class="text-[#9CA3AF] text-sm font-medium text-center">暂无数据</div>
              <ul v-else class="flex flex-col gap-2">
                <li
                  v-for="item in worstWords"
                  :key="`ww-${item.word}`"
                  class="flex items-center justify-between px-3 py-2 bg-white rounded-lg"
                >
                  <span class="text-sm font-bold text-[#1F2937] truncate">{{ item.word }}</span>
                  <span class="text-sm font-black text-[#EF4444]">{{ Math.round(item.score) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 音素排名 -->
        <div>
          <h3 class="text-base font-black text-[#1CB0F6] mb-3">音素排名</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-[#F0F9FF] border border-[#B3EAFF] rounded-xl p-4">
              <div class="font-black text-[#1899D6] mb-3">表现最好的音素</div>
              <div v-if="!bestPhonemes.length" class="text-[#9CA3AF] text-sm font-medium text-center">暂无数据</div>
              <ul v-else class="flex flex-col gap-2">
                <li
                  v-for="item in bestPhonemes"
                  :key="`bp-${item.phoneme}`"
                  class="flex items-center justify-between px-3 py-2 bg-white rounded-lg"
                >
                  <span class="text-sm font-bold font-mono text-[#1F2937] truncate">/{{ item.phoneme }}/</span>
                  <span class="text-sm font-black text-[#58CC02]">{{ Math.round(item.score) }}</span>
                </li>
              </ul>
            </div>
            <div class="bg-[#FFF0F9] border border-[#FFD6EE] rounded-xl p-4">
              <div class="font-black text-[#CF3EA5] mb-3">需要改进的音素</div>
              <div v-if="!worstPhonemes.length" class="text-[#9CA3AF] text-sm font-medium text-center">暂无数据</div>
              <ul v-else class="flex flex-col gap-2">
                <li
                  v-for="item in worstPhonemes"
                  :key="`wp-${item.phoneme}`"
                  class="flex items-center justify-between px-3 py-2 bg-white rounded-lg"
                >
                  <span class="text-sm font-bold font-mono text-[#1F2937] truncate">/{{ item.phoneme }}/</span>
                  <span class="text-sm font-black text-[#EF4444]">{{ Math.round(item.score) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </template>
      </div>

      <!-- Section B: 数据分析与可视化 -->
      <div
        class="bg-white rounded-2xl border border-[#F1F5F9] p-6"
        style="box-shadow: 0 4px 20px rgba(0,0,0,0.04); border-radius: 16px"
      >
        <h2 class="text-xl font-black text-[#3C3C3C] mb-1">数据分析与可视化</h2>
        <p class="text-sm text-[#6B7280] mb-4">选择单词或音素,查看评分趋势和使用频率</p>

        <!-- 筛选工具栏 -->
        <div class="bg-[#F8FAFB] rounded-xl p-4 mb-6">
          <div class="grid grid-cols-12 gap-4 items-end">
            <!-- 数据类型 -->
            <div class="col-span-2">
              <label class="block text-xs font-black text-[#374151] mb-1 uppercase tracking-wider">数据类型:</label>
              <div class="relative">
                <select
                  v-model="dataType"
                  class="w-full bg-white border-2 border-[#E2E8F0] rounded-xl px-3 py-2 font-bold text-sm focus:border-[#58CC02] focus:outline-none cursor-pointer appearance-none"
                  @change="onDataTypeChange"
                >
                  <option>单词</option>
                  <option>音素</option>
                </select>
                <ChevronDown class="w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <!-- 选择项目 (搜索) -->
            <div class="col-span-4">
              <label class="block text-xs font-black text-[#374151] mb-1 uppercase tracking-wider">选择项目:</label>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="搜索..."
                class="w-full bg-white border-2 border-[#E2E8F0] rounded-xl px-3 py-2 font-medium text-sm placeholder-[#9CA3AF] focus:border-[#58CC02] focus:outline-none"
              />
            </div>

            <!-- 下拉选择 -->
            <div class="col-span-3">
              <div class="relative">
                <select
                  v-model="selectedItem"
                  class="w-full bg-white border-2 border-[#E2E8F0] rounded-xl px-3 py-2 font-bold text-sm focus:border-[#58CC02] focus:outline-none cursor-pointer appearance-none"
                >
                  <option>请选择</option>
                  <option v-for="opt in itemOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                <ChevronDown class="w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <!-- 时间范围 -->
            <div class="col-span-2">
              <label class="block text-xs font-black text-[#374151] mb-1 uppercase tracking-wider">时间范围:</label>
              <div class="relative">
                <select
                  v-model="trendTimeRange"
                  class="w-full bg-white border-2 border-[#E2E8F0] rounded-xl px-3 py-2 font-bold text-sm focus:border-[#58CC02] focus:outline-none cursor-pointer appearance-none"
                >
                  <option>最近一周</option>
                  <option>最近一月</option>
                  <option>最近三月</option>
                </select>
                <ChevronDown class="w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <!-- 生成图表按钮 -->
            <div class="col-span-1">
              <button
                class="w-full bg-[#58CC02] text-white font-black text-sm px-4 py-2 rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap cursor-pointer inline-flex items-center justify-center gap-2"
                style="box-shadow: none"
                :disabled="chartLoading"
                @click="generateChart"
              >
                <Loader2 v-if="chartLoading" class="w-4 h-4 animate-spin" />
                <RefreshCw v-else class="w-4 h-4" />
                生成图表
              </button>
            </div>
          </div>
        </div>

        <!-- 图表区域: 评分趋势 -->
        <div>
          <h3 class="text-center text-base font-black text-[#1CB0F6] mb-4">评分趋势 · {{ chartTitle || (dataType === '单词' ? '单词' : '音素') }}</h3>

          <div v-if="chartLoading" class="bg-[#F8FAFB] rounded-xl border border-[#E2E8F0] p-16 text-center">
            <div class="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#58CC02] rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-[#9CA3AF] font-medium">正在加载趋势数据…</p>
          </div>

          <div v-else-if="chartError" class="bg-[#F8FAFB] rounded-xl border border-[#FECACA] p-16 text-center">
            <p class="text-[#EF4444] font-medium mb-4">{{ chartError }}</p>
            <button
              class="px-5 py-2 bg-[#58CC02] text-white font-black text-sm rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer"
              @click="generateChart"
            >
              重试
            </button>
          </div>

          <div v-else-if="hasChart && chartDetail" class="bg-[#F8FAFB] rounded-xl border border-[#E2E8F0] p-6">
            <div class="flex flex-wrap justify-end gap-3 mb-4">
              <div class="flex items-center gap-2 rounded-xl border border-[#B3EAFF] bg-[#F0F9FF] px-3 py-2 text-xs font-bold text-[#1899D6]">
                <TrendingUp class="w-4 h-4" />
                平均 {{ Math.round(chartDetail.average_score) }}
              </div>
              <div class="flex items-center gap-2 rounded-xl border border-[#FFF0F9] bg-[#FFF0F9] px-3 py-2 text-xs font-bold text-[#CF3EA5]">
                <CircleCheckBig class="w-4 h-4" />
                最高 {{ Math.round(chartDetail.max_score) }} / 最低 {{ Math.round(chartDetail.min_score) }}
              </div>
              <div class="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#6B7280]">
                共 {{ chartDetail.count }} 次记录
              </div>
            </div>
            <div class="h-[320px] rounded-xl border border-[#E2E8F0] bg-white p-4">
              <canvas ref="trendCanvas"></canvas>
            </div>
          </div>

          <div v-else class="bg-[#F8FAFB] rounded-xl border-2 border-dashed border-[#E2E8F0] p-16 text-center">
            <ChartColumn class="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <p class="text-[#9CA3AF] font-medium">暂无数据</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
