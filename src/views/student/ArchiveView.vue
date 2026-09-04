<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  Radar,
  CircleAlert,
  MessageSquareQuote,
  Timer,
  CircleCheckBig,
  Mic,
  Type,
  TriangleAlert,
  Lightbulb,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import {
  getStudentTasks,
  getStudentTaskRecords,
  getStudentSessionDetails,
} from '../../api/endpoints'
import type { StudentSessionEvaluationItem } from '../../api/endpoints'

type TabKey = 'multidim' | 'weak'

type RecordItem = {
  id: string
  title: string
  score: number
  status: string
  statusClass: string
  scoreClass: string
  date: string
  snippet: string
}

const records = ref<RecordItem[]>([])
const loading = ref(true)
const loadError = ref('')
const activeTab = ref<TabKey>('multidim')
const selectedId = ref('')
const sessionDetails = ref<StudentSessionEvaluationItem[]>([])
const detailLoading = ref(false)
const activeSentenceIndex = ref(0)

const sentenceCount = computed(() => sessionDetails.value.length)
const showSentenceNav = computed(() => sentenceCount.value > 1)

const currentDetail = computed<StudentSessionEvaluationItem | null>(
  () => sessionDetails.value[activeSentenceIndex.value] ?? null,
)

const prevSentence = () => {
  if (activeSentenceIndex.value > 0) activeSentenceIndex.value -= 1
}
const nextSentence = () => {
  if (activeSentenceIndex.value < sentenceCount.value - 1) activeSentenceIndex.value += 1
}

const evalText = computed(() => currentDetail.value?.sentence_text ?? '等待选择评测记录…')
const totalScore = computed(() => Math.round(currentDetail.value?.total_score ?? 0))
const fluencyScore = computed(() => Math.round(currentDetail.value?.fluency ?? 0))
const completenessScore = computed(() => Math.round(currentDetail.value?.completeness ?? 0))
const pronunciationScore = computed(() => Math.round(currentDetail.value?.pronunciation ?? 0))

const scoreLevel = computed(() => {
  const s = totalScore.value
  if (s >= 90) return '优秀'
  if (s >= 80) return '良好'
  if (s >= 60) return '及格'
  return '待提高'
})

const wordScores = computed<Array<{ word: string; score: number; tone: string }>>(() => {
  const words = currentDetail.value?.words ?? []
  return words.map((w) => {
    const score = Math.round(w.overall ?? w.pronunciation ?? 0)
    const tone = score >= 88 ? 'good' : score >= 75 ? 'mid' : 'bad'
    return { word: w.word, score, tone }
  })
})

const phonemeScores = computed<Array<{ phoneme: string; score: number }>>(() => {
  const map = new Map<string, number[]>()
  for (const w of currentDetail.value?.words ?? []) {
    for (const p of w.phonemes ?? []) {
      const key = p.phoneme
      const arr = map.get(key)
      if (arr) arr.push(p.pronunciation)
      else map.set(key, [p.pronunciation])
    }
  }
  return Array.from(map.entries())
    .map(([phoneme, scores]) => ({ phoneme, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .sort((a, b) => b.score - a.score)
})

const weakPhonemes = computed(() => phonemeScores.value.filter((item) => item.score < 70).sort((a, b) => a.score - b.score))

// 动态雷达图（四维）
const RADAR_CENTER = { x: 150, y: 135 }
const RADAR_RADIUS = 95
const axisAngle = (i: number) => -90 + i * 90
const radarPoint = (i: number, score: number) => {
  const rad = (axisAngle(i) * Math.PI) / 180
  const r = (Math.max(0, Math.min(100, score)) / 100) * RADAR_RADIUS
  return { x: RADAR_CENTER.x + Math.cos(rad) * r, y: RADAR_CENTER.y + Math.sin(rad) * r }
}
const radarDataPoints = computed(() =>
  [totalScore.value, fluencyScore.value, completenessScore.value, pronunciationScore.value].map(
    (s, i) => radarPoint(i, s),
  ),
)
const radarPolygon = computed(() => radarDataPoints.value.map((p) => `${p.x},${p.y}`).join(' '))
const radarGrid = computed(() => [25, 50, 75, 100].map((v) => [0, 1, 2, 3].map((i) => radarPoint(i, v)).map((p) => `${p.x},${p.y}`).join(' ')))
const radarAxisLines = computed(() => [0, 1, 2, 3].map((i) => {
  const p = radarPoint(i, 100)
  return { x1: RADAR_CENTER.x, y1: RADAR_CENTER.y, x2: p.x, y2: p.y }
}))
const radarLabels = computed(() => {
  const labels = ['总分', '流畅度', '完整度', '发音准确度']
  return labels.map((text, i) => {
    const p = radarPoint(i, 100)
    const dx = p.x - RADAR_CENTER.x
    const dy = p.y - RADAR_CENTER.y
    const len = Math.hypot(dx, dy) || 1
    return {
      text,
      x: p.x + (dx / len) * 14,
      y: p.y + (dy / len) * 14,
      anchor: Math.abs(dx / len) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end',
    }
  })
})

const phonemeClasses = (score: number) => {
  if (score >= 88) return 'bg-[#F7FEE7] border-[#D9F99D] text-[#4D7C0F]'
  if (score >= 75) return 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1]'
  if (score >= 60) return 'bg-[#FEF3C7] border-[#FDE68A] text-[#CA8A04]'
  return 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
}

const phonemeScoreClass = (score: number) => {
  if (score >= 88) return 'text-[#22C55E]'
  if (score >= 75) return 'text-[#0EA5E9]'
  if (score >= 60) return 'text-[#EAB308]'
  return 'text-[#EF4444]'
}

const scoreStatus = (score: number) => {
  if (score >= 90) return { status: '优秀', statusClass: 'bg-[#DCFCE7] text-[#16A34A]', scoreClass: 'text-[#22C55E]' }
  if (score >= 80) return { status: '已完成', statusClass: 'bg-[#D9F99D] text-[#4D7C0F]', scoreClass: 'text-[#58CC02]' }
  if (score >= 60) return { status: '需复习', statusClass: 'bg-[#FEF3C7] text-[#CA8A04]', scoreClass: 'text-[#FACC15]' }
  return { status: '需提高', statusClass: 'bg-[#FEF2F2] text-[#EF4444]', scoreClass: 'text-[#EF4444]' }
}

function mapRecord(r: { session_id: string; title: string; average_score: number; completed_at: string | null }): RecordItem {
  const score = Math.round(r.average_score)
  const st = scoreStatus(score)
  return {
    id: r.session_id,
    title: r.title || '评测练习',
    score,
    status: st.status,
    statusClass: st.statusClass,
    scoreClass: st.scoreClass,
    date: r.completed_at ? String(r.completed_at).slice(0, 10) : '--',
    snippet: '',
  }
}

async function loadDetail(id: string) {
  selectedId.value = id
  detailLoading.value = true
  try {
    const res = await getStudentSessionDetails(id)
    sessionDetails.value = res.details ?? []
    activeSentenceIndex.value = 0
    loadError.value = ''
  } catch {
    sessionDetails.value = []
    loadError.value = '详情加载失败'
  } finally {
    detailLoading.value = false
  }
}

async function loadRecords() {
  loading.value = true
  try {
    const all: RecordItem[] = []
    const tasksRes = await getStudentTasks()
    const tasks = tasksRes.data ?? []
    for (const task of tasks) {
      const res = await getStudentTaskRecords(task.task_id)
      for (const r of res.tasks ?? []) all.push(mapRecord(r))
    }
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    records.value = all
    if (all.length) {
      await loadDetail(all[0].id)
    }
    loadError.value = ''
  } catch {
    records.value = []
    loadError.value = '记录加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadRecords)
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB] flex flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧：评测记录列表 -->
      <div class="w-[340px] bg-white border-r border-[#F1F5F9] flex flex-col flex-shrink-0">
        <div class="px-5 py-4 border-b border-[#F1F5F9]">
          <div class="flex items-center justify-between mb-1">
            <span class="text-lg font-black text-[#1F2937]">评测记录</span>
            <span class="px-2 py-0.5 rounded-full bg-[#EBF9E6] text-[#46A302] text-xs font-black">{{ records.length }}</span>
          </div>
          <div class="relative mt-2">
            <Search class="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索评测..."
              class="w-full pl-9 pr-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm font-medium placeholder-[#9CA3AF] focus:border-[#58CC02] focus:outline-none"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 no-scrollbar">
          <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#58CC02] rounded-full animate-spin mb-3"></div>
            <span class="text-sm font-bold text-[#9CA3AF]">正在加载评测记录…</span>
          </div>
          <div v-else-if="loadError && !records.length" class="flex flex-col items-center justify-center py-16 text-center">
            <CircleAlert class="w-10 h-10 text-[#EF4444] mb-3" />
            <span class="text-sm font-bold text-[#EF4444] mb-4">{{ loadError }}</span>
            <button
              class="px-5 py-2 bg-[#58CC02] text-white font-black text-sm rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer"
              @click="loadRecords"
            >
              重新加载
            </button>
          </div>
          <div v-else-if="!records.length" class="flex flex-col items-center justify-center py-16 text-center">
            <Search class="w-10 h-10 text-[#D1D5DB] mb-3" />
            <span class="text-sm font-bold text-[#9CA3AF]">暂无评测记录</span>
          </div>
          <template v-else>
            <div
              v-for="record in records"
              :key="record.id"
              class="p-4 rounded-2xl border-2 cursor-pointer transition"
              :class="
                record.id === selectedId
                  ? 'border-[#58CC02] bg-[#F7FEE7]'
                  : 'border-[#F1F5F9] bg-white hover:border-[#58CC02]/30 hover:bg-[#F7FEE7]/50'
              "
              @click="loadDetail(record.id)"
            >
              <div class="flex items-start justify-between mb-2">
                <span class="text-sm font-black text-[#1F2937]">{{ record.title }}</span>
                <span class="text-lg font-black" :class="record.scoreClass">{{ record.score }}</span>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase" :class="record.statusClass">
                  {{ record.status }}
                </span>
                <span class="text-xs font-bold text-[#9CA3AF]">{{ record.date }}</span>
              </div>
              <div class="text-xs text-[#6B7280] font-medium truncate">{{ record.snippet }}</div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧：详情内容 -->
      <div class="flex-1 flex flex-col bg-[#F8FAFB] overflow-hidden">
        <!-- Tab 导航 -->
        <div class="bg-white px-6 py-0 border-b border-[#F1F5F9] flex items-center">
          <div
            class="px-5 py-4 font-black text-sm border-b-[3px] flex items-center gap-2 cursor-pointer transition"
            :class="
              activeTab === 'multidim'
                ? 'text-[#58CC02] border-[#58CC02]'
                : 'text-[#6B7280] hover:text-[#3C3C3C] border-transparent'
            "
            @click="activeTab = 'multidim'"
          >
            <Radar class="w-4 h-4" />
            <span>多维评分</span>
          </div>
          <div
            class="px-5 py-4 font-bold text-sm border-b-[3px] flex items-center gap-2 cursor-pointer transition"
            :class="
              activeTab === 'weak'
                ? 'text-[#58CC02] border-[#58CC02] font-black'
                : 'text-[#6B7280] hover:text-[#3C3C3C] border-transparent'
            "
            @click="activeTab = 'weak'"
          >
            <CircleAlert class="w-4 h-4" />
            <span>音素薄弱环节</span>
          </div>
        </div>

        <!-- Tab 1: 多维评分 -->
        <div v-show="activeTab === 'multidim'" class="flex-1 overflow-y-auto p-6 flex flex-col gap-5 no-scrollbar">
          <div v-if="detailLoading" class="flex flex-col items-center justify-center py-24 text-center">
            <div class="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#58CC02] rounded-full animate-spin mb-3"></div>
            <span class="text-sm font-bold text-[#9CA3AF]">正在加载详情…</span>
          </div>
          <div v-else-if="!currentDetail" class="flex flex-col items-center justify-center py-24 text-center">
            <MessageSquareQuote class="w-10 h-10 text-[#D1D5DB] mb-3" />
            <span class="text-sm font-bold text-[#9CA3AF]">暂无评测详情</span>
          </div>
          <template v-else>
          <!-- A. 评测文本卡片 -->
          <div class="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <MessageSquareQuote class="w-5 h-5 text-[#1CB0F6]" />
                <span class="text-base font-black text-[#1F2937]">评测文本</span>
              </div>
              <!-- 多句切换 -->
              <div v-if="showSentenceNav" class="flex items-center gap-2">
                <button
                  type="button"
                  @click="prevSentence"
                  :disabled="activeSentenceIndex === 0"
                  class="p-1 rounded-lg text-[#58CC02] hover:bg-[#EBF9E6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="上一句"
                >
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <span class="text-sm font-black text-[#6B7280]">第 {{ activeSentenceIndex + 1 }} / {{ sentenceCount }} 句</span>
                <button
                  type="button"
                  @click="nextSentence"
                  :disabled="activeSentenceIndex === sentenceCount - 1"
                  class="p-1 rounded-lg text-[#58CC02] hover:bg-[#EBF9E6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="下一句"
                >
                  <ChevronRight class="w-5 h-5" />
                </button>
              </div>
            </div>
            <div class="text-xl font-black text-[#1F2937] leading-relaxed tracking-wide">{{ evalText }}</div>
          </div>

          <!-- B. 得分概览 + 雷达图 -->
          <div class="grid grid-cols-3 gap-5">
            <!-- 左侧：得分汇总卡片 -->
            <div class="col-span-1 flex flex-col gap-3">
              <div class="bg-gradient-to-br from-[#58CC02] to-[#46A302] rounded-2xl p-5 text-white shadow-[0_4px_20px_rgba(88,204,2,0.3)]">
                <div class="text-xs font-black uppercase tracking-wider opacity-80">综合得分</div>
                <div class="text-5xl font-black mt-1">{{ totalScore }}</div>
                <div class="text-xs font-bold opacity-80 mt-1">{{ scoreLevel }}</div>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-white rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center gap-1">
                  <Timer class="w-4 h-4 text-[#F59E0B]" />
                  <span class="text-xl font-black text-[#F59E0B]">{{ fluencyScore }}</span>
                  <span class="text-[10px] font-bold text-[#9CA3AF]">流畅度</span>
                </div>
                <div class="bg-white rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center gap-1">
                  <CircleCheckBig class="w-4 h-4 text-[#06B6D4]" />
                  <span class="text-xl font-black text-[#06B6D4]">{{ completenessScore }}</span>
                  <span class="text-[10px] font-bold text-[#9CA3AF]">完整度</span>
                </div>
                <div class="bg-white rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center gap-1">
                  <Mic class="w-4 h-4 text-[#1CB0F6]" />
                  <span class="text-xl font-black text-[#1CB0F6]">{{ pronunciationScore }}</span>
                  <span class="text-[10px] font-bold text-[#9CA3AF]">发音准确度</span>
                </div>
              </div>
            </div>

            <!-- 右侧：雷达图 -->
            <div class="col-span-2 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-5 flex flex-col">
              <div class="flex items-center gap-2 mb-2">
                <Radar class="w-5 h-5 text-[#58CC02]" />
                <span class="text-base font-black text-[#1F2937]">多维能力雷达图</span>
              </div>
              <div class="w-full h-64 flex items-center justify-center">
                <svg width="280" height="260" viewBox="0 0 300 280">
                  <polygon v-for="(grid, gi) in radarGrid" :key="`g${gi}`" :points="grid" fill="none" stroke="#E5E7EB" stroke-width="1" />
                  <line v-for="(axis, ai) in radarAxisLines" :key="`a${ai}`" :x1="axis.x1" :y1="axis.y1" :x2="axis.x2" :y2="axis.y2" stroke="#E5E7EB" stroke-width="1" />
                  <polygon :points="radarPolygon" fill="rgba(88,204,2,0.15)" stroke="#58CC02" stroke-width="2.5" stroke-linejoin="round" />
                  <circle v-for="(dp, di) in radarDataPoints" :key="`p${di}`" :cx="dp.x" :cy="dp.y" r="4" fill="#58CC02" stroke="white" stroke-width="2" />
                  <text
                    v-for="(lab, li) in radarLabels"
                    :key="`l${li}`"
                    :x="lab.x"
                    :y="lab.y"
                    :text-anchor="lab.anchor"
                    fill="#374151"
                    font-size="11"
                    font-weight="900"
                    font-family="'Noto Sans SC', sans-serif"
                  >
                    {{ lab.text }}
                  </text>
                </svg>
              </div>
            </div>
          </div>

          <!-- C. 单词评分详情 -->
          <div class="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6">
            <div class="flex items-center gap-2 mb-4">
              <Type class="w-5 h-5 text-[#1CB0F6]" />
              <span class="text-base font-black text-[#1F2937]">单词评分详情</span>
            </div>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="item in wordScores"
                :key="item.word"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm border"
                :class="
                  item.tone === 'good'
                    ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                    : item.tone === 'mid'
                      ? 'bg-[#FEF3C7] text-[#CA8A04] border-[#FDE68A]'
                      : 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]'
                "
              >
                {{ item.word }}<span class="ml-1 px-1.5 py-0.5 rounded-md bg-white/60 text-xs font-black">{{ item.score }}</span>
              </span>
            </div>
          </div>

          <!-- D. 音素评分详情 -->
          <div class="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6">
            <div class="flex items-center gap-2 mb-4">
              <Mic class="w-5 h-5 text-[#FF4BBD]" />
              <span class="text-base font-black text-[#1F2937]">音素评分详情</span>
            </div>
            <div class="grid grid-cols-6 gap-2">
              <div
                v-for="item in phonemeScores"
                :key="item.phoneme"
                class="flex flex-col items-center p-3 rounded-xl border-2 transition"
                :class="phonemeClasses(item.score)"
              >
                <span class="text-lg font-black font-mono">{{ item.phoneme }}</span>
                <span class="text-sm font-black" :class="phonemeScoreClass(item.score)">{{ item.score }}</span>
              </div>
            </div>
          </div>
          </template>
        </div>

        <!-- Tab 2: 音素薄弱环节 -->
        <div v-show="activeTab === 'weak'" class="flex-1 overflow-y-auto p-6 flex flex-col gap-5 no-scrollbar">
          <div class="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6">
            <div class="flex items-center gap-2 mb-4">
              <TriangleAlert class="w-5 h-5 text-[#EF4444]" />
              <span class="text-base font-black text-[#1F2937]">薄弱音素分析</span>
            </div>
            <p class="text-sm font-medium text-[#6B7280] mb-4">以下音素得分低于70分，建议重点练习：</p>
            <div v-if="!weakPhonemes.length" class="flex flex-col items-center justify-center py-12 text-center">
              <CircleCheckBig class="w-10 h-10 text-[#22C55E] mb-3" />
              <span class="text-sm font-bold text-[#9CA3AF]">很棒！暂无薄弱音素</span>
            </div>
            <div v-else class="grid grid-cols-2 gap-3">
              <div
                v-for="item in weakPhonemes"
                :key="item.phoneme"
                class="flex items-center gap-3 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA]"
              >
                <div class="w-12 h-12 rounded-xl bg-[#EF4444] flex items-center justify-center flex-shrink-0">
                  <span class="text-xl font-black text-white font-mono">/{{ item.phoneme }}/</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-black text-[#1F2937]">音素 /{{ item.phoneme }}/</span>
                    <span class="text-lg font-black text-[#EF4444]">{{ item.score }}</span>
                  </div>
                  <div class="h-2 bg-[#FECACA] rounded-full overflow-hidden">
                    <div class="h-full bg-[#EF4444] rounded-full" :style="{ width: item.score + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6">
            <div class="flex items-center gap-2 mb-4">
              <Lightbulb class="w-5 h-5 text-[#FFC800]" />
              <span class="text-base font-black text-[#1F2937]">练习建议</span>
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex items-start gap-3 p-3 rounded-xl bg-[#FFF9E6] border border-[#FFEBB3]">
                <div class="w-8 h-8 rounded-full bg-[#FFC800] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-sm font-black text-white">1</span>
                </div>
                <p class="text-sm font-medium text-[#374151]">针对薄弱音素，建议每天跟读标准录音 5 分钟，并注意口型到位。</p>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-xl bg-[#FFF9E6] border border-[#FFEBB3]">
                <div class="w-8 h-8 rounded-full bg-[#FFC800] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-sm font-black text-white">2</span>
                </div>
                <p class="text-sm font-medium text-[#374151]">将薄弱音素融入单词中反复练习，形成肌肉记忆。</p>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD]">
                <div class="w-8 h-8 rounded-full bg-[#1CB0F6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Headphones class="w-4 h-4 text-white" />
                </div>
                <p class="text-sm font-medium text-[#374151]">多听标准录音，模仿母语者的发音节奏和语调</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
