<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import {
  ArrowLeft,
  Award,
  Users,
  Clipboard,
  Calendar,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  FileText,
  RefreshCw,
  Mic,
  Activity,
  Volume2,
  SquareCheckBig,
  Flame,
  Lightbulb,
  Check,
  TriangleAlert,
} from 'lucide-vue-next'
import {
  getTeacherClasses,
  getTeacherClassStudents,
  getTeacherClassTasks,
  getStudentAnalysis,
  getStudentProgress,
  type StudentProgressResponse,
} from '../../api/endpoints'

const route = useRoute()
const router = useRouter()

const classId = computed(() => String(route.params.classId ?? ''))
const className = ref('班级')
const studentCount = ref(0)
const evaluationCount = ref(0)
const createdAt = ref('')
const updatedAt = ref('')
const overallScore = ref(0)
const averagePron = ref(0)
const averageRhythm = ref(0)
const averageFluency = ref(0)
const averageCompleteness = ref(0)
const activeCount = ref(0)
const completionRate = ref(0)
const excellentRate = ref(0)
const loading = ref(false)
const loadError = ref('')

const trendLabels = ref<string[]>([])
const trendOverall = ref<number[]>([])
const trendPron = ref<number[]>([])
const distributionData = ref<number[]>([0, 0, 0, 0])
const distributionTotal = ref(0)

const trendCanvas = ref<HTMLCanvasElement | null>(null)
const distributionCanvas = ref<HTMLCanvasElement | null>(null)
let trendChart: Chart | null = null
let distributionChart: Chart | null = null

const metricCards = computed(() => [
  { label: '平均发音', value: averagePron.value, badge: avgBadge(averagePron.value), tone: 'success', icon: Mic },
  { label: '平均节奏', value: averageRhythm.value, badge: avgBadge(averageRhythm.value), tone: 'info', icon: Activity },
  { label: '平均流利度', value: averageFluency.value, badge: avgBadge(averageFluency.value), tone: 'warning', icon: Volume2 },
  { label: '平均完整度', value: averageCompleteness.value, badge: avgBadge(averageCompleteness.value), tone: 'success', icon: SquareCheckBig },
  { label: '平均综合', value: overallScore.value, badge: avgBadge(overallScore.value), tone: 'success', icon: Award },
  { label: '本周活跃', value: activeCount.value, badge: pctBadge(activeCount.value, studentCount.value), tone: 'info', icon: Flame },
])

const tabs = ['班级概览', '学生表现', '单元分析', '学习活动', '薄弱环节', '教学建议']

function avgBadge(value: number) {
  if (value >= 85) return '优秀'
  if (value >= 70) return '稳定'
  if (value > 0) return '待提升'
  return '暂无数据'
}

function pctBadge(value: number, total: number) {
  return total > 0 ? `占比 ${Math.round((value / total) * 100)}%` : '暂无数据'
}

const iconToneClass = (tone: string) => {
  if (tone === 'info') return 'bg-[#E9F7FF] text-[#1CB0F6]'
  if (tone === 'warning') return 'bg-[#FFF9E6] text-[#F8D25C]'
  return 'bg-[#EBF9E6] text-[#58CC02]'
}

const badgeToneClass = (tone: string) => {
  if (tone === 'info') return 'bg-[#E9F7FF] text-[#1CB0F6]'
  if (tone === 'warning') return 'bg-[#FFF9E6] text-[#664A00]'
  return 'bg-[#EBF9E6] text-[#58CC02]'
}

const barToneClass = (tone: string) => {
  if (tone === 'info') return 'bg-[#E9F7FF]'
  return 'bg-[#EBF9E6]'
}

const barFillToneClass = (tone: string) => {
  if (tone === 'info') return 'bg-[#1CB0F6]'
  return 'bg-[#58CC02]'
}

function getCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function renderCharts() {
  const colorPrimary = getCssVar('--color-primary', '#58cc02') || '#58cc02'
  const colorInfo = '#1cb0f6'
  const colorWarning = '#f8d25c'
  const colorError = '#ef4444'
  const colorBorder = '#e5e7eb'
  const colorMuted = '#6b7280'

  trendChart?.destroy()
  distributionChart?.destroy()
  trendChart = null
  distributionChart = null

  if (trendCanvas.value && trendLabels.value.length) {
    trendChart = new Chart(trendCanvas.value, {
      type: 'line',
      data: {
        labels: trendLabels.value,
        datasets: [
          {
            label: '综合得分',
            data: trendOverall.value,
            borderColor: colorPrimary,
            backgroundColor: 'rgba(88, 204, 2, 0.14)',
            fill: true,
            tension: 0.38,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: colorPrimary,
            pointBorderWidth: 2,
          },
          {
            label: '发音得分',
            data: trendPron.value,
            borderColor: colorInfo,
            backgroundColor: 'rgba(28, 176, 246, 0.08)',
            fill: false,
            tension: 0.38,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: colorInfo,
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
          tooltip: {
            backgroundColor: '#243238',
            padding: 12,
            displayColors: true,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colorMuted, font: { size: 12 } },
            border: { color: colorBorder },
          },
          y: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { color: colorMuted, stepSize: 10, font: { size: 12 } },
            grid: { color: 'rgba(229,231,235,0.9)' },
            border: { color: colorBorder },
          },
        },
      },
    })
  }

  if (distributionCanvas.value && distributionData.value.some((v) => v > 0)) {
    distributionChart = new Chart(distributionCanvas.value, {
      type: 'doughnut',
      data: {
        labels: ['90-100 分', '80-89 分', '70-79 分', '70 分以下'],
        datasets: [
          {
            data: distributionData.value,
            backgroundColor: [colorPrimary, colorInfo, colorWarning, colorError],
            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
            borderWidth: 6,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#243238',
            padding: 12,
          },
        },
      },
    })
  }
}

async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let idx = 0
  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (idx < items.length) {
        const cur = items[idx++]
        await fn(cur)
      }
    })
  await Promise.all(workers)
}

function computeDistribution(scores: number[]) {
  const d = [0, 0, 0, 0]
  scores.forEach((s) => {
    if (s >= 90) d[0]++
    else if (s >= 80) d[1]++
    else if (s >= 70) d[2]++
    else d[3]++
  })
  return d
}

function aggregateTrend(progressList: (StudentProgressResponse | null)[]) {
  const byDate = new Map<string, { oSum: number; oCnt: number; pSum: number; pCnt: number }>()
  progressList.forEach((p) => {
    if (!p?.scores) return
    p.scores.forEach((item) => {
      const raw = item.date || item.created_at
      if (!raw) return
      const key = String(raw).slice(0, 10)
      const dims = [item.pronunciation, item.rhythm, item.fluency, item.completeness].filter((v) => v != null) as number[]
      if (!dims.length) return
      const overall = dims.reduce((a, b) => a + b, 0) / dims.length
      let rec = byDate.get(key)
      if (!rec) {
        rec = { oSum: 0, oCnt: 0, pSum: 0, pCnt: 0 }
        byDate.set(key, rec)
      }
      rec.oSum += overall
      rec.oCnt++
      if (item.pronunciation != null) {
        rec.pSum += item.pronunciation
        rec.pCnt++
      }
    })
  })
  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7)
  const labels = sorted.map(([d]) => d.slice(5))
  const overall = sorted.map(([, r]) => Math.round(r.oSum / r.oCnt))
  const pron = sorted.map(([, r]) => (r.pCnt ? Math.round(r.pSum / r.pCnt) : 0))
  return { labels, overall, pron }
}

async function loadClassData() {
  loading.value = true
  loadError.value = ''
  try {
    const classes = await getTeacherClasses()
    const found = classes.find((item) => item.class_id === classId.value)
    if (found) {
      className.value = found.class_name
      studentCount.value = found.student_count
      createdAt.value = found.created_at ? String(found.created_at).slice(0, 10) : ''
    } else if (classId.value) {
      className.value = classId.value
    }

    const students = await getTeacherClassStudents(classId.value)
    if (students.length) studentCount.value = students.length

    evaluationCount.value = students.reduce((sum, st) => sum + st.evaluation_count, 0)
    const scores = students.map((st) => st.average_score).filter((s): s is number => s != null)
    overallScore.value = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    distributionData.value = computeDistribution(scores)
    distributionTotal.value = scores.length
    excellentRate.value = scores.length ? Math.round((scores.filter((s) => s >= 90).length / scores.length) * 100) : 0

    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
    activeCount.value = students.filter((st) => st.last_evaluation && new Date(st.last_evaluation).getTime() >= weekAgo).length

    const latestEval = students.map((st) => st.last_evaluation).filter(Boolean).sort().pop()
    updatedAt.value = latestEval
      ? new Date(String(latestEval)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    await loadCompletion()

    const userIds = students.map((st) => String(st.user_id))
    const dimSum = { pronunciation: 0, rhythm: 0, fluency: 0, completeness: 0 }
    let dimCnt = 0
    await mapWithConcurrency(userIds, 6, async (uid) => {
      try {
        const a = await getStudentAnalysis(classId.value, uid)
        if (a?.dimension_scores) {
          dimSum.pronunciation += a.dimension_scores.pronunciation
          dimSum.rhythm += a.dimension_scores.rhythm
          dimSum.fluency += a.dimension_scores.fluency
          dimSum.completeness += a.dimension_scores.completeness
          dimCnt++
        }
      } catch {
        /* 单个学生分析失败不影响整体 */
      }
    })
    if (dimCnt) {
      averagePron.value = Math.round(dimSum.pronunciation / dimCnt)
      averageRhythm.value = Math.round(dimSum.rhythm / dimCnt)
      averageFluency.value = Math.round(dimSum.fluency / dimCnt)
      averageCompleteness.value = Math.round(dimSum.completeness / dimCnt)
    }

    const progressList: (StudentProgressResponse | null)[] = []
    await mapWithConcurrency(userIds, 6, async (uid) => {
      try {
        progressList.push(await getStudentProgress(uid))
      } catch {
        progressList.push(null)
      }
    })
    const agg = aggregateTrend(progressList)
    trendLabels.value = agg.labels
    trendOverall.value = agg.overall
    trendPron.value = agg.pron

    await nextTick()
    renderCharts()
  } catch {
    loadError.value = '数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function loadCompletion() {
  try {
    const tasks = await getTeacherClassTasks(classId.value)
    if (!tasks.length) {
      completionRate.value = 0
      return
    }
    const totalFinished = tasks.reduce((sum, t) => sum + t.finished_students_count, 0)
    const totalSlots = tasks.length * Math.max(1, studentCount.value)
    completionRate.value = totalSlots ? Math.round((totalFinished / totalSlots) * 100) : 0
  } catch {
    completionRate.value = 0
  }
}

function refreshData() {
  loadClassData()
}

onMounted(() => {
  loadClassData()
})

onBeforeUnmount(() => {
  trendChart?.destroy()
  distributionChart?.destroy()
})
</script>

<template>
  <div class="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-6 px-6 py-6 xl:px-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-gray-500">教师端 / 数据统计</p>
        <h1 class="mt-1 text-[28px] font-extrabold tracking-[-0.03em] text-gray-900">班级分析</h1>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-transform duration-200 hover:-translate-y-0.5 shadow-[0_2px_4px_rgba(36,50,56,0.04)]"
        @click="router.push('/teacher/overview')"
      >
        <ArrowLeft class="h-4 w-4 text-[#58CC02]" />
        <span>返回首页</span>
      </button>
    </header>

    <div v-if="loadError" class="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
      {{ loadError }}
    </div>

    <section
      class="rounded-[28px] border border-[#D2F2A8] p-6"
      style="
        background: linear-gradient(135deg, rgba(243,253,232,1) 0%, rgba(255,255,255,1) 55%, rgba(233,247,255,0.95) 100%);
        box-shadow: 0 2px 4px rgba(36,50,56,0.05);
      "
    >
      <div class="flex flex-wrap items-start justify-between gap-6">
        <div class="flex min-w-[320px] flex-1 items-start gap-4">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#58CC02] text-white">
            <Award class="h-7 w-7" />
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-3">
              <h2 class="text-[30px] font-extrabold tracking-[-0.04em] text-gray-900">{{ className }}</h2>
              <span class="rounded-full border border-[#D2F2A8] bg-white px-3 py-1 text-xs font-bold text-[#58CC02]">学习分析</span>
              <span
                class="rounded-full border bg-[#E9F7FF] px-3 py-1 text-xs font-bold text-[#1CB0F6]"
                style="border-color: rgba(28,176,246,0.18)"
              >
                信息更新于 {{ updatedAt }}
              </span>
            </div>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
              本周班级各维度表现已同步至最新评测，建议继续关注高频评测后的节奏波动，并把教学建议优先投放给中段学生。
            </p>
            <div class="mt-5 flex flex-wrap gap-3">
              <div class="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-gray-800">
                <Users class="h-4 w-4 text-[#58CC02]" />
                <span>班级人数 {{ studentCount }} 人</span>
              </div>
              <div class="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-gray-800">
                <Clipboard class="h-4 w-4 text-[#1CB0F6]" />
                <span>测评次数 {{ evaluationCount }} 次</span>
              </div>
              <div class="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-gray-800">
                <Calendar class="h-4 w-4 text-gray-500" />
                <span>创建时间 {{ createdAt || '--' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="grid min-w-[280px] shrink-0 grid-cols-2 gap-3">
          <div class="rounded-[22px] border border-[#E2E8F0] bg-white px-4 py-4 shadow-[0_2px_4px_rgba(36,50,56,0.04)]">
            <p class="text-xs font-semibold tracking-[0.12em] text-gray-500">完成率</p>
            <p class="mt-2 text-3xl font-extrabold text-gray-900">{{ completionRate }}%</p>
            <p class="mt-1 text-xs text-[#58CC02]">基于班级任务提交</p>
          </div>
          <div class="rounded-[22px] border border-[#E2E8F0] bg-white px-4 py-4 shadow-[0_2px_4px_rgba(36,50,56,0.04)]">
            <p class="text-xs font-semibold tracking-[0.12em] text-gray-500">优秀占比</p>
            <p class="mt-2 text-3xl font-extrabold text-gray-900">{{ excellentRate }}%</p>
            <p class="mt-1 text-xs text-[#1CB0F6]">90 分及以上学生</p>
          </div>
          <div class="col-span-2 rounded-[22px] border border-[#D2F2A8] bg-white px-4 py-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold tracking-[0.12em] text-gray-500">本周观察</p>
                <p class="mt-2 text-sm font-semibold text-gray-900">班级综合均分 {{ overallScore }}，建议结合薄弱项安排针对性复测。</p>
              </div>
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF9E6] text-[#58CC02]">
                <TrendingUp class="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="flex flex-wrap gap-3">
      <button
        v-for="(tab, index) in tabs"
        :key="tab"
        class="rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200"
        :class="
          index === 0
            ? 'border border-[#D2F2A8] bg-[#F4FDE8] text-[#58CC02]'
            : 'border border-[#E2E8F0] bg-white text-gray-800 hover:border-[#D2F2A8] hover:text-[#58CC02]'
        "
      >
        {{ tab }}
      </button>
    </section>

    <section class="rounded-[24px] border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_2px_4px_rgba(36,50,56,0.04)]">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF9E6] text-[#58CC02]">
            <SlidersHorizontal class="h-5 w-5" />
          </span>
          <div>
            <p class="text-sm font-bold text-gray-900">筛选条件</p>
            <p class="text-xs text-gray-500">快速查看班级阶段表现</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button class="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800">
            <Calendar class="h-4 w-4 text-[#58CC02]" />
            <span>近 30 天</span>
            <ChevronDown class="h-4 w-4 text-gray-500" />
          </button>
          <button class="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800">
            <FileText class="h-4 w-4 text-[#1CB0F6]" />
            <span>全部测评</span>
            <ChevronDown class="h-4 w-4 text-gray-500" />
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-[#D2F2A8] bg-[#58CC02] px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
            :disabled="loading"
            @click="refreshData"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            <span>{{ loading ? '加载中' : '刷新数据' }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <article
        v-for="card in metricCards"
        :key="card.label"
        class="rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_4px_rgba(36,50,56,0.04)]"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-gray-500">{{ card.label }}</p>
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl" :class="iconToneClass(card.tone)">
            <component :is="card.icon" class="h-5 w-5" />
          </span>
        </div>
        <div class="mt-5 flex items-end justify-between gap-3">
          <p class="text-[34px] font-extrabold tracking-[-0.04em] text-gray-900">{{ card.value }}</p>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="badgeToneClass(card.tone)">{{ card.badge }}</span>
        </div>
        <div class="mt-4 h-2 rounded-full" :class="barToneClass(card.tone)">
          <div class="h-full rounded-full" :class="barFillToneClass(card.tone)" :style="{ width: `${Math.min(100, Math.max(0, card.value))}%` }"></div>
        </div>
      </article>
    </section>

    <section class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.95fr)]">
      <article class="rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_4px_rgba(36,50,56,0.04)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-gray-500">趋势总览</p>
            <h3 class="mt-1 text-xl font-extrabold tracking-[-0.03em] text-gray-900">班级表现趋势</h3>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800">
              <span class="h-2 w-2 rounded-full bg-[#58CC02]"></span>
              综合得分
            </span>
            <span class="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800">
              <span class="h-2 w-2 rounded-full bg-[#1CB0F6]"></span>
              发音得分
            </span>
          </div>
        </div>
        <div class="mt-5 h-[360px] rounded-[24px] border border-[#E2E8F0] p-4" style="background: linear-gradient(180deg, rgba(248,250,251,1) 0%, rgba(255,255,255,1) 100%)">
          <div v-if="!trendLabels.length" class="flex h-full items-center justify-center text-sm text-gray-400">暂无趋势数据</div>
          <canvas v-else ref="trendCanvas"></canvas>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-[20px] border border-[#E2E8F0] bg-gray-50 px-4 py-3">
            <p class="text-xs font-semibold text-gray-500">平均综合</p>
            <p class="mt-1 text-base font-bold text-gray-900">{{ overallScore }} 分</p>
          </div>
          <div class="rounded-[20px] border border-[#E2E8F0] bg-gray-50 px-4 py-3">
            <p class="text-xs font-semibold text-gray-500">本周活跃</p>
            <p class="mt-1 text-base font-bold text-gray-900">{{ activeCount }} 人</p>
          </div>
          <div class="rounded-[20px] border border-[#E2E8F0] bg-gray-50 px-4 py-3">
            <p class="text-xs font-semibold text-gray-500">测评次数</p>
            <p class="mt-1 text-base font-bold text-gray-900">{{ evaluationCount }} 次</p>
          </div>
        </div>
      </article>

      <div class="grid min-h-0 grid-cols-1 gap-4">
        <article class="rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_4px_rgba(36,50,56,0.04)]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-500">结构总览</p>
              <h3 class="mt-1 text-xl font-extrabold tracking-[-0.03em] text-gray-900">得分分布</h3>
            </div>
            <span class="rounded-full border bg-[#E9F7FF] px-3 py-1 text-xs font-semibold text-[#1CB0F6]" style="border-color: rgba(28,176,246,0.18)">
              共 {{ distributionTotal }} 人
            </span>
          </div>
          <div class="mt-5 flex flex-col items-center gap-4 rounded-[24px] border border-[#E2E8F0] p-4" style="background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,251,1) 100%)">
            <div class="h-[260px] w-full max-w-[280px]">
              <div v-if="!distributionData.some((v) => v > 0)" class="flex h-full items-center justify-center text-sm text-gray-400">暂无分布数据</div>
              <canvas v-else ref="distributionCanvas"></canvas>
            </div>
            <div class="grid w-full grid-cols-2 gap-3">
              <div class="rounded-[18px] border border-[#E2E8F0] bg-white px-3 py-3">
                <div class="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#58CC02]"></span>
                  90-100 分
                </div>
                <p class="mt-2 text-lg font-extrabold text-gray-900">{{ distributionData[0] }} 人</p>
              </div>
              <div class="rounded-[18px] border border-[#E2E8F0] bg-white px-3 py-3">
                <div class="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#1CB0F6]"></span>
                  80-89 分
                </div>
                <p class="mt-2 text-lg font-extrabold text-gray-900">{{ distributionData[1] }} 人</p>
              </div>
              <div class="rounded-[18px] border border-[#E2E8F0] bg-white px-3 py-3">
                <div class="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#F8D25C]"></span>
                  70-79 分
                </div>
                <p class="mt-2 text-lg font-extrabold text-gray-900">{{ distributionData[2] }} 人</p>
              </div>
              <div class="rounded-[18px] border border-[#E2E8F0] bg-white px-3 py-3">
                <div class="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#EF4444]"></span>
                  70 分以下
                </div>
                <p class="mt-2 text-lg font-extrabold text-gray-900">{{ distributionData[3] }} 人</p>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_4px_rgba(36,50,56,0.04)]">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-500">教学提醒</p>
              <h3 class="mt-1 text-xl font-extrabold tracking-[-0.03em] text-gray-900">本周洞察</h3>
            </div>
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF9E6] text-[#58CC02]">
              <Lightbulb class="h-5 w-5" />
            </span>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex items-start gap-3 rounded-[20px] border border-[#E2E8F0] bg-gray-50 px-4 py-3">
              <span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF9E6] text-[#58CC02]">
                <Check class="h-4 w-4" />
              </span>
              <div>
                <p class="text-sm font-bold text-gray-900">完整度优势明显</p>
                <p class="mt-1 text-xs leading-5 text-gray-500">班级完整度均分 {{ averageCompleteness }}，学生在长句跟读任务中更稳定，可把完整度训练迁移到综合表达环节。</p>
              </div>
            </div>
            <div class="flex items-start gap-3 rounded-[20px] border border-[#E2E8F0] bg-gray-50 px-4 py-3">
              <span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF9E6] text-[#664A00]">
                <TriangleAlert class="h-4 w-4" />
              </span>
              <div>
                <p class="text-sm font-bold text-gray-900">流利度需追踪</p>
                <p class="mt-1 text-xs leading-5 text-gray-500">流利度均分 {{ averageFluency }}，建议关注 70-79 分区间学生，增加跟读后即时复述。</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
