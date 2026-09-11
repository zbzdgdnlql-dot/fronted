import { computed, ref } from 'vue'
import {
  analyzeStudentPronTest,
  createStudentTestSession,
  getStudentBasicInformation,
  submitStudentTestSession,
  type StudentPronTestAnalyzeResultScore,
  type SubmitStudentTestSessionResponse,
} from '../../api/endpoints'
import { useToast } from '../../composables/useToast'

type SentenceStatus = 'pending' | 'recording' | 'analyzing' | 'done' | 'error'

type SentenceResult = {
  status: SentenceStatus
  score: number | null
  evaluationId: string | null
  error: string | null
  resultScore?: StudentPronTestAnalyzeResultScore | null
}

// ---- 共享状态（模块级单例，主页左右两列共用同一份） ----
const textContent = ref('')
const sentences = ref<string[]>([])
const activeIndex = ref(0)
const results = ref<SentenceResult[]>([])
const recording = ref(false)
const analyzing = ref(false)
const sessionId = ref<string | null>(null)
const submitResult = ref<SubmitStudentTestSessionResponse | null>(null)
const submitLoading = ref(false)
const recordingElapsedMs = ref(0)

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let recordedChunks: Blob[] = []
let discardRecordingOnStop = false
let recordingStartedAt: number | null = null
let recordingTimer: number | null = null

const MIN_RECORDING_MS = 1500
const MIN_AUDIO_BLOB_BYTES = 4096
const MEDIA_RECORDER_TIMESLICE_MS = 250

// ---- 当前学生班级语种（用于主页自由评测/TTS，默认法语） ----
const studentLanguage = ref<string>('fr')
let studentLanguageLoaded = false
const loadStudentLanguage = async () => {
  if (studentLanguageLoaded) return studentLanguage.value
  try {
    const res = await getStudentBasicInformation()
    const first = res?.info?.[0]
    if (first?.language) {
      studentLanguage.value = first.language
      studentLanguageLoaded = true
    }
  } catch {
    // 读取失败时保持默认 'fr'
  }
  return studentLanguage.value
}

const blankResult = (): SentenceResult => ({
  status: 'pending',
  score: null,
  evaluationId: null,
  error: null,
  resultScore: null,
})

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

export function useHomeEvaluation() {
  const toast = useToast()

  const currentSentence = computed(() => sentences.value[activeIndex.value] ?? '')
  const currentResultScore = computed(() => results.value[activeIndex.value]?.resultScore ?? null)
  const radarItems = computed(() => {
    const score = currentResultScore.value
    if (!score) return []
    return [
      { label: '准确度', value: toNumber(score.accuracy) },
      { label: '流利度', value: toNumber(score.fluency) },
      { label: '完整度', value: toNumber(score.completeness) },
    ]
  })
  const currentWords = computed(() => currentResultScore.value?.words ?? [])

  const completedCount = computed(() => results.value.filter((item) => item.status === 'done').length)
  const allSentencesCompleted = computed(() => sentences.value.length > 0 && completedCount.value === sentences.value.length)
  const averageScore = computed(() => {
    const scores = results.value
      .filter((item) => item.status === 'done')
      .map((item) => scoreFromResult(item.resultScore))
      .filter((value): value is number => typeof value === 'number')
    if (!scores.length) return null
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  })
  const progressPercent = computed(() =>
    sentences.value.length ? Math.round((completedCount.value / sentences.value.length) * 100) : 0,
  )
  const canRecord = computed(() => !!currentSentence.value && !recording.value && !analyzing.value && !submitLoading.value)
  const canStopRecording = computed(() => recording.value && recordingElapsedMs.value >= MIN_RECORDING_MS)
  const canSubmit = computed(() => !!sessionId.value && allSentencesCompleted.value && !recording.value && !analyzing.value && !submitLoading.value)

  const setCurrentResult = (patch: Partial<SentenceResult>) => {
    results.value[activeIndex.value] = {
      ...(results.value[activeIndex.value] ?? blankResult()),
      ...patch,
    }
  }

  const stopStream = () => {
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
  }

  const clearRecordingTimer = () => {
    if (recordingTimer !== null) {
      window.clearInterval(recordingTimer)
      recordingTimer = null
    }
  }

  const startRecordingTimer = () => {
    clearRecordingTimer()
    recordingStartedAt = Date.now()
    recordingElapsedMs.value = 0
    recordingTimer = window.setInterval(() => {
      if (recordingStartedAt === null) return
      recordingElapsedMs.value = Date.now() - recordingStartedAt
    }, 100)
  }

  const resetRecordingTimer = () => {
    clearRecordingTimer()
    recordingStartedAt = null
    recordingElapsedMs.value = 0
  }

  const splitSentences = () => {
    const raw = textContent.value.trim()
    if (!raw) {
      toast.push('请先输入评测文本', 'warning')
      return
    }
    const parts = (raw.match(/[^。.!！?？;；\n\r]+[。.!！?？;；]*/g) ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
    sentences.value = parts.length ? parts : [raw]
    activeIndex.value = 0
    results.value = sentences.value.map(() => blankResult())
    sessionId.value = null
    submitResult.value = null
    toast.push(`智能分句完成，共 ${sentences.value.length} 句`, 'success')
  }

  const selectSentence = (index: number) => {
    if (recording.value || analyzing.value) return
    activeIndex.value = index
  }

  const ensureSession = async () => {
    if (sessionId.value) return sessionId.value
    const res = await createStudentTestSession(null)
    sessionId.value = res.session_id
    return res.session_id
  }

  const startRecording = async () => {
    if (!canRecord.value) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.push('当前浏览器不支持录音，请换用 Chrome 或 Edge 测试。', 'error')
      return
    }
    try {
      submitResult.value = null
      await ensureSession()
      recordedChunks = []
      discardRecordingOnStop = false
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream = nextStream
      const preferredType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const nextRecorder = preferredType ? new MediaRecorder(nextStream, { mimeType: preferredType }) : new MediaRecorder(nextStream)

      nextRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data)
      }

      nextRecorder.onstop = () => {
        const elapsedMs = recordingStartedAt === null ? 0 : Date.now() - recordingStartedAt
        const mimeType = recordedChunks[0]?.type || preferredType || 'audio/webm'
        const audio = new Blob(recordedChunks, { type: mimeType })
        recording.value = false
        resetRecordingTimer()
        stopStream()
        if (discardRecordingOnStop) return
        if (elapsedMs < MIN_RECORDING_MS) {
          setCurrentResult({ status: 'error', error: '录音时间过短，请至少录制 1.5 秒后重试' })
          toast.push('录音时间过短，请至少录制 1.5 秒后重试', 'error')
          return
        }
        if (!audio.size) {
          setCurrentResult({ status: 'error', error: '录音内容为空，请稍微延长朗读时间后重试' })
          toast.push('录音内容为空，请稍微延长朗读时间后重试', 'error')
          return
        }
        if (audio.size < MIN_AUDIO_BLOB_BYTES) {
          setCurrentResult({ status: 'error', error: '录音数据过短或不完整，请重新录制后再试' })
          toast.push('录音数据过短或不完整，请重新录制后再试', 'error')
          return
        }
        void analyzeCurrentSentence(audio)
      }

      recorder = nextRecorder
      setCurrentResult({ status: 'recording', error: null })
      nextRecorder.start(MEDIA_RECORDER_TIMESLICE_MS)
      recording.value = true
      startRecordingTimer()
    } catch (error) {
      recording.value = false
      resetRecordingTimer()
      stopStream()
      const message = error instanceof Error ? error.message : '无法开始录音'
      setCurrentResult({ status: 'error', error: message })
      toast.push(message, 'error')
    }
  }

  const stopRecording = () => {
    if (recorder?.state === 'recording') {
      if (!canStopRecording.value) {
        toast.push('请至少录制 1.5 秒后再停止', 'warning')
        return
      }
      recorder.requestData()
      recorder.stop()
    }
  }

  const analyzeCurrentSentence = async (audio: Blob) => {
    if (!currentSentence.value) return
    analyzing.value = true
    setCurrentResult({ status: 'analyzing', error: null })
    try {
      const file = new File([audio], `sentence-${activeIndex.value + 1}.webm`, { type: audio.type || 'audio/webm' })
      const lang = await loadStudentLanguage()
      const res = await analyzeStudentPronTest({
        audio: file,
        refText: currentSentence.value,
        taskId: null,
        sentenceSeq: activeIndex.value,
        lang,
        source: 'main_page',
      })
      setCurrentResult({
        status: 'done',
        score: scoreFromResult(res.result_score),
        evaluationId: res.evaluation_id,
        error: null,
        resultScore: res.result_score ?? null,
      })
      if (activeIndex.value < sentences.value.length - 1) activeIndex.value += 1
      toast.push('本句已即时测评完成', 'success')
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
    submitLoading.value = true
    try {
      const res = await submitStudentTestSession(null)
      submitResult.value = res
      toast.push('本次评测已提交', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请稍后重试'
      toast.push(message, 'error')
    } finally {
      submitLoading.value = false
    }
  }

  const cleanup = () => {
    discardRecordingOnStop = true
    if (recorder?.state === 'recording') recorder.stop()
    resetRecordingTimer()
    stopStream()
  }

  const resetAll = () => {
    cleanup()
    textContent.value = ''
    sentences.value = []
    results.value = []
    activeIndex.value = 0
    sessionId.value = null
    submitResult.value = null
  }

  return {
    // 状态
    textContent,
    sentences,
    activeIndex,
    results,
    recording,
    analyzing,
    recordingElapsedMs,
    sessionId,
    submitResult,
    submitLoading,
    // 计算
    currentSentence, currentResultScore, radarItems, currentWords,
    completedCount,
    allSentencesCompleted,
    averageScore,
    progressPercent,
    canRecord,
    canStopRecording,
    canSubmit,
    // 方法
    splitSentences,
    selectSentence,
    startRecording,
    stopRecording,
    submitSession,
    cleanup,
    resetAll,
    // 学生班级语种
    studentLanguage,
    loadStudentLanguage,
  }
}
