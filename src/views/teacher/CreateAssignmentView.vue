<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherClasses, publishTeacherTask, saveTeacherTemplate, segmentTeacherContent, type TaskMode, type TeacherClassItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const toast = useToast()
const classesReq = useAsync<TeacherClassItem[]>()
const saveReq = useAsync<{ success: boolean }>()
const templateReq = useAsync<{ success: boolean }>()

const title = ref('')
const contentText = ref('')
/** 留空表示不限次数（提交 null 给后端） */
const maxSubmissions = ref<number | null>(3)
const selectedMode = ref<TaskMode>('sentence')
const taskType = ref<'homework' | 'practice'>('homework')
const segmentedSentences = ref<string[]>([])
const segmentEditorOpen = ref(false)
const segmentDraft = ref<string[]>([])
const classes = ref<TeacherClassItem[]>([])
const selectedClassIds = ref<string[]>([])
const notes = ref('')
const DEFAULT_DURATION_MS = 7 * 24 * 60 * 60 * 1000
type TimeField = 'from' | 'until'
type CalendarPanel = 'date' | 'year' | 'month'

const toDateTimeInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const availableFrom = ref(toDateTimeInput(new Date()))
const availableUntil = ref(toDateTimeInput(new Date(Date.now() + DEFAULT_DURATION_MS)))
const activeTimeField = ref<TimeField | null>(null)
const calendarMonth = ref(new Date())
const calendarPanel = ref<CalendarPanel>('date')

const hourOptions = Array.from({ length: 24 }, (_, index) => index)
const minuteOptions = Array.from({ length: 60 }, (_, index) => index)
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const monthOptions = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)
const timeFieldConfigs = [
  { id: 'from', label: '开始时间' },
  { id: 'until', label: '截止时间' },
] as const

const modes: Array<{ id: TaskMode; label: string; desc: string }> = [
  { id: 'sentence', label: '句子模式', desc: '正常评测，逐句练习发音' },
  { id: 'word', label: '单词模式', desc: '仅评测音准，逐个单词纠音' },
  { id: 'pair', label: '词对模式', desc: '对照练习，含相同音素的单词成对练' },
]

/** 各模式的文案与切分提示，避免模板里堆三元表达式 */
const modeCopy: Record<TaskMode, {
  unit: string
  segmentTitle: string
  segmentEmpty: string
  overviewTitle: string
  overviewEmpty: string
  contentHint: string
  contentPlaceholder: string
}> = {
  sentence: {
    unit: '句',
    segmentTitle: '分句结果',
    segmentEmpty: '输入文本后将自动分句',
    overviewTitle: '句子概览',
    overviewEmpty: '暂无分句',
    contentHint: '输入多语种课文或对话内容',
    contentPlaceholder: '请输入发布内容文本...',
  },
  word: {
    unit: '词',
    segmentTitle: '分词结果',
    segmentEmpty: '输入单词后将自动分词',
    overviewTitle: '单词概览',
    overviewEmpty: '暂无单词',
    contentHint: '每行一个单词，或用空格、逗号分隔',
    contentPlaceholder: '请输入要练习的单词，例如：\nbitte\nBitte',
  },
  pair: {
    unit: '对',
    segmentTitle: '词对结果',
    segmentEmpty: '输入词对后将自动整理',
    overviewTitle: '词对概览',
    overviewEmpty: '暂无词对',
    contentHint: '每行一组词对，用空格、逗号或 / 分隔两个单词',
    contentPlaceholder: '请输入词对，例如：\nBett / Beet\nbitte / bitten',
  },
}

const modeText = computed(() => modeCopy[selectedMode.value])

/** 句子模式下由后端分句接口切分 */
const segmentByBackend = async (text: string): Promise<string[]> => {
  try {
    const res = await segmentTeacherContent(text)
    return res.segments.length ? res.segments : [text]
  } catch {
    // 兜底：后端分句接口失败时前端自分句。用 match 保留句末标点，避免 split 丢弃标点
    return (text.match(/[^.!?。！？\n]+[.!?。！？]*/g) || [])
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

/** 单词模式：按换行/逗号/空白切词，单个元素 = 一次跟读 */
const splitWords = (text: string) =>
  text.split(/[\n,;，；、\s]+/).map((word) => word.trim()).filter(Boolean)

/** 词对模式：每行一对，规范化为 `mot1, mot2`，一对 = 一次跟读 */
const splitPairs = (text: string) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[,;，；、/|]+|\s+/).map((part) => part.trim()).filter(Boolean).join(', '))
    .filter(Boolean)

const taskTypes = [
  { id: 'homework', label: '作业任务', hint: '老师可以看到学生反馈' },
  { id: 'practice', label: '练习任务', hint: '老师看不到反馈，学生可自由练习' },
] as const

/** 记录上一次切分所用的原文，避免内容未变时重复切分覆盖老师在弹窗里的修改 */
const segmentSource = ref('')

const onSegment = () => {
  const text = contentText.value.trim()
  if (!text) return
  if (text === segmentSource.value) return
  void segment()
}

/** 用新结果覆盖分句；仅在结果变化时弹出可修改确认窗口，避免每次失焦都弹 */
const applySegments = (next: string[], openEditor = true) => {
  const changed = next.join('\n') !== segmentedSentences.value.join('\n')
  segmentedSentences.value = next
  if (openEditor && changed && next.length) {
    segmentDraft.value = [...next]
    segmentEditorOpen.value = true
  }
}

const addSegmentDraft = () => {
  segmentDraft.value.push('')
}

const removeSegmentDraft = (index: number) => {
  segmentDraft.value.splice(index, 1)
}

const cancelSegmentDraft = () => {
  segmentEditorOpen.value = false
}

const confirmSegmentDraft = () => {
  const cleaned = segmentDraft.value.map((item) => item.trim()).filter(Boolean)
  if (!cleaned.length) {
    toast.push('请至少保留一条内容', 'warning')
    return
  }
  segmentedSentences.value = cleaned
  segmentEditorOpen.value = false
}

const maxSubmissionsInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value.trim()
  if (!raw) {
    maxSubmissions.value = null
    return
  }
  const value = Math.floor(Number(raw))
  if (!Number.isFinite(value) || value < 1) {
    maxSubmissions.value = null
    return
  }
  maxSubmissions.value = Math.min(value, 99)
}

const selectedClasses = computed(() => classes.value.filter((item) => selectedClassIds.value.includes(item.class_id)))
const selectedStudentCount = computed(() => selectedClasses.value.reduce((sum, item) => sum + item.student_count, 0))
const hasClasses = computed(() => classes.value.length > 0)
const allClassesSelected = computed(() => hasClasses.value && selectedClassIds.value.length === classes.value.length)
const activeDateTime = computed(() => {
  if (!activeTimeField.value) return null
  return parseDateTimeInput(activeTimeField.value === 'from' ? availableFrom.value : availableUntil.value)
})
const calendarDays = computed(() => {
  const firstDay = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth(), 1)
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    return {
      key: toDateTimeInput(date).slice(0, 10),
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === calendarMonth.value.getMonth(),
      isToday: isSameDate(date, new Date()),
      isSelected: activeDateTime.value ? isSameDate(date, activeDateTime.value) : false,
    }
  })
})
const calendarTitle = computed(() => `${calendarMonth.value.getFullYear()}年${calendarMonth.value.getMonth() + 1}月`)
const yearPageStart = computed(() => Math.floor(calendarMonth.value.getFullYear() / 12) * 12)
const yearOptions = computed(() => Array.from({ length: 12 }, (_, index) => yearPageStart.value + index))
const calendarNavTitle = computed(() => {
  if (calendarPanel.value === 'year') return `${yearPageStart.value} - ${yearPageStart.value + 11}`
  if (calendarPanel.value === 'month') return `${calendarMonth.value.getFullYear()}年`
  return calendarTitle.value
})
const isTimeRangeInvalid = computed(() => {
  if (!availableFrom.value || !availableUntil.value) return false
  return new Date(availableFrom.value).getTime() >= new Date(availableUntil.value).getTime()
})
const timeRangeHint = computed(() => {
  if (!availableFrom.value || !availableUntil.value) return '请选择任务开放的起止时间'
  const from = new Date(availableFrom.value).getTime()
  const until = new Date(availableUntil.value).getTime()
  if (from >= until) return '截止时间需要晚于开始时间'
  const hours = Math.max(1, Math.round((until - from) / (60 * 60 * 1000)))
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  if (days <= 0) return `开放约 ${hours} 小时`
  return `开放约 ${days} 天${restHours ? ` ${restHours} 小时` : ''}`
})

const toggleAllClasses = () => {
  selectedClassIds.value = allClassesSelected.value ? [] : classes.value.map((item) => item.class_id)
}

function parseDateTimeInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  return Number.isNaN(date.getTime()) ? null : date
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

const getTimeValue = (field: TimeField) => field === 'from' ? availableFrom.value : availableUntil.value
const setTimeValue = (field: TimeField, date: Date) => {
  if (field === 'from') availableFrom.value = toDateTimeInput(date)
  else availableUntil.value = toDateTimeInput(date)
}

const formatDisplayDateTime = (value: string) => {
  const date = parseDateTimeInput(value)
  if (!date) return '请选择时间'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const openTimePicker = (field: TimeField) => {
  activeTimeField.value = activeTimeField.value === field ? null : field
  const date = parseDateTimeInput(getTimeValue(field)) ?? new Date()
  calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
  calendarPanel.value = 'date'
}

const shiftCalendarView = (step: number) => {
  if (calendarPanel.value === 'year') {
    calendarMonth.value = new Date(calendarMonth.value.getFullYear() + step * 12, calendarMonth.value.getMonth(), 1)
    return
  }
  if (calendarPanel.value === 'month') {
    calendarMonth.value = new Date(calendarMonth.value.getFullYear() + step, calendarMonth.value.getMonth(), 1)
    return
  }
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + step, 1)
}

const selectCalendarYear = (year: number) => {
  calendarMonth.value = new Date(year, calendarMonth.value.getMonth(), 1)
  calendarPanel.value = 'month'
}

const selectCalendarMonth = (month: number) => {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), month, 1)
  calendarPanel.value = 'date'
}

const selectCalendarDate = (date: Date) => {
  if (!activeTimeField.value) return
  const current = parseDateTimeInput(getTimeValue(activeTimeField.value)) ?? new Date()
  setTimeValue(activeTimeField.value, new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    current.getHours(),
    current.getMinutes(),
  ))
}

const setTimePart = (part: 'hour' | 'minute', value: number) => {
  if (!activeTimeField.value) return
  const current = parseDateTimeInput(getTimeValue(activeTimeField.value)) ?? new Date()
  if (part === 'hour') current.setHours(value)
  else current.setMinutes(value)
  setTimeValue(activeTimeField.value, current)
}

const useTodayForActiveField = () => {
  if (!activeTimeField.value) return
  const now = new Date()
  setTimeValue(activeTimeField.value, now)
  calendarMonth.value = new Date(now.getFullYear(), now.getMonth(), 1)
  calendarPanel.value = 'date'
}

const setAvailableFromNow = () => {
  const now = new Date()
  const currentFrom = new Date(availableFrom.value).getTime()
  const currentUntil = new Date(availableUntil.value).getTime()
  const duration = currentUntil > currentFrom ? currentUntil - currentFrom : DEFAULT_DURATION_MS
  availableFrom.value = toDateTimeInput(now)
  availableUntil.value = toDateTimeInput(new Date(now.getTime() + duration))
}

const toIso = (value: string) => {
  if (!value) return null
  return new Date(value).toISOString()
}

const segment = async (openEditor = true) => {
  const text = contentText.value.trim()
  if (!text) {
    segmentedSentences.value = []
    segmentSource.value = ''
    return
  }
  segmentSource.value = text
  if (selectedMode.value === 'word') {
    applySegments(splitWords(text), openEditor)
    return
  }
  if (selectedMode.value === 'pair') {
    applySegments(splitPairs(text), openEditor)
    return
  }
  applySegments(await segmentByBackend(text), openEditor)
}

const onModeSelect = (mode: TaskMode) => {
  if (selectedMode.value === mode) return
  selectedMode.value = mode
  if (contentText.value.trim()) void segment()
}

const publish = async () => {
  if (!selectedClassIds.value.length) {
    toast.push('请至少选择一个班级', 'warning')
    return
  }
  if (!title.value.trim()) {
    toast.push('请输入练习标题', 'warning')
    return
  }
  if (!segmentedSentences.value.length) await segment(false)
  if (!segmentedSentences.value.length) {
    toast.push('请输入练习内容', 'warning')
    return
  }
  const from = toIso(availableFrom.value)
  const until = toIso(availableUntil.value)
  if (!from || !until) {
    toast.push('请选择开始和截止时间', 'warning')
    return
  }
  if (new Date(from).getTime() >= new Date(until).getTime()) {
    toast.push('截止时间需要晚于开始时间', 'warning')
    return
  }

  try {
    await saveReq.run(() => publishTeacherTask({
      classIds: selectedClassIds.value,
      title: title.value.trim(),
      segments: segmentedSentences.value,
      notes: notes.value.trim() || null,
      mode: selectedMode.value,
      taskType: taskType.value,
      maxAttempt: maxSubmissions.value,
      availableFrom: from,
      availableUntil: until,
    }))
    toast.push('任务已发布', 'success')
    await router.push('/teacher/content')
  } catch {
    toast.push(saveReq.error.value ?? '发布失败，请稍后重试', 'error')
  }
}

const saveAsTemplate = async () => {
  if (!title.value.trim()) {
    toast.push('请输入模板标题', 'warning')
    return
  }
  if (!segmentedSentences.value.length) await segment(false)
  if (!segmentedSentences.value.length) {
    toast.push('请输入练习内容', 'warning')
    return
  }
  try {
    await templateReq.run(() => saveTeacherTemplate({
      title: title.value.trim(),
      segments: segmentedSentences.value,
      isPublic: true,
    }))
    toast.push('已保存为模板（同校公开）', 'success')
  } catch {
    toast.push(templateReq.error.value ?? '保存模板失败，请稍后重试', 'error')
  }
}
const onSaveAsTemplate = () => {
  void saveAsTemplate()
}
const onPublish = () => {
  void publish()
}

const load = async () => {
  classes.value = await classesReq.run(() => getTeacherClasses())
  selectedClassIds.value = classes.value[0]?.class_id ? [classes.value[0].class_id] : []
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-8 flex gap-6">
    <div class="flex-1 flex flex-col gap-6">
      <div class="flex flex-col gap-6">
        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-black text-[#1F2937]">任务基础信息</h3>
            <input
              v-model="title"
              type="text"
              placeholder="练习标题"
              class="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02]"
            />
            <div class="flex flex-col gap-2">
              <span class="text-xs font-black text-[#64748B]">任务类型</span>
              <div class="flex items-center gap-2">
                <div v-for="item in taskTypes" :key="item.id" class="relative group">
                  <button
                    type="button"
                    :class="[
                      'px-4 py-2 rounded-lg border text-xs font-black transition-colors',
                      taskType === item.id
                        ? 'bg-[#356B00] border-[#356B00] text-white'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#58CC02]',
                    ]"
                    @click="taskType = item.id"
                  >
                    {{ item.label }}
                  </button>
                  <span
                    class="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-30 w-max max-w-[220px] rounded-lg bg-[#1F2937] px-3 py-2 text-xs font-bold leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  >
                    {{ item.hint }}
                  </span>
                </div>
              </div>
            </div>
            <textarea
              v-model="notes"
              placeholder="任务备注（可选）"
              class="w-full h-20 rounded-lg border border-[#E2E8F0] p-3 text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-0">
          <div
            v-for="mode in modes"
            :key="mode.id"
            :class="[
              'bg-white rounded-xl p-6 flex flex-col gap-2 cursor-pointer transition-colors border shadow-[0px_4px_20px_rgba(0,0,0,0.04)]',
              selectedMode === mode.id
                ? 'border-[#356B00] border-2'
                : 'border-[#F1F5F9] hover:border-[#58CC02]/20',
            ]"
            @click="onModeSelect(mode.id)"
          >
            <h3 class="text-sm font-black text-[#1F2937]">{{ mode.label }}</h3>
            <p class="text-xs font-bold text-[#9CA3AF]">{{ mode.desc }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <span class="text-sm font-black text-[#1F2937]">内容文本</span>
            <span class="text-xs font-bold text-[#9CA3AF]">{{ modeText.contentHint }}</span>
          </div>
          <textarea
            v-model="contentText"
            class="w-full h-44 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
            :placeholder="modeText.contentPlaceholder"
            @blur="onSegment"
          />
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-black text-[#1F2937]">{{ modeText.segmentTitle }}</h3>
          </div>

          <div v-if="segmentedSentences.length === 0" class="flex items-center justify-center py-8">
            <p class="text-sm font-bold text-[#9CA3AF]">{{ modeText.segmentEmpty }}</p>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(sentence, idx) in segmentedSentences"
              :key="idx"
              class="flex items-center gap-3 px-4 py-2 bg-[#F8FAFC] rounded-lg"
            >
              <span class="text-xs font-black text-[#9CA3AF] w-8 shrink-0">#{{ idx + 1 }}</span>
              <span class="text-sm font-bold text-[#1F2937]">{{ sentence }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-black text-[#1F2937]">开放时间与提交次数</h3>
            <div class="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-xs font-black text-[#64748B] uppercase tracking-widest">时间设置</span>
                <span
                  :class="[
                    'text-xs font-bold',
                    isTimeRangeInvalid ? 'text-[#BA1A1A]' : 'text-[#356B00]',
                  ]"
                >
                  {{ timeRangeHint }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="field in timeFieldConfigs"
                  :key="field.id"
                  class="relative flex flex-col gap-1"
                >
                  <span class="flex items-center justify-between gap-2 h-7">
                    <span class="text-xs font-bold text-[#9CA3AF]">{{ field.label }}</span>
                    <button
                      v-if="field.id === 'from'"
                      type="button"
                      class="px-2.5 py-1 rounded-md bg-white border border-[#D7E5C8] text-xs font-black text-[#356B00] hover:bg-[#F2F5E8] transition-colors"
                      @click="setAvailableFromNow"
                    >
                      现在
                    </button>
                  </span>

                  <button
                    type="button"
                    :class="[
                      'w-full px-4 py-3 rounded-lg border bg-white text-left text-sm font-bold text-[#1F2937] outline-none hover:border-[#58CC02] transition-colors flex items-center justify-between gap-3',
                      field.id === 'until' && isTimeRangeInvalid ? 'border-[#BA1A1A]' : 'border-[#E2E8F0]',
                      activeTimeField === field.id ? 'ring-2 ring-[#D7E5C8] border-[#58CC02]' : '',
                    ]"
                    @click="openTimePicker(field.id)"
                  >
                    <span>{{ formatDisplayDateTime(getTimeValue(field.id)) }}</span>
                    <span class="text-[#9CA3AF]">▾</span>
                  </button>

                  <div
                    v-if="activeTimeField === field.id"
                    :class="[
                      'absolute z-30 top-[calc(100%+8px)] w-[520px] rounded-xl border border-[#E2E8F0] bg-white shadow-[0px_24px_70px_rgba(15,23,42,0.16)] p-4',
                      field.id === 'until' ? 'right-0' : 'left-0',
                    ]"
                  >
                    <div class="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p class="text-sm font-black text-[#1F2937]">{{ field.label }}</p>
                        <p class="text-xs font-bold text-[#9CA3AF] mt-0.5">{{ formatDisplayDateTime(getTimeValue(field.id)) }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="w-8 h-8 rounded-lg border border-[#E2E8F0] text-[#64748B] font-black hover:bg-[#F8FAFC]"
                          @click="shiftCalendarView(-1)"
                        >
                          ‹
                        </button>
                        <span
                          v-if="calendarPanel !== 'date'"
                          class="min-w-28 text-center text-sm font-black text-[#1F2937]"
                        >
                          {{ calendarNavTitle }}
                        </span>
                        <span v-else class="min-w-28 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            class="px-2 py-1 rounded-md text-sm font-black text-[#1F2937] hover:bg-[#F8FAFC]"
                            @click="calendarPanel = 'year'"
                          >
                            {{ calendarMonth.getFullYear() }}年
                          </button>
                          <button
                            type="button"
                            class="px-2 py-1 rounded-md text-sm font-black text-[#1F2937] hover:bg-[#F8FAFC]"
                            @click="calendarPanel = 'month'"
                          >
                            {{ calendarMonth.getMonth() + 1 }}月
                          </button>
                        </span>
                        <button
                          type="button"
                          class="w-8 h-8 rounded-lg border border-[#E2E8F0] text-[#64748B] font-black hover:bg-[#F8FAFC]"
                          @click="shiftCalendarView(1)"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div
                      :class="[
                        calendarPanel === 'date'
                          ? 'grid grid-cols-[minmax(0,1fr)_160px] gap-4'
                          : 'block',
                      ]"
                    >
                      <div>
                        <div v-if="calendarPanel === 'year'" class="grid grid-cols-3 gap-2">
                          <button
                            v-for="year in yearOptions"
                            :key="year"
                            type="button"
                            :class="[
                              'h-12 rounded-lg text-sm font-black transition-colors',
                              year === calendarMonth.getFullYear()
                                ? 'bg-[#356B00] text-white'
                                : 'text-[#1F2937] hover:bg-[#F8FAFC]',
                            ]"
                            @click="selectCalendarYear(year)"
                          >
                            {{ year }}
                          </button>
                        </div>

                        <div v-else-if="calendarPanel === 'month'" class="grid grid-cols-3 gap-2">
                          <button
                            v-for="(month, index) in monthOptions"
                            :key="month"
                            type="button"
                            :class="[
                              'h-12 rounded-lg text-sm font-black transition-colors',
                              index === calendarMonth.getMonth()
                                ? 'bg-[#356B00] text-white'
                                : 'text-[#1F2937] hover:bg-[#F8FAFC]',
                            ]"
                            @click="selectCalendarMonth(index)"
                          >
                            {{ month }}
                          </button>
                        </div>

                        <template v-else>
                          <div class="grid grid-cols-7 gap-1 mb-2">
                            <span
                              v-for="day in weekDays"
                              :key="day"
                              class="h-7 flex items-center justify-center text-xs font-black text-[#94A3B8]"
                            >
                              {{ day }}
                            </span>
                          </div>
                          <div class="grid grid-cols-7 gap-1">
                            <button
                              v-for="day in calendarDays"
                              :key="day.key"
                              type="button"
                              :class="[
                                'h-9 rounded-lg text-sm font-bold transition-colors',
                                day.isSelected
                                  ? 'bg-[#356B00] text-white'
                                  : day.isToday
                                    ? 'bg-[#F2F5E8] text-[#356B00]'
                                    : day.inMonth
                                      ? 'text-[#1F2937] hover:bg-[#F8FAFC]'
                                      : 'text-[#CBD5E1] hover:bg-[#F8FAFC]',
                              ]"
                              @click="selectCalendarDate(day.date)"
                            >
                              {{ day.day }}
                            </button>
                          </div>
                        </template>
                      </div>

                      <div v-if="calendarPanel === 'date'" class="grid grid-cols-2 gap-2">
                        <div class="flex flex-col gap-2">
                          <span class="text-xs font-black text-[#94A3B8] text-center">时</span>
                          <div class="max-h-64 overflow-y-auto rounded-lg bg-[#F8FAFC] p-1">
                            <button
                              v-for="hour in hourOptions"
                              :key="hour"
                              type="button"
                              :class="[
                                'w-full h-8 rounded-md text-xs font-black transition-colors',
                                activeDateTime?.getHours() === hour
                                  ? 'bg-[#356B00] text-white'
                                  : 'text-[#475569] hover:bg-white',
                              ]"
                              @click="setTimePart('hour', hour)"
                            >
                              {{ String(hour).padStart(2, '0') }}
                            </button>
                          </div>
                        </div>

                        <div class="flex flex-col gap-2">
                          <span class="text-xs font-black text-[#94A3B8] text-center">分</span>
                          <div class="max-h-64 overflow-y-auto rounded-lg bg-[#F8FAFC] p-1">
                            <button
                              v-for="minute in minuteOptions"
                              :key="minute"
                              type="button"
                              :class="[
                                'w-full h-8 rounded-md text-xs font-black transition-colors',
                                activeDateTime?.getMinutes() === minute
                                  ? 'bg-[#356B00] text-white'
                                  : 'text-[#475569] hover:bg-white',
                              ]"
                              @click="setTimePart('minute', minute)"
                            >
                              {{ String(minute).padStart(2, '0') }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
                      <button
                        type="button"
                        class="px-3 py-2 rounded-lg text-xs font-black text-[#356B00] hover:bg-[#F2F5E8]"
                        @click="useTodayForActiveField"
                      >
                        今天
                      </button>
                      <button
                        type="button"
                        class="px-4 py-2 rounded-lg bg-[#356B00] text-xs font-black text-white hover:bg-[#2E5E00]"
                        @click="activeTimeField = null"
                      >
                        确定
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-[#9CA3AF]">最大提交次数</span>
              <input
                :value="maxSubmissions ?? ''"
                type="number"
                min="1"
                max="99"
                placeholder="不限"
                class="w-20 px-3 py-3 rounded-lg border border-[#E2E8F0] text-sm text-center font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02]"
                @input="maxSubmissionsInput"
              />
              <span class="text-xs font-bold text-[#9CA3AF]">留空表示不限次数</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-[320px] shrink-0 flex flex-col gap-5">
      <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-black text-[#1F2937]">班级信息</span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-black text-[#356B00] hover:bg-[#F2F5E8] disabled:text-[#CBD5E1] disabled:hover:bg-white transition-colors"
            :disabled="!hasClasses || classesReq.loading.value"
            @click="toggleAllClasses"
          >
            {{ allClassesSelected ? '取消全选' : '全选班级' }}
          </button>
        </div>
        <div v-if="classesReq.loading.value" class="text-xs font-bold text-[#9CA3AF]">班级加载中...</div>
        <div v-else class="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
          <label
            v-for="item in classes"
            :key="item.class_id"
            class="flex items-center gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2 cursor-pointer hover:border-[#58CC02]"
          >
            <input
              v-model="selectedClassIds"
              type="checkbox"
              :value="item.class_id"
              class="accent-[#356B00]"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-black text-[#1F2937]">{{ item.class_name }}</span>
              <span class="block text-xs font-bold text-[#9CA3AF]">{{ item.student_count }}名学生 · {{ item.task_count }}个任务</span>
            </span>
          </label>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#F2F5E8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#356B00" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div>
            <p class="text-sm font-black text-[#1F2937]">已选 {{ selectedClassIds.length }} 个班级</p>
            <p class="text-xs font-bold text-[#9CA3AF]">{{ selectedStudentCount }}名学生</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4">
        <h3 class="text-sm font-black text-[#1F2937]">{{ modeText.overviewTitle }}</h3>
        <div v-if="segmentedSentences.length === 0" class="text-center py-4">
          <p class="text-xs font-bold text-[#9CA3AF]">{{ modeText.overviewEmpty }}</p>
        </div>
        <div v-else class="flex flex-col gap-4">
          <div
            v-for="(sentence, idx) in segmentedSentences"
            :key="idx"
            class="flex items-start gap-2"
          >
            <span class="text-xs font-black text-[#356B00] bg-[#F2F5E8] rounded-full w-5 h-5 flex items-center justify-center shrink-0">{{ idx + 1 }}</span>
            <p class="text-xs text-[#64748B] leading-relaxed line-clamp-2">{{ sentence }}</p>
          </div>
        </div>
        <div v-if="segmentedSentences.length > 0" class="bg-[rgba(53,107,0,0.05)] rounded-xl border border-[rgba(53,107,0,0.1)] p-4 text-xs font-bold text-[#356B00]">
          {{ segmentedSentences.length }} 个{{ modeText.unit }} · {{ taskType === 'homework' ? '作业任务' : '练习任务' }}
        </div>
      </div>

      <button
        type="button"
        class="w-full bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] py-4 text-center text-sm font-bold text-[#334155] hover:bg-[#F8FAFC] transition-colors disabled:text-[#CBD5E1] disabled:hover:bg-white"
        @click="onSaveAsTemplate"
        :disabled="templateReq.loading.value"
      >
        {{ templateReq.loading.value ? '保存中...' : '保存为模板' }}
      </button>

      <button
        type="button"
        class="w-full bg-[#356B00] rounded-xl shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)] py-4 text-center text-sm font-bold text-white hover:bg-[#2E5E00] transition-colors"
        @click="onPublish"
        :disabled="saveReq.loading.value || classesReq.loading.value"
      >
        {{ saveReq.loading.value ? '发布中...' : '保存并发布' }}
      </button>
    </div>

    <div
      v-if="segmentEditorOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      @click.self="cancelSegmentDraft"
    >
      <div class="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white shadow-[0px_24px_70px_rgba(15,23,42,0.24)] flex flex-col">
        <div class="px-6 pt-6 pb-4 border-b border-[#F1F5F9] flex flex-col gap-1">
          <h3 class="text-base font-black text-[#1F2937]">确认{{ modeText.segmentTitle }}</h3>
          <p class="text-xs font-bold text-[#9CA3AF]">请核对自动切分结果，可直接修改、删除或补充后再发布</p>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          <div
            v-for="(item, idx) in segmentDraft"
            :key="idx"
            class="flex items-center gap-2"
          >
            <span class="text-xs font-black text-[#9CA3AF] w-8 shrink-0">#{{ idx + 1 }}</span>
            <input
              v-model="segmentDraft[idx]"
              type="text"
              class="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
            />
            <button
              type="button"
              class="w-9 h-9 shrink-0 rounded-lg border border-[#E2E8F0] text-[#BA1A1A] font-black hover:bg-[#FEF2F2] transition-colors"
              @click="removeSegmentDraft(idx)"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            class="mt-1 self-start px-3 py-2 rounded-lg border border-dashed border-[#D7E5C8] text-xs font-black text-[#356B00] hover:bg-[#F2F5E8] transition-colors"
            @click="addSegmentDraft"
          >
            ＋ 添加一条
          </button>
        </div>
        <div class="px-6 py-4 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
          <span class="text-xs font-bold text-[#9CA3AF]">共 {{ segmentDraft.length }} 个{{ modeText.unit }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-black text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              @click="cancelSegmentDraft"
            >
              取消
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-[#356B00] text-xs font-black text-white hover:bg-[#2E5E00] transition-colors"
              @click="confirmSegmentDraft"
            >
              确认并应用
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
