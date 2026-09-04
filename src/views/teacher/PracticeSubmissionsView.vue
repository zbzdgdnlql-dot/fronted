<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PlayCircle, Square } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import {
  getTeacherEvaluationAudio,
  getTeacherSessionDetails,
  getTeacherTaskRecords,
  getTeacherTasks,
  saveTeacherComments,
  type StudentSessionEvaluationItem,
  type TeacherTaskItem,
  type TeacherTaskRecordStudent,
  type WordScoreItem,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import ScoreRadarChart from '../../components/ScoreRadarChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

type TaskClass = TeacherTaskItem['course'][number]
type NavLevel = 'tasks' | 'classes' | 'sessions'

interface SessionChoice {
  userId: number
  studentName: string
  attemptNo: number
  displayName: string
  sessionId: string
  score: number | null
  completedAt: string | null
}

interface StudentSessionGroup {
  userId: number
  studentName: string
  recordsCount: number
  sessions: SessionChoice[]
}

interface SentenceResult {
  id: string
  audioFileId: string | null
  text: string
  score: number
  pronunciation: number
  rhythm: number
  fluency: number
  completeness: number
  words: WordScoreItem[]
  teacherComment: string
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const tasksReq = useAsync<TeacherTaskItem[]>()
const recordsReq = useAsync<TeacherTaskRecordStudent[]>()
const detailsReq = useAsync<StudentSessionEvaluationItem[]>()
const saveReq = useAsync<{ success: boolean }>()

const tasks = ref<TeacherTaskItem[]>([])
const sessionGroups = ref<StudentSessionGroup[]>([])
const sentences = ref<SentenceResult[]>([])
const overallComment = ref('')
const activeSentenceIdx = ref<number | null>(null)
const loadingAudioId = ref<string | null>(null)
const playingAudioId = ref<string | null>(null)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)
const audioVolume = ref(1)
const currentAudio = ref<HTMLAudioElement | null>(null)
const currentAudioUrl = ref<string | null>(null)
const selectedTaskId = ref((route.query.taskId as string | undefined) ?? '')
const selectedClassId = ref((route.query.classId as string | undefined) ?? '')
const selectedSessionId = ref((route.query.sessionId as string | undefined) ?? '')
const selectedUserId = ref((route.query.userId as string | undefined) ?? '')
const navLevel = ref<NavLevel>(selectedClassId.value ? 'sessions' : selectedTaskId.value ? 'classes' : 'tasks')
const directoryScroll = ref<HTMLElement | null>(null)
const scrollPositions = ref<Record<NavLevel, number>>({ tasks: 0, classes: 0, sessions: 0 })

const selectedTask = computed(() => tasks.value.find((item) => String(item.task_id) === String(selectedTaskId.value)))
const taskClasses = computed<TaskClass[]>(() => selectedTask.value?.course ?? [])
const selectedClass = computed(() => taskClasses.value.find((item) => item.class_id === selectedClassId.value))
const flatSessions = computed(() => sessionGroups.value.flatMap((student) => student.sessions))
const selectedSession = computed(() => flatSessions.value.find((item) => item.sessionId === selectedSessionId.value) ?? null)
const activeSentence = computed(() => (
  activeSentenceIdx.value == null ? null : sentences.value[activeSentenceIdx.value] ?? null
))

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const scoreColor = (value: number) => {
  if (value >= 80) return 'text-[#356B00]'
  if (value >= 60) return 'text-amber-600'
  return 'text-red-600'
}

const activeSentenceRadarItems = computed(() => {
  const sentence = activeSentence.value
  if (!sentence) return []
  return [
    { label: '准确度', value: toNumber(sentence.pronunciation) },
    { label: '流利度', value: toNumber(sentence.fluency) },
    { label: '完整度', value: toNumber(sentence.completeness) },
  ]
})
const activeSentenceWords = computed(() => activeSentence.value?.words ?? [])

const stats = computed(() => {
  const scored = flatSessions.value.filter((session) => session.score != null)
  return {
    students: sessionGroups.value.length,
    sessions: flatSessions.value.length,
    pending: flatSessions.value.filter((session) => session.score == null).length,
    avgScore: scored.reduce((sum, session) => sum + (session.score ?? 0), 0) / (scored.length || 1),
  }
})

const directoryTitle = computed(() => {
  if (navLevel.value === 'tasks') return '任务目录'
  if (navLevel.value === 'classes') return '班级目录'
  return '提交目录'
})

const directorySubtitle = computed(() => {
  if (navLevel.value === 'tasks') return '选择一个任务进入班级'
  if (navLevel.value === 'classes') return selectedTask.value?.title ?? '选择班级'
  return selectedClass.value?.class_name ?? '选择提交'
})

const formatDate = (value: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const getRecordTime = (value: string | null) => (value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER)

const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

const audioProgress = computed(() => {
  if (!audioDuration.value) return 0
  return Math.min(Math.max((audioCurrentTime.value / audioDuration.value) * 100, 0), 100)
})

const updateAudioVolume = () => {
  if (currentAudio.value) currentAudio.value.volume = audioVolume.value
}

const cleanupAudio = () => {
  if (currentAudio.value) {
    // 先解绑事件，避免清空 src 时触发 error/ended 造成"播放失败"误报
    currentAudio.value.onerror = null
    currentAudio.value.onended = null
    currentAudio.value.pause()
    currentAudio.value.removeAttribute('src')
    currentAudio.value.load()
    currentAudio.value = null
  }
  if (currentAudioUrl.value) {
    URL.revokeObjectURL(currentAudioUrl.value)
    currentAudioUrl.value = null
  }
  playingAudioId.value = null
  loadingAudioId.value = null
  audioCurrentTime.value = 0
  audioDuration.value = 0
}

const playEvaluationAudio = async (sentence: SentenceResult) => {
  if (playingAudioId.value === sentence.id) {
    cleanupAudio()
    return
  }

  cleanupAudio()
  loadingAudioId.value = sentence.id

  try {
    const blob = await getTeacherEvaluationAudio(sentence.id)
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.volume = audioVolume.value
    currentAudio.value = audio
    currentAudioUrl.value = url
    playingAudioId.value = sentence.id
    audio.onloadedmetadata = () => {
      audioDuration.value = Number.isFinite(audio.duration) ? audio.duration : 0
    }
    audio.ontimeupdate = () => {
      audioCurrentTime.value = audio.currentTime
      audioDuration.value = Number.isFinite(audio.duration) ? audio.duration : audioDuration.value
    }
    audio.onended = cleanupAudio
    audio.onerror = () => {
      // 空 src（被清理）会解析为当前页面地址，非真实失败，忽略
      if (!audio.src || audio.src === window.location.href) return
      cleanupAudio()
      toast.push('录音播放失败', 'error')
    }
    await audio.play()
  } catch (err: any) {
    cleanupAudio()
    toast.push(err?.message ?? '获取录音失败', 'error')
  } finally {
    if (loadingAudioId.value === sentence.id) loadingAudioId.value = null
  }
}

const updateQuery = () => {
  void router.replace({
    path: '/teacher/submissions',
    query: {
      ...(selectedTaskId.value ? { taskId: selectedTaskId.value } : {}),
      ...(selectedClassId.value ? { classId: selectedClassId.value } : {}),
      ...(selectedUserId.value ? { userId: selectedUserId.value } : {}),
      ...(selectedSessionId.value ? { sessionId: selectedSessionId.value } : {}),
    },
  })
}

const saveDirectoryScroll = () => {
  if (directoryScroll.value) scrollPositions.value[navLevel.value] = directoryScroll.value.scrollTop
}

const restoreDirectoryScroll = async () => {
  await nextTick()
  if (directoryScroll.value) directoryScroll.value.scrollTop = scrollPositions.value[navLevel.value] ?? 0
}

const goToLevel = async (level: NavLevel) => {
  saveDirectoryScroll()
  navLevel.value = level
  await restoreDirectoryScroll()
}

const goBackLevel = async () => {
  if (navLevel.value === 'sessions') {
    selectedSessionId.value = ''
    selectedUserId.value = ''
    sentences.value = []
    overallComment.value = ''
    await goToLevel('classes')
    return
  }
  if (navLevel.value === 'classes') {
    selectedClassId.value = ''
    selectedSessionId.value = ''
    selectedUserId.value = ''
    sessionGroups.value = []
    sentences.value = []
    overallComment.value = ''
    await goToLevel('tasks')
  }
}

const syncRouteSelection = () => {
  if (!selectedTask.value) {
    selectedTaskId.value = ''
    selectedClassId.value = ''
    selectedSessionId.value = ''
    selectedUserId.value = ''
    navLevel.value = 'tasks'
    return
  }
  if (selectedClassId.value && !taskClasses.value.some((item) => item.class_id === selectedClassId.value)) {
    selectedClassId.value = ''
    selectedSessionId.value = ''
    selectedUserId.value = ''
    navLevel.value = 'classes'
  }
}

const mapRecords = (rows: TeacherTaskRecordStudent[]) => {
  sessionGroups.value = rows.map((student) => ({
    userId: student.user_id,
    studentName: student.username,
    recordsCount: student.records_count,
    sessions: [...student.records].sort((a, b) => getRecordTime(a.completed_at) - getRecordTime(b.completed_at)).map((record, index) => ({
      userId: student.user_id,
      studentName: student.username,
      attemptNo: index + 1,
      displayName: `${student.username} · 第 ${index + 1} 次提交`,
      sessionId: record.session_id,
      score: record.average_score,
      completedAt: record.completed_at,
    })),
  }))
  if (!flatSessions.value.some((session) => session.sessionId === selectedSessionId.value)) {
    const first = flatSessions.value[0]
    selectedSessionId.value = first?.sessionId ?? ''
    selectedUserId.value = first?.userId ? String(first.userId) : ''
  }
}

const mapDetails = (details: StudentSessionEvaluationItem[]) => {
  cleanupAudio()
  sentences.value = details.map((item) => ({
    id: item.eval_id,
    audioFileId: item.audio_file_id ?? null,
    text: item.sentence_text,
    score: Math.round(item.total_score),
    pronunciation: Number(item.pronunciation) || 0,
    rhythm: Number(item.rhythm) || 0,
    fluency: Number(item.fluency) || 0,
    completeness: Number(item.completeness) || 0,
    words: Array.isArray(item.words) ? item.words : [],
    teacherComment: item.teacher_notes ?? '',
  }))
  overallComment.value = ''
  activeSentenceIdx.value = null
}

const loadSessionDetails = async () => {
  if (!selectedUserId.value || !selectedSessionId.value) {
    sentences.value = []
    overallComment.value = ''
    return
  }
  const details = await detailsReq.run(() => getTeacherSessionDetails(selectedUserId.value, selectedSessionId.value))
  mapDetails(details)
}

const loadRecords = async () => {
  if (!selectedTaskId.value || !selectedClassId.value) {
    sessionGroups.value = []
    sentences.value = []
    return
  }
  const rows = await recordsReq.run(() => getTeacherTaskRecords(selectedClassId.value, selectedTaskId.value))
  mapRecords(rows)
  await loadSessionDetails()
}

const load = async () => {
  tasks.value = await tasksReq.run(() => getTeacherTasks())
  syncRouteSelection()
  if (selectedTaskId.value && selectedClassId.value) await loadRecords()
  updateQuery()
}

const selectTask = async (taskId: string) => {
  cleanupAudio()
  selectedTaskId.value = String(taskId)
  selectedClassId.value = ''
  selectedSessionId.value = ''
  selectedUserId.value = ''
  sessionGroups.value = []
  sentences.value = []
  overallComment.value = ''
  await goToLevel('classes')
}

const selectClass = async (classId: string) => {
  cleanupAudio()
  selectedClassId.value = classId
  selectedSessionId.value = ''
  selectedUserId.value = ''
  sentences.value = []
  overallComment.value = ''
  await goToLevel('sessions')
}

const selectSession = (session: SessionChoice) => {
  cleanupAudio()
  selectedSessionId.value = session.sessionId
  selectedUserId.value = String(session.userId)
}

const submitFeedback = async () => {
  if (!selectedSessionId.value) return
  const comment = {
    [selectedSessionId.value]: {
      comment: overallComment.value,
      evaluations: Object.fromEntries(sentences.value.map((item) => [item.id, item.teacherComment])),
    },
  }
  await saveReq.run(() => saveTeacherComments(comment))
  toast.push('评语已提交', 'success')
}

watch([selectedTaskId, selectedClassId], async () => {
  updateQuery()
  await loadRecords()
})

watch(selectedSessionId, async () => {
  const session = selectedSession.value
  selectedUserId.value = session?.userId ? String(session.userId) : selectedUserId.value
  updateQuery()
  await loadSessionDetails()
})

onMounted(() => {
  void load()
})

onBeforeUnmount(cleanupAudio)
</script>

<template>
  <div class="p-8 flex flex-col gap-6">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">批改作业</h2>
        <p class="text-sm font-bold text-[#9CA3AF] mt-1">选择任务、班级和学生提交后直接批改</p>
      </div>
    </div>

    <ErrorState
      v-if="tasksReq.error.value || recordsReq.error.value || detailsReq.error.value"
      :message="tasksReq.error.value || recordsReq.error.value || detailsReq.error.value || '获取批改记录失败'"
      :busy="tasksReq.loading.value || recordsReq.loading.value || detailsReq.loading.value"
      @retry="load"
    />

    <div class="grid grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
      <aside class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden h-[calc(100vh-160px)] flex flex-col">
        <div class="px-5 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
          <button
            v-if="navLevel !== 'tasks'"
            type="button"
            class="w-8 h-8 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] shrink-0"
            @click="goBackLevel"
          >
            ‹
          </button>
          <div class="min-w-0">
            <h3 class="text-sm font-black text-[#1F2937] truncate">{{ directoryTitle }}</h3>
            <p class="text-xs font-bold text-[#9CA3AF] mt-1 truncate">{{ directorySubtitle }}</p>
          </div>
        </div>

        <div ref="directoryScroll" class="flex-1 overflow-y-auto">
          <template v-if="navLevel === 'tasks'">
            <div v-if="tasksReq.loading.value" class="p-5">
              <SkeletonBlock class="h-12 w-full" />
            </div>
            <template v-else>
              <button
                v-for="task in tasks"
                :key="task.task_id"
                type="button"
                :class="[
                  'w-full text-left px-5 py-4 border-b border-[#F8FAFC] transition-colors',
                  String(task.task_id) === String(selectedTaskId)
                    ? 'bg-[#F2F5E8] text-[#356B00]'
                    : 'hover:bg-[#F8FAFC] text-[#1F2937]',
                ]"
                @click="selectTask(task.task_id)"
              >
                <span class="block text-sm font-black line-clamp-2">{{ task.title || '未命名任务' }}</span>
                <span class="block text-xs font-bold text-[#9CA3AF] mt-1">
                  {{ task.task_type === 'homework' ? '作业' : '练习' }} · {{ task.course.length }} 个班级
                </span>
              </button>
            </template>
            <div v-if="!tasksReq.loading.value && tasks.length === 0" class="p-8 text-center text-sm font-bold text-[#9CA3AF]">暂无任务</div>
          </template>

          <template v-else-if="navLevel === 'classes'">
            <div v-if="!selectedTask" class="p-8 text-center text-sm font-bold text-[#9CA3AF]">
              请先选择任务
            </div>
            <template v-else>
              <button
                v-for="klass in taskClasses"
                :key="klass.class_id"
                type="button"
                :class="[
                  'w-full text-left px-5 py-4 border-b border-[#F8FAFC] transition-colors',
                  klass.class_id === selectedClassId
                    ? 'bg-[#EAF6FF] text-[#01658B]'
                    : 'hover:bg-[#F8FAFC] text-[#1F2937]',
                ]"
                @click="selectClass(klass.class_id)"
              >
                <span class="block text-sm font-black line-clamp-2">{{ klass.class_name }}</span>
                <span class="block text-xs font-bold text-[#9CA3AF] mt-1">{{ klass.class_id }}</span>
              </button>
            </template>
            <div v-if="selectedTask && taskClasses.length === 0" class="p-8 text-center text-sm font-bold text-[#9CA3AF]">该任务暂无班级</div>
          </template>

          <template v-else>
            <div v-if="recordsReq.loading.value" class="p-5">
              <SkeletonBlock class="h-12 w-full" />
            </div>

            <div v-else-if="sessionGroups.length === 0" class="p-8 text-center text-sm font-bold text-[#9CA3AF]">
              暂无提交记录
            </div>

            <div v-else class="divide-y divide-[#F1F5F9]">
              <div v-for="student in sessionGroups" :key="student.userId" class="px-5 py-4 flex flex-col gap-3">
                <div>
                  <p class="text-sm font-black text-[#1F2937]">{{ student.studentName }}</p>
                  <p class="text-xs font-bold text-[#9CA3AF] mt-1">{{ student.recordsCount }} 次提交</p>
                </div>

                <div v-if="student.sessions.length === 0" class="rounded-lg bg-[#F8FAFC] px-4 py-3 text-xs font-bold text-[#9CA3AF]">
                  暂无提交
                </div>

                <template v-else>
                  <button
                    v-for="session in student.sessions"
                    :key="session.sessionId"
                    type="button"
                    :class="[
                      'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                      session.sessionId === selectedSessionId
                        ? 'border-[#356B00] bg-[#F2F5E8]'
                        : 'border-[#E2E8F0] hover:border-[#58CC02] hover:bg-[#F8FAFC]',
                    ]"
                    @click="selectSession(session)"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-xs font-black text-[#1F2937] truncate">{{ session.displayName }}</span>
                      <span class="text-sm font-black" :class="session.score != null ? 'text-[#356B00]' : 'text-[#9CA3AF]'">
                        {{ session.score ?? '未评分' }}
                      </span>
                    </div>
                    <p class="text-xs font-bold text-[#9CA3AF] mt-1">{{ formatDate(session.completedAt) }}</p>
                  </button>
                </template>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <section class="min-w-0 flex flex-col gap-4">
        <div class="grid grid-cols-4 gap-0">
          <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5" style="border-left: 4px solid #01658B;">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">学生数</span>
            <p class="text-2xl font-black text-[#1F2937] mt-2">{{ stats.students }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5" style="border-left: 4px solid #356B00;">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">提交次数</span>
            <p class="text-2xl font-black text-[#1F2937] mt-2">{{ stats.sessions }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5" style="border-left: 4px solid #FFB800;">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">待查看</span>
            <p class="text-2xl font-black text-[#1F2937] mt-2">{{ stats.pending }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5" style="border-left: 4px solid #BA1A1A;">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">平均分</span>
            <p class="text-2xl font-black text-[#1F2937] mt-2">{{ stats.avgScore.toFixed(1) }}</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.08)] border border-[#F1F5F9] flex overflow-hidden min-h-[680px]">
          <div class="w-[260px] shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col">
            <div class="px-4 py-4 border-b border-[#F1F5F9]">
              <h3 class="text-sm font-black text-[#1F2937]">句子列表</h3>
              <p class="text-xs font-bold text-[#9CA3AF] mt-0.5">
                {{ selectedSession?.displayName ?? '未选择提交' }}
              </p>
            </div>

            <div v-if="detailsReq.loading.value" class="p-4">
              <SkeletonBlock class="h-12 w-full" />
            </div>

            <div v-else-if="sentences.length === 0" class="p-8 text-center text-sm font-bold text-[#9CA3AF]">
              请选择一个学生提交
            </div>

            <div v-else class="flex-1 overflow-auto">
              <button
                type="button"
                :class="[
                  'w-full text-left px-4 py-4 border-b border-[#F8FAFC] transition-colors',
                  activeSentenceIdx == null
                    ? 'bg-[#F2F5E8] border-l-2 border-l-[#356B00]'
                    : 'hover:bg-[#F8FAFC]',
                ]"
                @click="activeSentenceIdx = null"
              >
                <span class="text-xs font-black text-[#356B00]">总体评价</span>
                <p class="text-sm font-bold text-[#1F2937] mt-1 line-clamp-2">
                  {{ overallComment || '填写本次提交的整体反馈' }}
                </p>
              </button>

              <div
                v-for="(sentence, idx) in sentences"
                :key="sentence.id"
                role="button"
                tabindex="0"
                :class="[
                  'w-full text-left px-4 py-3 border-b border-[#F8FAFC] transition-colors cursor-pointer',
                  idx === activeSentenceIdx
                    ? 'bg-[#F2F5E8] border-l-2 border-l-[#356B00]'
                    : 'hover:bg-[#F8FAFC]',
                ]"
                @click="activeSentenceIdx = idx"
                @keydown.enter="activeSentenceIdx = idx"
                @keydown.space.prevent="activeSentenceIdx = idx"
              >
                <span class="text-xs font-bold text-[#64748B]">句子 {{ idx + 1 }}</span>
                <p class="text-sm font-bold text-[#1F2937] mt-1 line-clamp-2">{{ sentence.text }}</p>
                <span class="mt-2 block text-xs font-black text-[#356B00]">{{ sentence.score }}分</span>
              </div>
            </div>
          </div>

          <div class="flex-1 flex flex-col p-6 overflow-auto">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-black text-[#1F2937]">批改面板</h3>
                <p class="text-sm text-[#9CA3AF] font-bold">
                  {{ selectedTask?.title ?? '未选择任务' }} · {{ selectedClass?.class_name ?? '未选择班级' }}
                </p>
              </div>
              <button
                class="px-4 py-2 rounded-lg bg-[#356B00] text-white text-sm font-bold hover:bg-[#2E5E00] transition-colors disabled:opacity-60"
                :disabled="saveReq.loading.value || !selectedSessionId"
                @click="submitFeedback"
              >
                {{ saveReq.loading.value ? '提交中...' : '提交评分' }}
              </button>
            </div>

            <div v-if="selectedSessionId && activeSentenceIdx == null" class="flex flex-col gap-6">
              <div class="bg-[#F8FAFC] rounded-xl p-4">
                <p class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider mb-2">总体评价</p>
                <p class="text-base font-bold text-[#1F2937]">
                  {{ selectedSession?.displayName ?? '当前提交' }}
                </p>
              </div>

              <div class="flex flex-col gap-3">
                <span class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider">教师总评</span>
                <textarea
                  v-model="overallComment"
                  class="w-full h-40 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
                  placeholder="输入对本次提交的整体评价..."
                />
              </div>
            </div>

            <div v-else-if="activeSentence" class="flex flex-col gap-6">
              <div class="flex items-stretch gap-3">
                <div class="min-w-0 flex-1 bg-[#F8FAFC] rounded-xl p-4">
                  <p class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider mb-2">原文</p>
                  <p class="text-base font-bold text-[#1F2937] leading-relaxed">{{ activeSentence.text }}</p>
                </div>
                <div class="relative flex w-[112px] shrink-0 flex-col justify-end">
                  <div
                    v-if="loadingAudioId === activeSentence.id || playingAudioId === activeSentence.id"
                    class="absolute bottom-[calc(100%+10px)] right-0 w-[220px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-[0px_16px_35px_rgba(15,23,42,0.14)]"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-xs font-black text-[#1F2937]">录音播放</span>
                      <span class="text-xs font-black text-[#64748B]">
                        {{ formatAudioTime(audioCurrentTime) }} / {{ formatAudioTime(audioDuration) }}
                      </span>
                    </div>
                    <div class="mt-3 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        class="h-full rounded-full bg-[#58CC02] transition-[width] duration-150"
                        :style="{ width: `${audioProgress}%` }"
                      ></div>
                    </div>
                    <div class="mt-3 flex items-center gap-3">
                      <span class="w-10 text-xs font-black text-[#64748B]">音量</span>
                      <input
                        v-model.number="audioVolume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="h-2 min-w-0 flex-1 accent-[#58CC02]"
                        @input="updateAudioVolume"
                      />
                      <span class="w-9 text-right text-xs font-black text-[#64748B]">{{ Math.round(audioVolume * 100) }}%</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-black text-[#356B00] shadow-sm hover:bg-[#F2F5E8] disabled:opacity-60"
                    :disabled="loadingAudioId === activeSentence.id"
                    @click="playEvaluationAudio(activeSentence)"
                  >
                    <Square v-if="playingAudioId === activeSentence.id" class="h-5 w-5" />
                    <PlayCircle v-else class="h-5 w-5" />
                    {{ loadingAudioId === activeSentence.id ? '加载中' : playingAudioId === activeSentence.id ? '停止' : '听录音' }}
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <span class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider">机器评分</span>
                <div class="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-4">
                  <div class="flex items-end gap-2">
                    <span class="text-4xl font-black text-[#356B00]">{{ activeSentence.score }}</span>
                    <span class="pb-1 text-sm font-black text-[#64748B]">/ 100 分</span>
                  </div>
                  <div class="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      class="h-full rounded-full bg-[#58CC02]"
                      :style="{ width: `${Math.min(Math.max(activeSentence.score, 0), 100)}%` }"
                    ></div>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
                    <div class="rounded-lg bg-white border border-[#E2E8F0] p-3">
                      <div class="text-xs font-black text-[#64748B] mb-2">{{ activeSentenceRadarItems.length }} 维雷达图</div>
                      <ScoreRadarChart :items="activeSentenceRadarItems" color="#58CC02" :height="'220px'" />
                    </div>

                    <div class="rounded-lg bg-white border border-[#E2E8F0] p-3 flex flex-col gap-2 min-w-0">
                      <div class="text-xs font-black text-[#64748B]">单词/音素评分（{{ activeSentenceWords.length }} 个）</div>
                      <div v-if="!activeSentenceWords.length" class="flex-1 rounded-lg bg-[#F8FAFC] p-4 text-xs font-bold text-[#9CA3AF] flex items-center justify-center">
                        暂无单词级明细
                      </div>
                      <div v-else class="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                        <div
                          v-for="word in activeSentenceWords"
                          :key="`${word.word}-${toNumber(word.pronunciation)}`"
                          class="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3 flex flex-col gap-1.5"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5 min-w-0">
                              <span class="text-sm font-black text-[#1F2937] truncate">{{ word.word }}</span>
                              <span v-if="word.error_type && word.error_type !== 'None'" class="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600">
                                {{ word.error_type }}
                              </span>
                            </div>
                            <span class="text-xs font-black" :class="scoreColor(toNumber(word.pronunciation))">
                              {{ toNumber(word.pronunciation).toFixed(1) }} 分
                            </span>
                          </div>
                          <div v-if="word.phonemes?.length" class="flex flex-wrap gap-1.5">
                            <span
                              v-for="phoneme in word.phonemes"
                              :key="`${phoneme.phoneme}-${toNumber(phoneme.pronunciation)}`"
                              class="rounded bg-white border border-[#E2E8F0] px-1.5 py-0.5 text-[11px] font-bold text-[#64748B]"
                            >
                              {{ phoneme.phoneme }}
                              <span :class="scoreColor(toNumber(phoneme.pronunciation))">{{ toNumber(phoneme.pronunciation).toFixed(1) }}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <span class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider">教师评语</span>
                <textarea
                  v-model="activeSentence.teacherComment"
                  class="w-full h-32 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
                  placeholder="输入对该句子的评价..."
                />
              </div>
            </div>

            <div v-else class="flex-1 flex items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
              <p class="text-sm font-bold text-[#9CA3AF]">从左侧选择一个学生提交开始批改</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
