import { computed, ref } from 'vue'
import {
  analyzeStudentPronTest,
  createStudentTestSession,
  getSentenceStdAudio,
  getStudentBasicInformation,
  submitStudentTestSession,
  type StudentPronTestAnalyzeResultScore,
  type SubmitStudentTestSessionResponse,
} from '../../api/endpoints'
import { isApiError } from '../../api/errors'
import { useToast } from '../../composables/useToast'
import { useAuth } from '../../stores/auth'

type SentenceStatus = 'pending' | 'recording' | 'analyzing' | 'done' | 'error'

type SentenceResult = {
  status: SentenceStatus
  score: number | null
  evaluationId: string | null
  error: string | null
  resultScore?: StudentPronTestAnalyzeResultScore | null
  /** 学生本句的原始录音，用于「听我的录音」回放 */
  recordedAudio?: Blob | null
}

// ---- 本地演示用 mock 评测明细：逐词得分 + 音素，用于预览右下角「单句评分分析」 ----
const MOCK_SENTENCE_SCORE: StudentPronTestAnalyzeResultScore = {
  total_score: 78.5,
  accuracy: 76.2,
  fluency: 82.4,
  completeness: 95,
  words: [
    { word: "J'ai", pronunciation: 92, error_type: 'None', phonemes: [{ phoneme: 'ʒ', pronunciation: 94 }, { phoneme: 'e', pronunciation: 90 }] },
    { word: 'vingt-trois', pronunciation: 74, error_type: 'Mispronunciation', phonemes: [{ phoneme: 'v', pronunciation: 88 }, { phoneme: 'ɛ̃', pronunciation: 62 }, { phoneme: 't', pronunciation: 80 }, { phoneme: 'ʁ', pronunciation: 70 }, { phoneme: 'wa', pronunciation: 79 }] },
    { word: 'ans', pronunciation: 88, error_type: 'None', phonemes: [{ phoneme: 'ɑ̃', pronunciation: 90 }, { phoneme: 'n', pronunciation: 85 }] },
    { word: 'et', pronunciation: 95, error_type: 'None', phonemes: [{ phoneme: 'e', pronunciation: 95 }] },
    { word: "j'étudie", pronunciation: 54, error_type: 'Mispronunciation', phonemes: [{ phoneme: 'ʒ', pronunciation: 82 }, { phoneme: 'e', pronunciation: 58 }, { phoneme: 't', pronunciation: 66 }, { phoneme: 'y', pronunciation: 44 }, { phoneme: 'd', pronunciation: 72 }, { phoneme: 'i', pronunciation: 60 }] },
    { word: 'le', pronunciation: 90, error_type: 'None', phonemes: [{ phoneme: 'l', pronunciation: 92 }, { phoneme: 'ə', pronunciation: 88 }] },
    { word: 'français', pronunciation: 63, error_type: 'Mispronunciation', phonemes: [{ phoneme: 'f', pronunciation: 80 }, { phoneme: 'ʁ', pronunciation: 55 }, { phoneme: 'ɑ̃', pronunciation: 62 }, { phoneme: 's', pronunciation: 70 }, { phoneme: 'ɛ', pronunciation: 58 }] },
    { word: 'à', pronunciation: 96, error_type: 'None', phonemes: [{ phoneme: 'a', pronunciation: 96 }] },
    { word: "l'université", pronunciation: 71, error_type: 'Mispronunciation', phonemes: [{ phoneme: 'l', pronunciation: 85 }, { phoneme: 'y', pronunciation: 74 }, { phoneme: 'n', pronunciation: 80 }, { phoneme: 'i', pronunciation: 78 }, { phoneme: 'v', pronunciation: 70 }, { phoneme: 'ɛ', pronunciation: 68 }, { phoneme: 'ʁ', pronunciation: 56 }, { phoneme: 's', pronunciation: 76 }, { phoneme: 'i', pronunciation: 72 }, { phoneme: 't', pronunciation: 70 }, { phoneme: 'e', pronunciation: 66 }] },
    { word: 'de', pronunciation: 93, error_type: 'None', phonemes: [{ phoneme: 'd', pronunciation: 93 }, { phoneme: 'ə', pronunciation: 92 }] },
    { word: 'Lyon', pronunciation: 59, error_type: 'Mispronunciation', phonemes: [{ phoneme: 'l', pronunciation: 84 }, { phoneme: 'j', pronunciation: 50 }, { phoneme: 'ɔ̃', pronunciation: 46 }] },
    { word: 'depuis', pronunciation: 84, error_type: 'None', phonemes: [{ phoneme: 'd', pronunciation: 88 }, { phoneme: 'ə', pronunciation: 86 }, { phoneme: 'p', pronunciation: 82 }, { phoneme: 'y', pronunciation: 80 }, { phoneme: 'i', pronunciation: 84 }] },
    { word: 'deux', pronunciation: 78, error_type: 'None', phonemes: [{ phoneme: 'd', pronunciation: 82 }, { phoneme: 'ø', pronunciation: 74 }] },
    { word: 'ans', pronunciation: 91, error_type: 'None', phonemes: [{ phoneme: 'ɑ̃', pronunciation: 92 }, { phoneme: 'n', pronunciation: 90 }] },
  ],
}

// ---- 共享状态（模块级单例，主页左右两列共用同一份） ----
// 初始为空，不预填/缓存任何文本
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

// ---- 逐句朗读（TTS）状态 ----
const playing = ref(false)
// 当前正在朗读的句子下标（null 表示未朗读）
const playingIndex = ref<number | null>(null)
// 是否正在回放学生自己的录音
const playingRecording = ref(false)
let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl: string | null = null
let stopCurrentPlayback: (() => void) | null = null
let playbackToken = 0

// 智能分句后立即创建 session（后端预合成逐句参考音频）的进行态
const ttsPreparing = ref(false)
// create session 的并发去重：预加载与手动朗读同时触发时只创建一次
let sessionPromise: Promise<string> | null = null

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let recordedChunks: Blob[] = []
let discardRecordingOnStop = false
let recordingStartedAt: number | null = null
let recordingTimer: number | null = null

const MIN_RECORDING_MS = 1500
const MIN_AUDIO_BLOB_BYTES = 4096
const MEDIA_RECORDER_TIMESLICE_MS = 250

// ---- 当前选中班级的语种（用于主页自由评测/TTS，默认法语） ----
const auth = useAuth()
const studentLanguage = ref<string>('fr')
// 已加载语种对应的班级 id，用于切换班级后重新读取
let studentLanguageClassId: string | null = null
let studentLanguageLoaded = false
const loadStudentLanguage = async () => {
  const currentClassId = auth.session.value?.class_context?.class_id ?? null
  // 语种随学生当前选中的班级变化，切换班级后需重新读取
  if (studentLanguageLoaded && studentLanguageClassId === currentClassId) return studentLanguage.value
  try {
    const res = await getStudentBasicInformation()
    // 取当前选中班级的语种；班级信息里找不到时回退到首个班级
    const target = res?.info?.find((item) => item.class_id === currentClassId) ?? res?.info?.[0]
    if (target?.language) {
      studentLanguage.value = target.language
      studentLanguageLoaded = true
      studentLanguageClassId = currentClassId
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
  recordedAudio: null,
})

/**
 * 只把真正的数字当成分数。
 * 后端评测失败（如 Azure/phonemizer 异常）时 total_score 会是 null，
 * 不能用 Number(null) === 0 把它当成 0 分，否则失败会被显示成 0 分。
 */
const scoreOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const scoreFromResult = (resultScore: unknown) => {
  if (!resultScore || typeof resultScore !== 'object') return null
  const scores = resultScore as Record<string, unknown>
  for (const key of ['overall', 'total_score', 'score']) {
    const score = scoreOrNull(scores[key])
    if (score !== null) return score
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
    const accuracy = scoreOrNull(score.accuracy)
    const fluency = scoreOrNull(score.fluency)
    const completeness = scoreOrNull(score.completeness)
    // 评测失败时三维分均为 null，不渲染成 0 分雷达图
    if (accuracy === null || fluency === null || completeness === null) return []
    return [
      { label: '准确度', value: accuracy },
      { label: '流利度', value: fluency },
      { label: '完整度', value: completeness },
    ]
  })
  const currentWords = computed(() => currentResultScore.value?.words ?? [])
  const currentRecordedAudio = computed(() => results.value[activeIndex.value]?.recordedAudio ?? null)

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

  /**
 * 本地演示：给 mock 文本中的长句注入一份 mock 评测明细，便于预览右下角单句评分分析。
 * 分句结果不含该句时（用户自己输入文本）不注入；用户录音后结果会被真实数据覆盖。
 */
const applyMockSentenceResult = () => {
  const index = sentences.value.findIndex((sentence) => sentence.includes('vingt-trois'))
  if (index < 0) return
  results.value[index] = {
    status: 'done',
    score: MOCK_SENTENCE_SCORE.total_score,
    evaluationId: 'mock-evaluation',
    error: null,
    resultScore: MOCK_SENTENCE_SCORE,
    recordedAudio: null,
  }
  activeIndex.value = index
}

const splitSentences = async () => {
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
    // 演示：分句后立即给含 vingt-trois 的 mock 长句带上一份评测明细，直接预览右下角效果
    applyMockSentenceResult()
    sessionId.value = null
    submitResult.value = null
    toast.push(`智能分句完成，共 ${sentences.value.length} 句`, 'success')
    // 分句后立刻创建 session：后端此时会合成逐句参考音频，后续逐句朗读无需等待
    ttsPreparing.value = true
    try {
      await ensureSession()
    } catch (error) {
      const message = error instanceof Error ? error.message : '参考音频预加载失败'
      toast.push(`参考音频预加载失败：${message}`, 'error')
    } finally {
      ttsPreparing.value = false
    }
  }

  const selectSentence = (index: number) => {
    if (recording.value || analyzing.value) return
    activeIndex.value = index
  }

  const ensureSession = async () => {
    if (sessionId.value) return sessionId.value
    // 分句预加载与用户点击朗读/录音几乎同时触发时，复用同一次 create session 请求
    if (sessionPromise) return sessionPromise
    sessionPromise = (async () => {
      const language = await loadStudentLanguage()
      // 主页自由评测后端需要 segments（分句结果）与 language 来合成参考音频，
      // 缺失会返回 400「缺少必要字段」。
      const res = await createStudentTestSession(null, sentences.value, language)
      sessionId.value = res.session_id
      return res.session_id
    })()
    try {
      return await sessionPromise
    } finally {
      sessionPromise = null
    }
  }

  const stopAudio = () => {
    playbackToken += 1
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl)
      currentAudioUrl = null
    }
    const resolve = stopCurrentPlayback
    stopCurrentPlayback = null
    resolve?.()
    playing.value = false
    playingIndex.value = null
    playingRecording.value = false
  }

  const playAudioBlob = (blob: Blob) =>
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
      audio.onended = finish
      audio.onerror = () => {
        toast.push('语音播放失败', 'error')
        finish()
      }
      void audio.play().catch(() => {
        toast.push('语音播放失败，请检查浏览器音频权限', 'error')
        finish()
      })
    })

  // 逐句朗读：主页 session 创建时后端已合成逐句参考音频，这里按句取回播放
  const readSentence = async (index: number) => {
    const sentence = sentences.value[index]
    if (!sentence) {
      toast.push('请先输入评测文本并完成智能分句', 'warning')
      return
    }
    stopAudio()
    const token = playbackToken
    playing.value = true
    playingIndex.value = index
    try {
      const sid = await ensureSession()
      if (token !== playbackToken) return
      const blob = await getSentenceStdAudio(sid, index)
      if (token !== playbackToken) return
      await playAudioBlob(blob)
    } catch (error) {
      const message = error instanceof Error ? error.message : '语音播放失败，请稍后重试'
      toast.push(message, 'error')
    } finally {
      if (token === playbackToken) {
        playing.value = false
        playingIndex.value = null
        stopCurrentPlayback = null
        currentAudio = null
        if (currentAudioUrl) {
          URL.revokeObjectURL(currentAudioUrl)
          currentAudioUrl = null
        }
      }
    }
  }

  // 点击同一句时停止朗读，点击其它句时切换为该句
  const toggleSentenceAudio = (index: number) => {
    if (playingIndex.value === index) {
      stopAudio()
      return
    }
    void readSentence(index)
  }

  // 回放学生自己录制的本句音频
  const toggleRecordedAudio = () => {
    if (playingRecording.value) {
      stopAudio()
      return
    }
    const blob = results.value[activeIndex.value]?.recordedAudio
    if (!blob) {
      toast.push('本句暂无录音，请先录制', 'warning')
      return
    }
    stopAudio()
    const token = playbackToken
    playingRecording.value = true
    void playAudioBlob(blob).finally(() => {
      if (token === playbackToken) playingRecording.value = false
    })
  }

  const startRecording = async () => {
    if (!canRecord.value) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.push('当前浏览器不支持录音，请换用 Chrome 或 Edge 测试。', 'error')
      return
    }
    try {
      // 避免麦克风把正在播放的参考音频/回放录音一起录进去
      stopAudio()
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
        // 保留原始录音，供「听我的录音」回放
        setCurrentResult({ recordedAudio: audio })
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
      const score = scoreFromResult(res.result_score)
      if (score === null) {
        // 后端评测失败（如 Azure/phonemizer 异常）会返回 total_score=null，
        // 此时不能记为已完成，否则界面会显示成 0 分。
        setCurrentResult({
          status: 'error',
          score: null,
          evaluationId: res.evaluation_id,
          error: '评测未返回有效分数，请重新录音',
          resultScore: res.result_score ?? null,
        })
        toast.push('评测未返回有效分数，请重新录音', 'error')
        return
      }
      setCurrentResult({
        status: 'done',
        score,
        evaluationId: res.evaluation_id,
        error: null,
        resultScore: res.result_score ?? null,
      })
      if (activeIndex.value < sentences.value.length - 1) activeIndex.value += 1
      toast.push('本句已即时测评完成', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : '自动测评失败，请重试'
      // 后端会删除或过期 Redis 中的待确认 session，此时继续复用旧 sessionId 会一直 400。
      // 检测到 session 失效后清空本地缓存，下次录音会自动重新创建 session。
      if (isApiError(error) && error.status === 400 && /session/i.test(message)) {
        sessionId.value = null
      }
      setCurrentResult({ status: 'error', error: message })
      toast.push(message, 'error')
    } finally {
      analyzing.value = false
    }
    // 全部句子评测完成后自动提交，把本次主页评测写入数据库
    if (allSentencesCompleted.value && sessionId.value && !submitLoading.value) {
      await doSubmit()
    }
  }

  const doSubmit = async () => {
    submitLoading.value = true
    try {
      const res = await submitStudentTestSession(null, await loadStudentLanguage())
      submitResult.value = res
      // 后端提交成功后会删除 Redis 中的待确认 session，本地必须同步清空，
      // 否则再次录音会复用已失效的 sessionId 并返回 400。
      sessionId.value = null
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请稍后重试'
      toast.push(message, 'error')
    } finally {
      submitLoading.value = false
    }
  }

  const submitSession = async () => {
    if (!canSubmit.value) return
    await doSubmit()
  }

  const cleanup = () => {
    discardRecordingOnStop = true
    if (recorder?.state === 'recording') recorder.stop()
    resetRecordingTimer()
    stopStream()
    stopAudio()
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
    currentSentence, currentResultScore, radarItems, currentWords, currentRecordedAudio,
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
    // 逐句朗读（TTS）
    playing,
    playingIndex,
    ttsPreparing,
    readSentence,
    toggleSentenceAudio,
    // 回放学生自己的录音
    playingRecording,
    toggleRecordedAudio,
    stopAudio,
    // 学生班级语种
    studentLanguage,
    loadStudentLanguage,
  }
}
