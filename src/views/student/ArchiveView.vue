<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Search,
  Radar,
  CircleAlert,
  CircleCheckBig,
  MessageSquareQuote,
  TriangleAlert,
  Lightbulb,
  Headphones,
  History,
  PlayCircle,
  Square,
  Loader2,
} from 'lucide-vue-next'
import {
  getStudentTasks,
  getStudentTaskAttemptStats,
  getStudentTaskRecords,
  getStudentSessionDetails,
  getSentenceStdAudio,
  getStudentEvaluationAudio,
} from '../../api/endpoints'
import type {
  StudentSessionEvaluationItem,
  StudentTaskAttemptStat,
  StudentTaskItem,
} from '../../api/endpoints'
import {
  getStudentTaskAvailability,
  getStudentTaskAvailabilityFromApi,
  studentTaskAvailabilityLabels,
} from '../../utils/studentTaskAvailability'
import { useToast } from '../../composables/useToast'

type TabKey = 'multidim' | 'weak'

/** 左侧列表项：任务（task 级） */
type TaskCardItem = {
  id: string
  title: string
  typeLabel: string
  typeClass: string
  statusLabel: string
  statusClass: string
  score: string
  scoreClass: string
  date: string
  summary: string
}

/** 某个任务的第 N 次提交（一次提交 = 一个 session） */
type AttemptItem = {
  sessionId: string
  index: number
  score: string
  scoreClass: string
  date: string
}

/** 句子内单个单词（含音素明细），用于下划线标注与悬停浮层 */
type WordItem = {
  /** 所属句子的评测 id：词级发音用它拉取整句用户录音 */
  evalId: string
  word: string
  score: number
  errorType: string
  /** 该词在整句用户录音中的起始时间（毫秒） */
  startMs: number
  /** 该词在整句用户录音中的持续时长（毫秒） */
  durationMs: number
  phonemes: Array<{ phoneme: string; score: number }>
}

/** 一次提交中的单句评测块 */
type SentenceBlock = {
  key: string
  evalId: string
  lineNumber: number
  text: string
  total: number
  fluency: number
  completeness: number
  pronunciation: number
  polygon: string
  points: Array<{ x: number; y: number }>
  words: WordItem[]
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const clampScore = (value: unknown) => Math.max(0, Math.min(100, Math.round(toNumber(value))))

/** 红黄绿档位：≥80 优秀 / 60-79 及格 / <60 待改进 */
const scoreTone = (value: number) => (value >= 80 ? 'good' : value >= 60 ? 'mid' : 'bad')

const underlineColor = (value: number) => {
  const tone = scoreTone(value)
  if (tone === 'good') return 'bg-[#58CC02]'
  if (tone === 'mid') return 'bg-[#FFC107]'
  return 'bg-[#FF6B6B]'
}

const scoreTextClass = (value: number) => {
  const tone = scoreTone(value)
  if (tone === 'good') return 'text-[#58CC02]'
  if (tone === 'mid') return 'text-[#EAB308]'
  return 'text-[#EF4444]'
}

/** SVG 文本无法用类名，这里给出同色系的十六进制值 */
const scoreColor = (value: number) => {
  const tone = scoreTone(value)
  if (tone === 'good') return '#58CC02'
  if (tone === 'mid') return '#EAB308'
  return '#EF4444'
}

const taskScoreClass = (score: number) => {
  if (score >= 90) return 'text-[#22C55E]'
  if (score >= 80) return 'text-[#58CC02]'
  if (score >= 60) return 'text-[#FACC15]'
  return 'text-[#EF4444]'
}

const tasks = ref<TaskCardItem[]>([])
const loading = ref(true)
const loadError = ref('')

const selectedTaskId = ref('')
const selectedTaskTitle = computed(() => tasks.value.find((item) => item.id === selectedTaskId.value)?.title ?? '')

const attempts = ref<AttemptItem[]>([])
const attemptsLoading = ref(false)
const selectedSessionId = ref('')

const sessionDetails = ref<StudentSessionEvaluationItem[]>([])
const detailLoading = ref(false)
const detailError = ref('')

const activeTab = ref<TabKey>('multidim')

// ---- 三维雷达图几何（流畅度/完整度/发音准确度，网格与坐标轴与数据无关，只算一次） ----
const RADAR_CENTER = { x: 150, y: 112 }
const RADAR_RADIUS = 80
const RADAR_DIMENSIONS = [
  { key: 'fluency', text: '流畅度' },
  { key: 'completeness', text: '完整度' },
  { key: 'pronunciation', text: '发音准确度' },
] as const
const axisAngle = (i: number) => -90 + i * 120
const radarPoint = (i: number, score: number) => {
  const rad = (axisAngle(i) * Math.PI) / 180
  const r = (clampScore(score) / 100) * RADAR_RADIUS
  return { x: RADAR_CENTER.x + Math.cos(rad) * r, y: RADAR_CENTER.y + Math.sin(rad) * r }
}
const RADAR_RING = [25, 50, 75, 100].map((value) =>
  RADAR_DIMENSIONS.map((_, i) => radarPoint(i, value))
    .map((p) => `${p.x},${p.y}`)
    .join(' '),
)
const RADAR_AXES = RADAR_DIMENSIONS.map((_, i) => {
  const p = radarPoint(i, 100)
  return { x1: RADAR_CENTER.x, y1: RADAR_CENTER.y, x2: p.x, y2: p.y }
})
const RADAR_LABELS = RADAR_DIMENSIONS.map((dim, i) => {
  const p = radarPoint(i, 100)
  const dx = p.x - RADAR_CENTER.x
  const dy = p.y - RADAR_CENTER.y
  const len = Math.hypot(dx, dy) || 1
  return {
    key: dim.key,
    text: dim.text,
    x: p.x + (dx / len) * 16,
    y: p.y + (dy / len) * 16,
    anchor: Math.abs(dx / len) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end',
  }
})

/** 选中这次提交 → 逐句评测块（自上而下按 line_number 排列） */
const sentenceBlocks = computed<SentenceBlock[]>(() =>
  sessionDetails.value.map((item, index) => {
    const values = [item.fluency, item.completeness, item.pronunciation]
    const points = values.map((value, i) => radarPoint(i, toNumber(value)))
    return {
      key: item.eval_id || `${item.line_number}-${index}`,
      evalId: item.eval_id,
      lineNumber: toNumber(item.line_number) || index + 1,
      text: item.sentence_text,
      total: clampScore(item.total_score),
      fluency: clampScore(item.fluency),
      completeness: clampScore(item.completeness),
      pronunciation: clampScore(item.pronunciation),
      polygon: points.map((p) => `${p.x},${p.y}`).join(' '),
      points,
      words: (item.words ?? []).map((word) => ({
        evalId: item.eval_id,
        word: word.word,
        score: clampScore(word.overall ?? word.pronunciation),
        errorType: word.error_type && word.error_type !== 'None' ? word.error_type : '',
        startMs: toNumber(word.start_ms),
        durationMs: toNumber(word.duration_ms),
        phonemes: (word.phonemes ?? []).map((phoneme) => ({
          phoneme: phoneme.phoneme,
          score: clampScore(phoneme.pronunciation),
        })),
      })),
    }
  }),
)

/** 该次提交内所有音素得分（跨句聚合），用于薄弱环节统计 */
const attemptPhonemes = computed<Array<{ phoneme: string; score: number }>>(() => {
  const map = new Map<string, number[]>()
  for (const item of sessionDetails.value) {
    for (const word of item.words ?? []) {
      for (const phoneme of word.phonemes ?? []) {
        const scores = map.get(phoneme.phoneme)
        if (scores) scores.push(toNumber(phoneme.pronunciation))
        else map.set(phoneme.phoneme, [toNumber(phoneme.pronunciation)])
      }
    }
  }
  return Array.from(map.entries())
    .map(([phoneme, scores]) => ({
      phoneme,
      score: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
    }))
    .sort((a, b) => b.score - a.score)
})

const weakPhonemes = computed(() =>
  attemptPhonemes.value.filter((item) => item.score < 70).sort((a, b) => a.score - b.score),
)

// ---- 逐句音频：我的录音（复用教师端按 evaluation_id 取音频的接口）与 TTS 标准录音 ----
type AudioKind = 'mine' | 'std'

const toast = useToast()
// 全局同一时刻只播一条：audioKind/audioKey 标记当前播放（或加载中）的音频
const audioKind = ref<AudioKind | null>(null)
const audioKey = ref('')
const audioLoading = ref(false)
const audioProgress = ref(0)

let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl: string | null = null
let stopCurrentPlayback: (() => void) | null = null
// 递增令牌：切换句子/重新播放时作废旧的回调
let playbackToken = 0

const isAudioLoading = (key: string, kind: AudioKind) =>
  audioLoading.value && audioKey.value === key && audioKind.value === kind
const isAudioPlaying = (key: string, kind: AudioKind) =>
  !audioLoading.value && audioKey.value === key && audioKind.value === kind
const isBlockPlaying = (key: string) => !audioLoading.value && audioKey.value === key

const stopAudio = () => {
  playbackToken += 1
  releaseWordAudio()
  const pending = stopCurrentPlayback
  stopCurrentPlayback = null
  if (currentAudio) {
    // 先解绑事件，避免暂停触发 ended/error 造成「播放失败」误报
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.ontimeupdate = null
    currentAudio.pause()
    currentAudio = null
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl)
    currentAudioUrl = null
  }
  pending?.()
  audioKind.value = null
  audioKey.value = ''
  audioLoading.value = false
  audioProgress.value = 0
}

const playAudioBlob = (blob: Blob, token: number) =>
  new Promise<void>((resolve) => {
    const url = URL.createObjectURL(blob)
    currentAudioUrl = url
    const audio = new Audio(url)
    currentAudio = audio
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      stopCurrentPlayback = null
      if (currentAudio === audio) currentAudio = null
      if (currentAudioUrl === url) {
        URL.revokeObjectURL(url)
        currentAudioUrl = null
      }
      resolve()
    }
    stopCurrentPlayback = finish
    audio.ontimeupdate = () => {
      if (token !== playbackToken) return
      audioProgress.value =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.min((audio.currentTime / audio.duration) * 100, 100)
          : 0
    }
    audio.onended = finish
    audio.onerror = () => {
      if (token === playbackToken) toast.push('音频播放失败', 'error')
      finish()
    }
    void audio.play().catch(() => {
      if (token === playbackToken) toast.push('音频播放失败，请检查浏览器音频权限', 'error')
      finish()
    })
  })

const playSentenceAudio = async (block: SentenceBlock, kind: AudioKind) => {
  stopAudio()
  const token = playbackToken
  audioKind.value = kind
  audioKey.value = block.key
  audioLoading.value = true
  try {
    const blob =
      kind === 'mine'
        ? await getStudentEvaluationAudio(block.evalId)
        // 档案页都是「任务」记录：标准录音以 task_id 落盘，必须传 task_id，
        // 传 session_id 会落到后端 session 分支而查不到文件（500）。
        : await getSentenceStdAudio(selectedTaskId.value, Math.max(block.lineNumber - 1, 0))
    if (token !== playbackToken) return
    audioLoading.value = false
    await playAudioBlob(blob, token)
  } catch (error) {
    if (token !== playbackToken) return
    toast.push(error instanceof Error ? error.message : '音频获取失败，请稍后重试', 'error')
  } finally {
    if (token === playbackToken) stopAudio()
  }
}

// 点击同一句同一类型时停止，否则切换播放
const toggleSentenceAudio = (block: SentenceBlock, kind: AudioKind) => {
  if (!audioLoading.value && audioKey.value === block.key && audioKind.value === kind) {
    stopAudio()
    return
  }
  void playSentenceAudio(block, kind)
}

// ---- 单词悬停浮层：fixed + Teleport 到 body，避免被容器 overflow 裁切 ----
const hoveredWord = ref<WordItem | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
// 鼠标从单词移到浮层上时不该立刻收起，留一小段缓冲时间
let hideTooltipTimer: number | null = null

const cancelHideTooltip = () => {
  if (hideTooltipTimer !== null) {
    window.clearTimeout(hideTooltipTimer)
    hideTooltipTimer = null
  }
}

const scheduleHideTooltip = () => {
  cancelHideTooltip()
  hideTooltipTimer = window.setTimeout(() => {
    hoveredWord.value = null
    hideTooltipTimer = null
  }, 180)
}

const showWordTooltip = (word: WordItem, event: MouseEvent) => {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  cancelHideTooltip()
  const rect = el.getBoundingClientRect()
  const width = 230
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 8), window.innerWidth - width - 8)
  const above = rect.top > 240
  hoveredWord.value = word
  tooltipStyle.value = {
    left: `${left}px`,
    top: above ? `${rect.top - 10}px` : `${rect.bottom + 10}px`,
    width: `${width}px`,
    transform: above ? 'translateY(-100%)' : 'none',
  }
}

const hideWordTooltip = () => {
  cancelHideTooltip()
  hoveredWord.value = null
}

// ---- 词级发音：没有独立接口，用整句用户录音按 start_ms / duration_ms 切片播放 ----
const wordAudioKey = ref('')
const wordAudioLoading = ref(false)
const wordAudioPlaying = ref(false)
let wordAudio: HTMLAudioElement | null = null
let wordAudioUrl: string | null = null
let wordAudioRafId = 0
// 递增令牌：切换单词或停止播放时作废旧回调
let wordAudioToken = 0

const wordAudioId = (word: WordItem) => `${word.evalId}:${word.startMs}:${word.word}`
const isWordAudioActive = (word: WordItem) =>
  wordAudioKey.value === wordAudioId(word) && (wordAudioLoading.value || wordAudioPlaying.value)

const releaseWordAudio = () => {
  wordAudioToken += 1
  if (wordAudioRafId) {
    window.cancelAnimationFrame(wordAudioRafId)
    wordAudioRafId = 0
  }
  if (wordAudio) {
    wordAudio.ontimeupdate = null
    wordAudio.onended = null
    wordAudio.onerror = null
    wordAudio.onloadedmetadata = null
    wordAudio.pause()
    wordAudio = null
  }
  if (wordAudioUrl) {
    URL.revokeObjectURL(wordAudioUrl)
    wordAudioUrl = null
  }
  wordAudioKey.value = ''
  wordAudioLoading.value = false
  wordAudioPlaying.value = false
}

// 后端下发的 start_ms / duration_ms 实际是 Azure 的 Offset / Duration，
// 单位为 ticks（100 纳秒）：1 毫秒 = 10,000 ticks，1 秒 = 10,000,000 ticks。
// HTMLMediaElement.currentTime 的单位是秒，故按「ticks/秒」换算。
const TICKS_PER_SECOND = 10_000_000

// 再次点击同一单词停止，否则从该词的 start_ms 播放 duration_ms 时长
const playWordAudio = async (word: WordItem) => {
  const key = wordAudioId(word)
  if (isWordAudioActive(word)) {
    releaseWordAudio()
    return
  }
  const { startMs, durationMs } = word
  if (!Number.isFinite(startMs) || startMs < 0 || !Number.isFinite(durationMs) || durationMs <= 0) {
    toast.push(`「${word.word}」暂无发音区间信息`, 'warning')
    return
  }
  stopAudio()
  const token = ++wordAudioToken
  wordAudioKey.value = key
  wordAudioLoading.value = true
  try {
    const blob = await getStudentEvaluationAudio(word.evalId)
    if (token !== wordAudioToken) return
    const url = URL.createObjectURL(blob)
    wordAudioUrl = url
    const audio = new Audio(url)
    audio.preload = 'auto'
    wordAudio = audio
    await new Promise<void>((resolve, reject) => {
      audio.onloadedmetadata = () => resolve()
      audio.onerror = () => reject(new Error('音频加载失败'))
      if (audio.readyState >= 1) resolve()
    })
    if (token !== wordAudioToken) return
    audio.currentTime = startMs / TICKS_PER_SECOND
    wordAudioLoading.value = false
    wordAudioPlaying.value = true
    const endSeconds = (startMs + durationMs) / TICKS_PER_SECOND
    // 按音频时钟判停，比 timeupdate（约 250ms 粒度）精确
    const watchProgress = () => {
      if (token !== wordAudioToken) return
      if (audio.currentTime >= endSeconds) {
        releaseWordAudio()
        return
      }
      wordAudioRafId = window.requestAnimationFrame(watchProgress)
    }
    wordAudioRafId = window.requestAnimationFrame(watchProgress)
    audio.onended = () => {
      if (token === wordAudioToken) releaseWordAudio()
    }
    audio.onerror = () => {
      if (token !== wordAudioToken) return
      toast.push('音频播放失败', 'error')
      releaseWordAudio()
    }
    await audio.play()
  } catch (error) {
    if (token !== wordAudioToken) return
    releaseWordAudio()
    toast.push(error instanceof Error ? error.message : '音频获取失败，请稍后重试', 'error')
  }
}

// 滚动（含容器内滚动）时锚点会漂移，直接收起浮层
const onAnyScroll = () => hideWordTooltip()

/** 右侧内容状态：加载中 / 出错 / 待选 / 可展示 */
const contentState = computed<'loading' | 'error' | 'empty' | 'ready'>(() => {
  if (attemptsLoading.value || detailLoading.value) return 'loading'
  if (detailError.value) return 'error'
  if (!selectedTaskId.value || !attempts.value.length || !selectedSessionId.value) return 'empty'
  if (!sentenceBlocks.value.length) return 'empty'
  return 'ready'
})

const placeholderText = computed(() => {
  if (!selectedTaskId.value) return '请选择左侧任务，查看该任务的提交与逐句评分'
  if (!attempts.value.length) return '该任务暂无提交记录'
  if (!selectedSessionId.value) return '请选择上方「第几次提交」，查看该次逐句评分'
  if (!sentenceBlocks.value.length) return '该次提交暂无句子评测明细'
  return ''
})

const taskWindowStatus = (item: StudentTaskItem) =>
  getStudentTaskAvailabilityFromApi(item.task_status) ??
  getStudentTaskAvailability({
    isActive: item.is_active,
    availableFrom: item.available_from,
    availableUntil: item.available_until,
    maxAttempts: item.max_submission,
    attemptCount: item.attempt_count,
  })

function mapTask(item: StudentTaskItem, attemptStat: StudentTaskAttemptStat): TaskCardItem {
  const rawScore = toNumber(item.avg_score)
  const hasScore = rawScore >= 0
  const status = taskWindowStatus(item)
  return {
    id: String(item.task_id),
    title: item.title || '未命名任务',
    typeLabel: item.task_type === 'homework' ? '作业' : '练习',
    typeClass: item.task_type === 'homework' ? 'bg-[#F0F9FF] text-[#0369A1]' : 'bg-[#F7FEE7] text-[#4D7C0F]',
    statusLabel: studentTaskAvailabilityLabels[status],
    statusClass: status === 'open' ? 'bg-[#EBF9E6] text-[#46A302]' : 'bg-[#F1F5F9] text-[#6B7280]',
    score: hasScore ? String(Math.round(rawScore)) : '--',
    scoreClass: hasScore ? taskScoreClass(Math.round(rawScore)) : 'text-[#9CA3AF]',
    date: item.created_at ? String(item.created_at).slice(0, 10) : '--',
    summary: `共 ${item.segmented_sentences?.length ?? 0} 句 · 已提交 ${attemptStat.count} 次`,
  }
}

async function selectAttempt(sessionId: string) {
  stopAudio()
  selectedSessionId.value = sessionId
  detailLoading.value = true
  detailError.value = ''
  try {
    const res = await getStudentSessionDetails(sessionId)
    sessionDetails.value = [...(res.details ?? [])].sort(
      (a, b) => toNumber(a.line_number) - toNumber(b.line_number),
    )
  } catch {
    sessionDetails.value = []
    detailError.value = '评测详情加载失败，请稍后重试'
  } finally {
    detailLoading.value = false
  }
}

/** 点击任务：先拉取该任务的提交记录，仅一次尝试则直接展示 */
async function selectTask(taskId: string) {
  stopAudio()
  selectedTaskId.value = taskId
  selectedSessionId.value = ''
  sessionDetails.value = []
  attempts.value = []
  detailError.value = ''
  attemptsLoading.value = true
  try {
    const res = await getStudentTaskRecords(taskId)
    // 先按时间正序编「第几次」（第 1 次 = 最早提交），再整体倒序展示，
    // 让最新一次提交排在最上面
    const list = (res.tasks ?? [])
      .map((record) => ({
        sessionId: record.session_id,
        score: toNumber(record.average_score),
        date: record.completed_at ? String(record.completed_at).slice(0, 10) : '--',
        sortKey: new Date(record.completed_at || record.created_at).getTime(),
      }))
      .sort((a, b) => (Number.isFinite(a.sortKey) ? a.sortKey : 0) - (Number.isFinite(b.sortKey) ? b.sortKey : 0))
    attempts.value = list
      .map((item, index) => ({
        sessionId: item.sessionId,
        index: index + 1,
        score: item.score >= 0 ? `${Math.round(item.score)} 分` : '暂无分数',
        scoreClass: item.score >= 0 ? taskScoreClass(Math.round(item.score)) : 'text-[#9CA3AF]',
        date: item.date,
      }))
      .reverse()
    if (attempts.value.length === 1) await selectAttempt(attempts.value[0].sessionId)
  } catch {
    attempts.value = []
    detailError.value = '提交记录加载失败，请稍后重试'
  } finally {
    attemptsLoading.value = false
  }
}

async function loadTasks() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getStudentTasks()
    const items = res.data ?? []
    // `student/tasks` 不返回提交次数，单独并发补齐，口径与右侧「共 N 次提交」一致
    const stats = await getStudentTaskAttemptStats(items.map((item) => item.task_id))
    const emptyStat: StudentTaskAttemptStat = { count: 0, lastSubmittedAt: 0 }
    // 按最后一次提交时间倒序：最近提交的任务排在最上面，未提交的任务排在最后
    tasks.value = items
      .map((item, index) => ({ item, stat: stats[index] ?? emptyStat, order: index }))
      .sort((a, b) => b.stat.lastSubmittedAt - a.stat.lastSubmittedAt || a.order - b.order)
      .map(({ item, stat }) => mapTask(item, stat))
    if (tasks.value.length) await selectTask(tasks.value[0].id)
  } catch {
    tasks.value = []
    loadError.value = '任务加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const retryCurrent = async () => {
  if (selectedSessionId.value) return selectAttempt(selectedSessionId.value)
  if (selectedTaskId.value) return selectTask(selectedTaskId.value)
  return loadTasks()
}

onMounted(() => {
  window.addEventListener('scroll', onAnyScroll, true)
  void loadTasks()
})

onBeforeUnmount(() => {
  stopAudio()
  cancelHideTooltip()
  window.removeEventListener('scroll', onAnyScroll, true)
})
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB] flex flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧：任务列表 -->
      <div class="w-[340px] bg-white border-r border-[#F1F5F9] flex flex-col flex-shrink-0">
        <div class="px-5 py-4 border-b border-[#F1F5F9]">
          <div class="flex items-center justify-between mb-1">
            <span class="text-lg font-black text-[#1F2937]">任务列表</span>
            <span class="px-2 py-0.5 rounded-full bg-[#EBF9E6] text-[#46A302] text-xs font-black">{{ tasks.length }}</span>
          </div>
          <div class="relative mt-2">
            <Search class="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索任务..."
              class="w-full pl-9 pr-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm font-medium placeholder-[#9CA3AF] focus:border-[#58CC02] focus:outline-none"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 no-scrollbar">
          <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#58CC02] rounded-full animate-spin mb-3"></div>
            <span class="text-sm font-bold text-[#9CA3AF]">正在加载任务…</span>
          </div>
          <div v-else-if="loadError && !tasks.length" class="flex flex-col items-center justify-center py-16 text-center">
            <CircleAlert class="w-10 h-10 text-[#EF4444] mb-3" />
            <span class="text-sm font-bold text-[#EF4444] mb-4">{{ loadError }}</span>
            <button
              class="px-5 py-2 bg-[#58CC02] text-white font-black text-sm rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer"
              @click="loadTasks"
            >
              重新加载
            </button>
          </div>
          <div v-else-if="!tasks.length" class="flex flex-col items-center justify-center py-16 text-center">
            <Search class="w-10 h-10 text-[#D1D5DB] mb-3" />
            <span class="text-sm font-bold text-[#9CA3AF]">暂无任务</span>
          </div>
          <template v-else>
            <div
              v-for="task in tasks"
              :key="task.id"
              class="p-4 rounded-2xl border-2 cursor-pointer transition"
              :class="
                task.id === selectedTaskId
                  ? 'border-[#58CC02] bg-[#F7FEE7]'
                  : 'border-[#F1F5F9] bg-white hover:border-[#58CC02]/30 hover:bg-[#F7FEE7]/50'
              "
              @click="selectTask(task.id)"
            >
              <div class="flex items-start justify-between mb-2">
                <span class="text-sm font-black text-[#1F2937]">{{ task.title }}</span>
                <span class="text-lg font-black" :class="task.scoreClass">{{ task.score }}</span>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black" :class="task.statusClass">
                  {{ task.statusLabel }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black" :class="task.typeClass">
                  {{ task.typeLabel }}
                </span>
                <span class="text-xs font-bold text-[#9CA3AF]">{{ task.date }}</span>
              </div>
              <div class="text-xs text-[#6B7280] font-medium truncate">{{ task.summary }}</div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧：提交选择 + 逐句评分 -->
      <div class="flex-1 flex flex-col bg-[#F8FAFB] overflow-hidden">
        <!-- 任务信息 + 第几次提交选择 -->
        <div class="bg-white px-6 py-4 border-b border-[#F1F5F9]">
          <template v-if="selectedTaskId">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-2 min-w-0">
                <History class="w-5 h-5 text-[#58CC02] shrink-0" />
                <span class="text-base font-black text-[#1F2937] truncate">{{ selectedTaskTitle }}</span>
              </div>
              <span class="text-xs font-bold text-[#9CA3AF] shrink-0">共 {{ attempts.length }} 次提交</span>
            </div>
            <div v-if="attempts.length" class="mt-3">
              <div class="mb-2 text-xs font-black text-[#6B7280]">
                {{ attempts.length > 1 ? '请选择要查看的提交：' : '该任务仅提交过一次：' }}
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="attempt in attempts"
                  :key="attempt.sessionId"
                  type="button"
                  class="flex items-center gap-2 rounded-xl border-2 px-4 py-2 transition cursor-pointer"
                  :class="
                    attempt.sessionId === selectedSessionId
                      ? 'border-[#58CC02] bg-[#F7FEE7]'
                      : 'border-[#F1F5F9] bg-white hover:border-[#58CC02]/40'
                  "
                  @click="selectAttempt(attempt.sessionId)"
                >
                  <span
                    class="text-sm font-black"
                    :class="attempt.sessionId === selectedSessionId ? 'text-[#46A302]' : 'text-[#1F2937]'"
                  >
                    第 {{ attempt.index }} 次
                  </span>
                  <span class="text-xs font-black" :class="attempt.scoreClass">{{ attempt.score }}</span>
                  <span class="text-xs font-bold text-[#9CA3AF]">{{ attempt.date }}</span>
                </button>
              </div>
            </div>
          </template>
          <div v-else class="text-sm font-bold text-[#9CA3AF]">请选择左侧任务</div>
        </div>

        <!-- 评测内容容器：与上方「第几次提交」选择区在视觉上区分开 -->
        <div class="flex-1 overflow-hidden p-5">
          <div class="flex h-full flex-col overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <!-- 容器头：Tab 导航（左） + 评分提示与图例（右上） -->
            <div class="flex items-center justify-between gap-4 border-b border-[#F1F5F9] px-5">
              <div class="flex items-center">
                <div
                  class="px-4 py-3.5 font-black text-sm border-b-[3px] flex items-center gap-2 cursor-pointer transition"
                  :class="
                    activeTab === 'multidim'
                      ? 'text-[#58CC02] border-[#58CC02]'
                      : 'text-[#6B7280] hover:text-[#3C3C3C] border-transparent'
                  "
                  @click="activeTab = 'multidim'"
                >
                  <Radar class="w-4 h-4" />
                  <span>逐句评分</span>
                </div>
                <div
                  class="px-4 py-3.5 font-bold text-sm border-b-[3px] flex items-center gap-2 cursor-pointer transition"
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
              <div
                v-if="activeTab === 'multidim'"
                class="hidden shrink-0 items-center gap-3 text-[11px] font-bold text-[#9CA3AF] md:flex"
              >
                <span class="hidden whitespace-nowrap xl:inline">悬停单词可查看音素详情</span>
                <span class="flex items-center gap-1.5 whitespace-nowrap">
                  <span class="h-1.5 w-4 rounded-full bg-[#58CC02]"></span>优秀 ≥ 80
                </span>
                <span class="flex items-center gap-1.5 whitespace-nowrap">
                  <span class="h-1.5 w-4 rounded-full bg-[#FFC107]"></span>及格 60-79
                </span>
                <span class="flex items-center gap-1.5 whitespace-nowrap">
                  <span class="h-1.5 w-4 rounded-full bg-[#FF6B6B]"></span>待改进 &lt; 60
                </span>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-5 no-scrollbar">
          <!-- 状态占位 -->
          <div v-if="contentState === 'loading'" class="flex flex-col items-center justify-center py-24 text-center">
            <div class="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#58CC02] rounded-full animate-spin mb-3"></div>
            <span class="text-sm font-bold text-[#9CA3AF]">正在加载评测详情…</span>
          </div>
          <div v-else-if="contentState === 'error'" class="flex flex-col items-center justify-center py-24 text-center">
            <CircleAlert class="w-10 h-10 text-[#EF4444] mb-3" />
            <span class="text-sm font-bold text-[#EF4444] mb-4">{{ detailError }}</span>
            <button
              class="px-5 py-2 bg-[#58CC02] text-white font-black text-sm rounded-xl border-b-4 border-[#46A302] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer"
              @click="retryCurrent"
            >
              重新加载
            </button>
          </div>
          <div v-else-if="contentState === 'empty'" class="flex flex-col items-center justify-center py-24 text-center">
            <MessageSquareQuote class="w-10 h-10 text-[#D1D5DB] mb-3" />
            <span class="text-sm font-bold text-[#9CA3AF]">{{ placeholderText }}</span>
          </div>

          <!-- Tab 1: 逐句评分（句子在左、雷达图在右，压缩纵向高度） -->
          <div
            v-show="contentState === 'ready' && activeTab === 'multidim'"
            class="flex flex-col gap-3"
          >
            <div
              v-for="block in sentenceBlocks"
              :key="block.key"
              class="relative flex items-center gap-4 rounded-2xl border border-[#F1F5F9] bg-white p-4"
            >
              <!-- 左：原句（逐词下划线） + 句子下方录音按钮 + 播放进度 -->
              <div class="flex min-w-0 flex-1 flex-col gap-3">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg bg-[#EBF9E6] text-[#46A302] text-xs font-black shrink-0">
                    第 {{ block.lineNumber }} 句
                  </span>
                  <span class="text-xs font-bold text-[#9CA3AF]">共 {{ block.words.length }} 词</span>
                </div>

                <!-- 原句即逐词评分：带下划线的单词，悬停查看音素详情 -->
                <div v-if="!block.words.length" class="text-lg font-black leading-relaxed tracking-wide text-[#1F2937]">{{ block.text }}</div>
                <div v-else class="flex flex-wrap items-end gap-x-3 gap-y-3">
                  <span
                    v-for="(word, wi) in block.words"
                    :key="`${word.word}-${wi}`"
                    class="inline-flex cursor-help flex-col items-stretch transition-transform hover:-translate-y-0.5"
                    @mouseenter="showWordTooltip(word, $event)"
                    @mouseleave="scheduleHideTooltip"
                  >
                    <span class="px-0.5 text-lg font-black leading-tight text-[#1F2937]">{{ word.word }}</span>
                    <span class="mt-1 h-1.5 w-full rounded-full" :class="underlineColor(word.score)"></span>
                  </span>
                </div>

                <!-- 句子音频（我的录音 / TTS 标准录音）：放在句子下方，长句换行也不会与右侧雷达图穿插 -->
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black transition cursor-pointer disabled:cursor-wait disabled:opacity-60"
                    :class="
                      isAudioPlaying(block.key, 'mine')
                        ? 'border-[#58CC02] bg-[#F7FEE7] text-[#46A302]'
                        : 'border-[#70C125]/30 bg-[#F0F7E2] text-[#70C125] hover:bg-[#E4F0D0]'
                    "
                    :disabled="isAudioLoading(block.key, 'mine')"
                    @click="toggleSentenceAudio(block, 'mine')"
                  >
                    <Loader2 v-if="isAudioLoading(block.key, 'mine')" class="h-3.5 w-3.5 animate-spin" />
                    <Square v-else-if="isAudioPlaying(block.key, 'mine')" class="h-3.5 w-3.5" />
                    <PlayCircle v-else class="h-3.5 w-3.5" />
                    <span>{{ isAudioPlaying(block.key, 'mine') ? '停止' : '我的录音' }}</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black transition cursor-pointer disabled:cursor-wait disabled:opacity-60"
                    :class="
                      isAudioPlaying(block.key, 'std')
                        ? 'border-[#1CB0F6] bg-[#F0F9FF] text-[#0369A1]'
                        : 'border-[#1CB0F6]/30 bg-[#F0F9FF] text-[#1CB0F6] hover:bg-[#E0F2FE]'
                    "
                    :disabled="isAudioLoading(block.key, 'std')"
                    @click="toggleSentenceAudio(block, 'std')"
                  >
                    <Loader2 v-if="isAudioLoading(block.key, 'std')" class="h-3.5 w-3.5 animate-spin" />
                    <Square v-else-if="isAudioPlaying(block.key, 'std')" class="h-3.5 w-3.5" />
                    <PlayCircle v-else class="h-3.5 w-3.5" />
                    <span>{{ isAudioPlaying(block.key, 'std') ? '停止' : '标准录音' }}</span>
                  </button>
                </div>

                <!-- 播放进度：仅在播放中显示 -->
                <div v-if="isBlockPlaying(block.key)" class="h-1 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    class="h-full transition-[width] duration-150 ease-linear"
                    :class="audioKind === 'std' ? 'bg-[#1CB0F6]' : 'bg-[#58CC02]'"
                    :style="{ width: `${audioProgress}%` }"
                  ></div>
                </div>
              </div>

              <!-- 右：三维雷达图（贴顶、略放大）；总分叠在雷达图右上角空白区，不单独占行 -->
              <div class="relative flex w-[400px] shrink-0 self-stretch items-start justify-end border-l border-[#F1F5F9] pl-6 pr-4">
                <!-- 总分：绝对定位叠放在雷达图右上角的空白处，与雷达图视为同一视觉块 -->
                <div class="pointer-events-none absolute right-4 top-0 flex items-baseline gap-1">
                  <span class="text-3xl font-black leading-none" :class="scoreTextClass(block.total)">{{ block.total }}</span>
                  <span class="text-xs font-bold text-[#9CA3AF]">分</span>
                </div>
                <svg width="284" height="180" viewBox="0 0 300 190">
                  <polygon
                    v-for="(ring, ri) in RADAR_RING"
                    :key="`ring-${ri}`"
                    :points="ring"
                    fill="none"
                    stroke="#E5E7EB"
                    stroke-width="1"
                  />
                  <line
                    v-for="(axis, ai) in RADAR_AXES"
                    :key="`axis-${ai}`"
                    :x1="axis.x1"
                    :y1="axis.y1"
                    :x2="axis.x2"
                    :y2="axis.y2"
                    stroke="#E5E7EB"
                    stroke-width="1"
                  />
                  <polygon
                    :points="block.polygon"
                    fill="rgba(88,204,2,0.15)"
                    stroke="#58CC02"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                  />
                  <circle
                    v-for="(point, pi) in block.points"
                    :key="`point-${pi}`"
                    :cx="point.x"
                    :cy="point.y"
                    r="4"
                    fill="#58CC02"
                    stroke="white"
                    stroke-width="2"
                  />
                  <text
                    v-for="(label, li) in RADAR_LABELS"
                    :key="`label-${li}`"
                    :text-anchor="label.anchor"
                    font-weight="900"
                    font-family="'Noto Sans SC', sans-serif"
                  >
                    <tspan :x="label.x" :y="label.y" font-size="11" fill="#9CA3AF">{{ label.text }}</tspan>
                    <tspan :x="label.x" :y="label.y + 15" font-size="15" :fill="scoreColor(block[label.key])">
                      {{ block[label.key] }}
                    </tspan>
                  </text>
                </svg>
              </div>
            </div>
          </div>

          <!-- Tab 2: 音素薄弱环节（按该次提交跨句统计） -->
          <div v-show="contentState === 'ready' && activeTab === 'weak'" class="flex flex-col gap-4">
            <div class="rounded-2xl border border-[#F1F5F9] p-6">
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
                  <p class="text-sm font-medium text-[#374151]">多听标准录音，模仿母语者的发音节奏和语调。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  </main>

  <!-- 单词得分浮层：fixed 定位并挂到 body，避免被容器裁切 -->
  <Teleport to="body">
    <div
      v-if="hoveredWord"
      class="fixed z-[60] rounded-xl border border-[#E8ECF2] bg-white/95 px-3 py-2.5 text-[#1F2937] shadow-[0_12px_32px_rgba(15,23,42,0.14)] backdrop-blur-sm"
      :style="tooltipStyle"
      @mouseenter="cancelHideTooltip"
      @mouseleave="scheduleHideTooltip"
    >
      <div class="flex items-center gap-1.5">
        <span class="truncate text-sm font-black tracking-tight">{{ hoveredWord.word }}</span>
        <!-- 播放该单词的用户发音：整句录音按 start_ms/duration_ms 切片 -->
        <button
          type="button"
          class="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-wait"
          :class="
            isWordAudioActive(hoveredWord)
              ? 'bg-[#58CC02] text-white'
              : 'bg-[#EBF9E6] text-[#46A302] hover:bg-[#DFF5D5]'
          "
          :title="isWordAudioActive(hoveredWord) ? '停止播放' : '播放我的该词发音'"
          :disabled="wordAudioLoading && isWordAudioActive(hoveredWord)"
          @click="playWordAudio(hoveredWord)"
        >
          <Loader2 v-if="wordAudioLoading && isWordAudioActive(hoveredWord)" class="h-3.5 w-3.5 animate-spin" />
          <Square v-else-if="isWordAudioActive(hoveredWord)" class="h-3.5 w-3.5" />
          <PlayCircle v-else class="h-3.5 w-3.5" />
        </button>
      </div>
      <div class="mt-1.5 flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-[#9CA3AF]">单词得分</span>
        <span class="text-sm font-black tabular-nums" :class="scoreTextClass(hoveredWord.score)">{{ hoveredWord.score }}</span>
        <span
          v-if="hoveredWord.errorType"
          class="ml-auto rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-black text-orange-600"
        >
          {{ hoveredWord.errorType }}
        </span>
      </div>
      <div v-if="hoveredWord.phonemes.length" class="mt-2 border-t border-[#F1F5F9] pt-2">
        <div class="mb-1.5 text-[10px] font-black tracking-wider text-[#9CA3AF]">音素得分</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(phoneme, pi) in hoveredWord.phonemes"
            :key="`${phoneme.phoneme}-${pi}`"
            class="rounded-md border border-[#EEF2F7] bg-[#F8FAFC] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[#64748B]"
          >
            {{ phoneme.phoneme }}
            <span class="font-black" :class="scoreTextClass(phoneme.score)">{{ phoneme.score }}</span>
          </span>
        </div>
      </div>
      <div v-else class="mt-2 border-t border-[#F1F5F9] pt-2 text-[10px] font-bold text-[#9CA3AF]">暂无音素级明细</div>
    </div>
  </Teleport>
</template>