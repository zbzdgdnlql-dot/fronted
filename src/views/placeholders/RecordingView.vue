<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Mic, RotateCcw, Send, Square } from 'lucide-vue-next'
import {
  analyzeStudentPronTest,
  createStudentTestSession,
  getStudentTaskDetail,
  submitStudentTestSession,
  type CreateStudentTestSessionResponse,
  type StudentTaskDetail,
  type SubmitStudentTestSessionResponse,
} from '../../api/endpoints'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'

type SentenceStatus = 'pending' | 'recording' | 'analyzing' | 'done' | 'error'

type SentenceResult = {
  status: SentenceStatus
  score: number | null
  evaluationId: string | null
  error: string | null
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const taskReq = useAsync<{ ok: boolean; data: StudentTaskDetail }>()
const createReq = useAsync<CreateStudentTestSessionResponse>()
const submitReq = useAsync<SubmitStudentTestSessionResponse>()

const sessionId = ref<string | null>(null)
const activeIndex = ref(0)
const sentencePage = ref(1)
const results = ref<SentenceResult[]>([])
const recording = ref(false)
const analyzing = ref(false)
const submitResult = ref<SubmitStudentTestSessionResponse | null>(null)
const recorder = shallowRef<MediaRecorder | null>(null)
const stream = shallowRef<MediaStream | null>(null)
let recordedChunks: Blob[] = []

const routeValue = (value: unknown) => {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

const taskId = computed(() => routeValue(route.params.taskId) || routeValue(route.query.taskId))
const taskDetail = computed(() => taskReq.data.value?.data ?? null)
const segments = computed(() => taskDetail.value?.segments ?? [])
const sentencePageSize = 4
const currentSentence = computed(() => segments.value[activeIndex.value] ?? '')
const completedCount = computed(() => results.value.filter((item) => item.status === 'done').length)
const pageCount = computed(() => Math.max(1, Math.ceil(segments.value.length / sentencePageSize)))
const pageStartIndex = computed(() => (sentencePage.value - 1) * sentencePageSize)
const pageEndIndex = computed(() => Math.min(pageStartIndex.value + sentencePageSize, segments.value.length))
const pageSegments = computed(() => {
  return segments.value.slice(pageStartIndex.value, pageEndIndex.value).map((segment, offset) => ({
    segment,
    index: pageStartIndex.value + offset,
  }))
})
const progressPercent = computed(() => {
  if (!segments.value.length) return 0
  return Math.round((completedCount.value / segments.value.length) * 100)
})
const progressStyle = computed(() => ({ width: `${progressPercent.value}%` }))
const allSentencesCompleted = computed(() => segments.value.length > 0 && completedCount.value === segments.value.length)
const taskWindowStatus = computed<'inactive' | 'not_started' | 'ended' | 'open'>(() => {
  const task = taskDetail.value
  if (!task?.is_active) return 'inactive'

  const now = Date.now()
  const start = task.available_from ? new Date(task.available_from).getTime() : Number.NaN
  const end = task.available_until ? new Date(task.available_until).getTime() : Number.NaN
  if (Number.isFinite(start) && now < start) return 'not_started'
  if (Number.isFinite(end) && now > end) return 'ended'
  return 'open'
})
const taskWindowOpen = computed(() => taskWindowStatus.value === 'open')
const taskWindowLabel = computed(() => {
  const labels = {
    inactive: '未开放',
    not_started: '未开始',
    ended: '已结束',
    open: '可测试',
  }
  return labels[taskWindowStatus.value]
})
const taskWindowClass = computed(() => (taskWindowOpen.value ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'))
const taskWindowMessage = computed(() => {
  if (taskWindowStatus.value === 'ended') return '任务已结束，无法继续录音测评。'
  if (taskWindowStatus.value === 'not_started') return '任务尚未开始，请在开放时间后再进行测试。'
  if (taskWindowStatus.value === 'inactive') return '任务尚未开放，暂时无法测试。'
  return ''
})
const canRecord = computed(() => taskWindowOpen.value && !!currentSentence.value && !recording.value && !analyzing.value && !submitReq.loading.value)
const canSubmit = computed(() => !!sessionId.value && taskWindowOpen.value && allSentencesCompleted.value && !recording.value && !analyzing.value && !submitReq.loading.value)
const averageScore = computed(() => {
  const scores = results.value
    .map((item) => item.score)
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
  if (!scores.length) return null
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
})

const blankResult = (): SentenceResult => ({
  status: 'pending',
  score: null,
  evaluationId: null,
  error: null,
})

const syncResults = () => {
  results.value = segments.value.map((_, index) => results.value[index] ?? blankResult())
  if (activeIndex.value >= segments.value.length) activeIndex.value = Math.max(segments.value.length - 1, 0)
  if (sentencePage.value > pageCount.value) sentencePage.value = pageCount.value
}

const scoreFromResult = (resultScore: unknown) => {
  if (!resultScore || typeof resultScore !== 'object') return null
  const scores = resultScore as Record<string, unknown>
  for (const key of ['overall', 'total_score', 'score']) {
    const raw = scores[key]
    const score = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(score)) return score
  }
  return null
}

const statusLabel = (status: SentenceStatus) => {
  const labels: Record<SentenceStatus, string> = {
    pending: '待录音',
    recording: '录音中',
    analyzing: '评测中',
    done: '已完成',
    error: '需重试',
  }
  return labels[status]
}

const statusClass = (status: SentenceStatus) => {
  const classes: Record<SentenceStatus, string> = {
    pending: 'bg-gray-100 text-gray-500',
    recording: 'bg-red-50 text-red-600',
    analyzing: 'bg-blue-50 text-blue-600',
    done: 'bg-[#EAF0DD] text-[#70C125]',
    error: 'bg-orange-50 text-orange-600',
  }
  return classes[status]
}

const formatDate = (value: string | null) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const stopStream = () => {
  stream.value?.getTracks().forEach((track) => track.stop())
  stream.value = null
}

const loadTask = async () => {
  if (!taskId.value) return
  await taskReq.run(() => getStudentTaskDetail(taskId.value))
}

const ensureSession = async () => {
  if (sessionId.value) return sessionId.value
  const res = await createReq.run(() => createStudentTestSession(taskId.value))
  sessionId.value = res.session_id
  return res.session_id
}

const selectSentence = (index: number) => {
  if (recording.value || analyzing.value) return
  activeIndex.value = index
}

const changeSentencePage = (page: number) => {
  if (recording.value || analyzing.value) return
  const nextPage = Math.min(Math.max(page, 1), pageCount.value)
  sentencePage.value = nextPage
  const firstIndex = (nextPage - 1) * sentencePageSize
  if (activeIndex.value < firstIndex || activeIndex.value >= firstIndex + sentencePageSize) {
    activeIndex.value = Math.min(firstIndex, Math.max(segments.value.length - 1, 0))
  }
}

const setCurrentResult = (patch: Partial<SentenceResult>) => {
  results.value[activeIndex.value] = {
    ...(results.value[activeIndex.value] ?? blankResult()),
    ...patch,
  }
}

const startRecording = async () => {
  if (!canRecord.value) {
    if (taskWindowMessage.value) toast.push(taskWindowMessage.value, 'error')
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast.push('当前浏览器不支持录音，请换用 Chrome 或 Edge 测试。', 'error')
    return
  }

  try {
    submitResult.value = null
    await ensureSession()
    recordedChunks = []
    const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.value = nextStream
    const preferredType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
    const nextRecorder = preferredType ? new MediaRecorder(nextStream, { mimeType: preferredType }) : new MediaRecorder(nextStream)

    nextRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data)
    }

    nextRecorder.onstop = () => {
      const mimeType = recordedChunks[0]?.type || preferredType || 'audio/webm'
      const audio = new Blob(recordedChunks, { type: mimeType })
      recording.value = false
      stopStream()
      if (!audio.size) {
        setCurrentResult({ status: 'error', error: '录音内容为空，请稍微延长朗读时间后重试' })
        toast.push('录音内容为空，请稍微延长朗读时间后重试', 'error')
        return
      }
      void analyzeCurrentSentence(audio)
    }

    recorder.value = nextRecorder
    setCurrentResult({ status: 'recording', error: null })
    nextRecorder.start()
    recording.value = true
  } catch (error) {
    recording.value = false
    stopStream()
    const message = error instanceof Error ? error.message : '无法开始录音'
    if (message === 'Task has ended' || message === 'Task has not started' || message === 'Task unavailable') {
      toast.push(taskWindowMessage.value || message, 'error')
      return
    }
    setCurrentResult({ status: 'error', error: message })
    toast.push(message, 'error')
  }
}

const stopRecording = () => {
  if (recorder.value?.state === 'recording') {
    recorder.value.stop()
  }
}

const analyzeCurrentSentence = async (audio: Blob) => {
  if (!currentSentence.value) return
  analyzing.value = true
  setCurrentResult({ status: 'analyzing', error: null })

  try {
    const file = new File([audio], `sentence-${activeIndex.value + 1}.webm`, { type: audio.type || 'audio/webm' })
    const res = await analyzeStudentPronTest({
      audio: file,
      refText: currentSentence.value,
      taskId: taskId.value,
      sentenceSeq: activeIndex.value,
      lang: taskDetail.value?.language_type ?? 'fr',
    })

    setCurrentResult({
      status: 'done',
      score: scoreFromResult(res.result_score),
      evaluationId: res.evaluation_id,
      error: null,
    })

    if (activeIndex.value < segments.value.length - 1) activeIndex.value += 1
    toast.push('本句已自动测评完成', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '自动测评失败，请重试'
    setCurrentResult({ status: 'error', error: message })
    toast.push(message, 'error')
  } finally {
    analyzing.value = false
  }
}

const submitSession = async () => {
  if (!canSubmit.value) return
  try {
    const res = await submitReq.run(() => submitStudentTestSession(taskId.value))
    submitResult.value = res
    toast.push('测试已提交', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '提交失败，请稍后重试'
    toast.push(message, 'error')
  }
}

watch(segments, syncResults)

watch(activeIndex, (index) => {
  const nextPage = Math.floor(index / sentencePageSize) + 1
  if (nextPage !== sentencePage.value) sentencePage.value = nextPage
})

onMounted(async () => {
  try {
    await loadTask()
    syncResults()
  } catch {
    toast.push('获取任务详情失败', 'error')
  }
})

onUnmounted(() => {
  if (recorder.value?.state === 'recording') recorder.value.stop()
  stopStream()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="w-11 h-11 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          @click="router.push('/tasks')"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="flex flex-col gap-1">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">任务测试</h2>
          <p class="text-sm font-bold text-gray-400">逐句录音，停止后自动测评并保存测试记录。</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span class="rounded-full bg-white border border-gray-100 px-4 py-2 text-xs font-black text-gray-500 shadow-sm">
          Session: {{ sessionId ?? '未创建' }}
        </span>
        <span class="rounded-full bg-[#EAF0DD] px-4 py-2 text-xs font-black text-[#70C125]">
          {{ completedCount }} / {{ segments.length }} 句
        </span>
      </div>
    </div>

    <ErrorState
      v-if="taskReq.error.value"
      message="无法获取任务详情，请稍后重试。"
      :busy="taskReq.loading.value"
      @retry="loadTask"
    />

    <div v-else-if="taskReq.loading.value" class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <section class="xl:col-span-5 bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
        <SkeletonBlock class="h-8 w-48 mb-5" />
        <SkeletonBlock class="h-16 w-full mb-3" />
        <SkeletonBlock class="h-16 w-full" />
      </section>
      <section class="xl:col-span-7 bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
        <SkeletonBlock class="h-8 w-56 mb-5" />
        <SkeletonBlock class="h-40 w-full mb-4" />
        <SkeletonBlock class="h-12 w-52" />
      </section>
    </div>

    <div v-else-if="taskDetail" class="flex flex-col gap-6">
      <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
        <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-[#EAF0DD] px-3 py-1 text-xs font-black text-[#70C125]">
                {{ taskDetail.task_type === 'homework' ? '作业' : '练习' }}
              </span>
              <span
                class="rounded-full px-3 py-1 text-xs font-black"
                :class="taskWindowClass"
              >
                {{ taskWindowLabel }}
              </span>
            </div>
            <h3 class="text-2xl font-black text-gray-900 leading-tight">{{ taskDetail.title }}</h3>
            <p v-if="taskDetail.notes" class="text-sm font-bold text-gray-500 leading-relaxed">{{ taskDetail.notes }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:min-w-[560px]">
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 px-4 py-3">
              <div class="text-xs font-black text-gray-400 mb-1">最多提交</div>
              <div class="text-base font-black text-gray-900">{{ taskDetail.max_attempt ?? '--' }} 次</div>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 px-4 py-3">
              <div class="text-xs font-black text-gray-400 mb-1">截止时间</div>
              <div class="text-sm font-extrabold text-gray-900">{{ formatDate(taskDetail.available_until) }}</div>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 px-4 py-3">
              <div class="text-xs font-black text-gray-400 mb-1">完成进度</div>
              <div class="text-base font-black text-gray-900">{{ completedCount }} / {{ segments.length }} 句</div>
            </div>
          </div>
        </div>

        <div class="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div class="h-full rounded-full bg-[#70C125] transition-all" :style="progressStyle"></div>
        </div>

        <div
          v-if="taskWindowMessage"
          class="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-black text-orange-600"
        >
          {{ taskWindowMessage }}
        </div>

        <div class="rounded-3xl border border-gray-100 bg-[#F8F9FA] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex flex-col gap-1">
            <h4 class="text-base font-black text-gray-900">提交整套测试</h4>
            <p class="text-sm font-bold text-gray-400">
              {{ allSentencesCompleted ? '所有句子已完成测评，可以提交本次测试记录。' : `还需完成 ${segments.length - completedCount} 句测评后才能提交。` }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-2xl bg-[#3B82F6] px-6 py-4 text-sm font-black text-white flex items-center justify-center gap-2 border-b-4 border-[#2563EB] hover:bg-[#2563eb] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#3B82F6]"
            :disabled="!canSubmit"
            @click="submitSession"
          >
            <Loader2 v-if="submitReq.loading.value" class="w-5 h-5 animate-spin" />
            <Send v-else class="w-5 h-5" />
            提交测试
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section class="xl:col-span-5 bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col gap-1">
            <h3 class="text-xl font-black text-gray-900">测试句子</h3>
            <p class="text-sm font-bold text-gray-400">
              第 {{ segments.length ? pageStartIndex + 1 : 0 }}-{{ pageEndIndex }} 句，共 {{ segments.length }} 句
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-10 h-10 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="sentencePage <= 1 || recording || analyzing"
              @click="changeSentencePage(sentencePage - 1)"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <span class="rounded-2xl bg-[#F8F9FA] border border-gray-100 px-4 py-2 text-sm font-black text-gray-700">
              {{ sentencePage }} / {{ pageCount }}
            </span>
            <button
              type="button"
              class="w-10 h-10 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="sentencePage >= pageCount || recording || analyzing"
              @click="changeSentencePage(sentencePage + 1)"
            >
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <button
            v-for="item in pageSegments"
            :key="`${item.index}-${item.segment}`"
            type="button"
            class="min-h-36 rounded-3xl border p-5 text-left transition-all flex flex-col justify-between gap-4"
            :class="activeIndex === item.index ? 'border-[#70C125] bg-[#F8FAFB] shadow-sm' : 'border-gray-100 bg-white hover:bg-gray-50'"
            @click="selectSentence(item.index)"
          >
            <div class="flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <span class="text-xs font-black text-gray-400">第 {{ item.index + 1 }} 句</span>
                <span class="rounded-full px-3 py-1 text-xs font-black" :class="statusClass(results[item.index]?.status ?? 'pending')">
                  {{ statusLabel(results[item.index]?.status ?? 'pending') }}
                </span>
              </div>
              <p class="text-lg font-black leading-relaxed text-gray-900">{{ item.segment }}</p>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span
                class="text-xs font-black"
                :class="results[item.index]?.status === 'error' ? 'text-orange-600' : 'text-gray-400'"
              >
                <template v-if="results[item.index]?.status === 'error'">
                  {{ results[item.index]?.error || '评测失败，请重试' }}
                </template>
                <template v-else>
                {{ activeIndex === item.index ? '当前录音句' : '点击选择' }}
                </template>
              </span>
              <span v-if="results[item.index]?.score !== null" class="text-base font-black text-[#70C125]">
                {{ results[item.index]?.score?.toFixed(1) }} 分
              </span>
            </div>
          </button>
        </div>
        </section>

        <section class="xl:col-span-7 bg-white border border-gray-100 rounded-[24px] p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xl font-black text-gray-900">当前录音：第 {{ activeIndex + 1 }} 句</h3>
            <span class="rounded-full px-3 py-1 text-xs font-black" :class="statusClass(results[activeIndex]?.status ?? 'pending')">
              {{ statusLabel(results[activeIndex]?.status ?? 'pending') }}
            </span>
          </div>
          <p class="rounded-3xl bg-[#F8F9FA] border border-gray-100 p-6 text-xl font-black leading-relaxed text-gray-900">
            {{ currentSentence || '暂无句子' }}
          </p>
        </div>

        <div class="rounded-3xl border border-gray-100 bg-[#F8F9FA] p-6 flex flex-col items-center gap-5">
          <div class="h-20 w-full flex items-center justify-center gap-1">
            <div
              v-for="index in 34"
              :key="index"
              class="w-1.5 rounded-full transition-all"
              :class="recording ? 'bg-[#70C125]' : 'bg-gray-300'"
              :style="{ height: `${18 + ((index * 17) % 48)}px` }"
            ></div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              class="rounded-2xl bg-[#70C125] px-6 py-4 text-sm font-black text-white flex items-center gap-2 border-b-4 border-[#5E9E1A] hover:bg-[#63ad20] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#70C125]"
              :disabled="!canRecord"
              @click="startRecording"
            >
              <Mic class="w-5 h-5" />
              开始录音
            </button>
            <button
              type="button"
              class="rounded-2xl bg-[#FF80B5] px-6 py-4 text-sm font-black text-white flex items-center gap-2 border-b-4 border-[#D16A95] hover:bg-[#e673a3] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#FF80B5]"
              :disabled="!recording"
              @click="stopRecording"
            >
              <Square class="w-5 h-5" />
              停止录音
            </button>
            <button
              type="button"
              class="rounded-2xl bg-white border border-gray-100 px-5 py-4 text-sm font-black text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="recording || analyzing"
              @click="setCurrentResult(blankResult())"
            >
              <RotateCcw class="w-5 h-5" />
              重录本句
            </button>
          </div>

          <div v-if="analyzing" class="flex items-center gap-2 text-sm font-black text-blue-600">
            <Loader2 class="w-4 h-4 animate-spin" />
            正在自动测评当前句子
          </div>
          <div v-else-if="results[activeIndex]?.status === 'done'" class="flex items-center gap-2 text-sm font-black text-[#70C125]">
            <CheckCircle2 class="w-4 h-4" />
            当前句已完成
          </div>
          <div v-else-if="results[activeIndex]?.status === 'error'" class="flex items-center gap-2 text-sm font-black text-orange-600">
            <AlertCircle class="w-4 h-4" />
            {{ results[activeIndex]?.error }}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
            <div class="text-xs font-black text-gray-400 mb-1">完成进度</div>
            <div class="text-2xl font-black text-gray-900">{{ progressPercent }}%</div>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
            <div class="text-xs font-black text-gray-400 mb-1">当前均分</div>
            <div class="text-2xl font-black text-gray-900">{{ averageScore === null ? '--' : averageScore.toFixed(1) }}</div>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
            <div class="text-xs font-black text-gray-400 mb-1">已评测</div>
            <div class="text-2xl font-black text-gray-900">{{ completedCount }} 句</div>
          </div>
        </div>

        <div v-if="submitResult" class="rounded-3xl border border-[#DCEFCC] bg-[#F8FCF4] p-5 flex flex-col gap-3">
          <div class="flex items-center gap-2 text-[#70C125]">
            <CheckCircle2 class="w-5 h-5" />
            <span class="text-sm font-black">提交成功</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-2xl bg-white border border-[#DCEFCC] p-4">
              <div class="text-xs font-black text-gray-400 mb-1">平均分</div>
              <div class="text-2xl font-black text-gray-900">{{ submitResult.average_score.toFixed(1) }}</div>
            </div>
            <div class="rounded-2xl bg-white border border-[#DCEFCC] p-4">
              <div class="text-xs font-black text-gray-400 mb-1">总分</div>
              <div class="text-2xl font-black text-gray-900">{{ submitResult.total_score.toFixed(1) }}</div>
            </div>
            <div class="rounded-2xl bg-white border border-[#DCEFCC] p-4">
              <div class="text-xs font-black text-gray-400 mb-1">评测句数</div>
              <div class="text-2xl font-black text-gray-900">{{ submitResult.evaluation_count }}</div>
            </div>
          </div>
        </div>
        </section>
      </div>
    </div>
  </main>
</template>
