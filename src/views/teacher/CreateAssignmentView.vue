<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTeacherClasses, getTeacherTemplates, publishTeacherTask, saveTeacherTemplate, segmentTeacherContent, type TaskMode, type TeacherClassItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const classesReq = useAsync<TeacherClassItem[]>()
const saveReq = useAsync<{ success: boolean }>()
const templateReq = useAsync<{ success: boolean }>()

/** 任务标题：给学生看的标题，同一个模板每次布置可单独设置 */
const title = ref('')
/** 模板标题：保存/新建校本练习时仅教师可见的标题 */
const templateTitle = ref('')
const contentText = ref('')
/** 留空表示不限次数（提交 null 给后端） */
const maxSubmissions = ref<number | null>(3)
const selectedMode = ref<TaskMode>('sentence')
const taskType = ref<'homework' | 'practice'>('homework')
const segmentedSentences = ref<string[]>([])
const segmentDraft = ref<string[]>([])
/** 确认弹窗中当前选中的行索引，用于在选中行下方插入新行 */
const selectedSegmentIndex = ref<number | null>(null)
const classes = ref<TeacherClassItem[]>([])
const selectedClassIds = ref<string[]>([])
const notes = ref('')
/** 保存为校本练习时的可见范围：1 同校公开 / 2 仅自己可复用 / 0 不复用 */
const templatePublic = ref<number | null>(null)
/** 内容经「确认分句」弹窗确认后才为 true，避免未确认就直接保存 */
const segmentsConfirmed = ref(false)
/** 从校本练习布置进来时记录来源模板 id（用于复用模板、避免重复保存） */
const sourceTemplateId = ref<string | null>(null)
/** 来源模板的标题+句子指纹，用于判断内容是否被修改 */
const sourceTemplateSignature = ref<string | null>(null)
const DEFAULT_DURATION_MS = 7 * 24 * 60 * 60 * 1000
/** 练习任务后端仍要求非空的开放时间，用远期时间表示「不设截止」 */
const PRACTICE_UNTIL_ISO = new Date('2099-12-31T23:59:00').toISOString()
type TimeField = 'from' | 'until'
type CalendarPanel = 'date' | 'year' | 'month'

const currentPage = ref(1);
const editing = ref(false);

const toDateTimeInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const availableFrom = ref('')
const availableUntil = ref('')
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

const modes: Array<{ id: TaskMode; label: string; desc: string; disabled?: boolean }> = [
  { id: 'sentence', label: '句子模式', desc: '正常评测，逐句练习发音' },
  { id: 'word', label: '单词模式', desc: '仅评测音准，逐个单词纠音', disabled: true },
  { id: 'pair', label: '词对模式', desc: '对照练习，含相同音素的单词成对练', disabled: true },
]

/** 暂未开放的模式统一悬停提示 */
const MODE_DISABLED_HINT = '该功能开发中，敬请期待'

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

const input = useTemplateRef<HTMLInputElement[]>('segmentDraftref')

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
/** 记录当前 segmentedSentences 对应的原文，用于判断切分结果是否已与内容同步 */
const segmentedText = ref('')

const onSegment = () => {
  const text = contentText.value.trim()
  if (!text) return
  segmentsConfirmed.value = false
  // 失焦时只静默切分，不弹确认窗；确认窗仅在保存/发布时由 ensureSegmentsConfirmed 打开
  void segment()
}

/** 用新结果覆盖分句；仅在结果变化时保留草稿，避免每次失焦都覆盖 */
const applySegments = (next: string[]) => {
  const changed = next.join('\n') !== segmentedSentences.value.join('\n') || next.join('\n') !== segmentDraft.value.join('\n')
  segmentedSentences.value = next
  if (changed) segmentsConfirmed.value = false
  if (changed && next.length) {
    segmentDraft.value = [...next]
    selectedSegmentIndex.value = null
  }
}

/** 把「确认分句」页的编辑结果回写到提交用数组，避免发布/保存时仍提交自动分句结果 */
const commitSegmentDraft = () => {
  if (!segmentDraft.value.length) return
  segmentedSentences.value = segmentDraft.value.map((item) => item.trim())
}

const addSegmentDraft = () => {
  segmentDraft.value.push('')
  const index = segmentDraft.value.length - 1
  selectedSegmentIndex.value = index
  setTimeout(() => {
    input.value?.[index]?.focus()
  }, 10)
}

/** 在选中的一行下方插入空白行，并选中新行 */
const insertSegmentDraftBelow = (index: number) => {
  segmentDraft.value.splice(index + 1, 0, '')
  selectedSegmentIndex.value = index + 1
  input.value?.[index + 1]?.focus()
}

const removeSegmentDraft = (index: number) => {
  segmentDraft.value.splice(index, 1)
  if (selectedSegmentIndex.value === null) return
  if (selectedSegmentIndex.value === index) selectedSegmentIndex.value = null
  else if (selectedSegmentIndex.value > index) selectedSegmentIndex.value -= 1
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
/** 已选定的开始/截止日期范围（仅比较到「日」），用于日历高亮区间底色 */
const selectedRange = computed(() => {
  const from = parseDateTimeInput(availableFrom.value)
  const until = parseDateTimeInput(availableUntil.value)
  if (!from || !until) return null
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const end = new Date(until.getFullYear(), until.getMonth(), until.getDate()).getTime()
  return start <= end ? { start, end } : null
})
const calendarDays = computed(() => {
  const firstDay = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth(), 1)
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const dayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const range = selectedRange.value
    return {
      key: toDateTimeInput(date).slice(0, 10),
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === calendarMonth.value.getMonth(),
      isToday: isSameDate(date, new Date()),
      isSelected: activeDateTime.value ? isSameDate(date, activeDateTime.value) : false,
      inRange: !!range && dayTime >= range.start && dayTime <= range.end,
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
  if (!availableFrom.value && !availableUntil.value) return '未设置，视为不限时间'
  if (!availableFrom.value) return '未设置开始时间，视为立即开放'
  if (!availableUntil.value) return '未设置截止时间，视为不限时间'
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
  if (!date) return '不限（点击设置）'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** 清空某个时间字段，回到「不限」状态 */
const clearTimeField = (field: TimeField) => {
  if (field === 'from') availableFrom.value = ''
  else availableUntil.value = ''
  if (activeTimeField.value === field) activeTimeField.value = null
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
  const currentFrom = parseDateTimeInput(availableFrom.value)
  const currentUntil = parseDateTimeInput(availableUntil.value)
  const duration = currentFrom && currentUntil && currentUntil.getTime() > currentFrom.getTime()
    ? currentUntil.getTime() - currentFrom.getTime()
    : DEFAULT_DURATION_MS
  availableFrom.value = toDateTimeInput(now)
  // 截止时间未设置表示「不限」，保持留空，不因点「现在」而被自动填上
  if (currentUntil) availableUntil.value = toDateTimeInput(new Date(now.getTime() + duration))
}

const toIso = (value: string) => {
  if (!value) return null
  return new Date(value).toISOString()
}

const segment = async () => {
  const text = contentText.value.trim()
  if (!text) {
    segmentedSentences.value = []
    segmentSource.value = ''
    segmentedText.value = ''
    return
  }
  segmentSource.value = text
  let next: string[]
  if (selectedMode.value === 'word') next = splitWords(text)
  else if (selectedMode.value === 'pair') next = splitPairs(text)
  else next = await segmentByBackend(text)
  applySegments(next)
  // 只有切分结果真正落地后才标记已同步，避免内容刚改动就用旧结果发布
  segmentedText.value = text
}

const onModeSelect = (mode: TaskMode) => {
  // 单词/词对模式暂未开放，点击不生效（悬停提示见模板）
  if (modes.some((item) => item.id === mode && item.disabled)) return
  if (selectedMode.value === mode) return
  selectedMode.value = mode
  // 换模式会改变切分口径，需重新确认分句
  segmentsConfirmed.value = false
  if (contentText.value.trim()) void segment()
}

const publish = async () => {
  if (!selectedClassIds.value.length) {
    toast.push('请至少选择一个班级', 'warning')
    return
  }
  if (!title.value.trim()) {
    toast.push('请输入任务标题', 'warning')
    return
  }
  await doPublish()
}

/** 当前编辑态的模板指纹（模板标题 + 分句），用于判断相对来源模板是否被修改 */
const currentTemplateSignature = computed(() => JSON.stringify([
  templateTitle.value.trim(),
  segmentDraft.value,
]))

/** 从校本练习进入且未做任何修改 */
const isTemplateUnchanged = computed(() =>
  !!sourceTemplateId.value
  && sourceTemplateSignature.value !== null
  && currentTemplateSignature.value === sourceTemplateSignature.value,
)

const doPublish = async () => {
  const isPractice = taskType.value === 'practice'
  const nowIso = new Date().toISOString()
  // 练习任务不设截止时间与尝试次数；后端开放时间字段非空：
  // 未设置开始时间按「立即开放」、未设置截止时间按远期时间表示「不限」
  const from = isPractice ? nowIso : (toIso(availableFrom.value) ?? nowIso)
  const until = isPractice ? PRACTICE_UNTIL_ISO : (toIso(availableUntil.value) ?? PRACTICE_UNTIL_ISO)
  if (new Date(from).getTime() >= new Date(until).getTime()) {
    toast.push('截止时间需要晚于开始时间', 'warning')
    return
  }
  // 从模板进入且内容未改：复用原模板，避免每次布置都新建一个一模一样的模板
  const reuseTemplateId = sourceTemplateId.value && isTemplateUnchanged.value ? sourceTemplateId.value : null
  // 以确认页的最终分句为准提交
  commitSegmentDraft()

  try {
    await saveReq.run(() => publishTeacherTask({
      classIds: selectedClassIds.value,
      title: title.value.trim(),
      segments: segmentedSentences.value,
      notes: notes.value.trim() || null,
      mode: selectedMode.value,
      taskType: taskType.value,
      maxAttempt: isPractice ? null : maxSubmissions.value,
      availableFrom: from,
      availableUntil: until,
      templateId: reuseTemplateId,
      templateTitle: templateTitle.value.trim() || title.value.trim(),
    }))
    toast.push('任务已发布', 'success')
    await router.push('/teacher/content')
  } catch {
    toast.push(saveReq.error.value ?? '发布失败，请稍后重试', 'error')
  }
}

const saveAsTemplate = async () => {
  await doSaveTemplate()
}

const doSaveTemplate = async () => {
  const templateName = templateTitle.value.trim() || title.value.trim()
  if (!templateName) {
    toast.push('请输入练习标题', 'warning')
    return
  }
  for (let i = 0; i < segmentDraft.value.length; i += 1) {
    if (segmentDraft.value[i] === '') {
      toast.push('任意一行不得为空', 'warning');
      return;
    }
  }
  if (editing.value && isTemplateUnchanged.value) {
    toast.push('该内容与原内容相同，无法保存', 'warning');
    return;
  }
  // 以确认页的最终分句为准保存
  commitSegmentDraft()
  try {
    await templateReq.run(() => saveTeacherTemplate({
      title: templateName,
      segments: segmentedSentences.value,
      // 可见范围：0 不复用 / 1 同校公开 / 2 仅自己可复用，直接下发整型
      isPublic: templatePublic.value ?? 0,
    }))
    toast.push(
      templatePublic.value === 1
        ? '已保存为校本练习（同校公开）'
        : templatePublic.value === 2
          ? '已保存为校本练习（仅自己可复用）'
          : '已保存为校本练习（不复用）',
      'success',
    )
    await router.push('/teacher/templates')
  } catch {
    toast.push(templateReq.error.value ?? '保存校本练习失败，请稍后重试', 'error')
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

/** 从「校本共建」点布置跳转过来时，按 query.templateId 带入对应练习内容 */
const loadTemplateFromQuery = async () => {
  const templateId = route.query.templateId
  if (typeof templateId !== 'string' || !templateId) return
  try {
    const { data } = await getTeacherTemplates()
    const template = data.find((item) => item.template_id === templateId)
    if (!template) {
      toast.push('未找到对应的校本练习', 'warning')
      return
    }
    title.value = template.title
    templateTitle.value = template.title
    contentText.value = template.segments.join('\n')
    segmentedSentences.value = [...template.segments]
    segmentDraft.value = [...template.segments]
    // 模板带入的内容视为已确认，避免点保存时又弹一次确认窗口
    segmentsConfirmed.value = true
    // 记录来源模板，未修改内容时复用该模板、禁止重复保存为校本练习
    sourceTemplateId.value = template.template_id
    sourceTemplateSignature.value = JSON.stringify([template.title.trim(), template.segments])
    // 同步切分来源，避免内容区失焦时重新切分覆盖带入的结果
    segmentSource.value = contentText.value.trim()
    segmentedText.value = contentText.value.trim()
    currentPage.value = 0;
  } catch {
    toast.push('校本练习内容加载失败，请稍后重试', 'error')
  }
}

const editContent = () => {
  currentPage.value = 1;
  editing.value = true;
}

const nextPage = () => {
  if (currentPage.value == 0) {
    if (!editing.value) {
      currentPage.value = 3;
      return;
    }
  }
  if (currentPage.value == 1) {
    if (!contentText.value || !templateTitle.value) {
      toast.push('请输入练习内容', 'warning');
      return;
    }
    if (templatePublic.value == null) {
      toast.push('请选择可见范围', 'warning');
      return;
    }
    if (contentText.value.trim() !== segmentedText.value) {
      onSegment();
    }
  }
  if (currentPage.value == 2) {
    const cleaned = segmentDraft.value.map((item) => item.trim()).filter(Boolean)
    if (!cleaned.length) {
      toast.push('请至少保留一条内容', 'warning')
      return
    }
    for (let i = 0; i < segmentDraft.value.length; i += 1) {
      if (segmentDraft.value[i] === '') {
        toast.push('任意一行不得为空', 'warning');
        return;
      }
    }
    if (editing.value && isTemplateUnchanged.value) {
      toast.push('该内容与原内容相同，系统将忽略本次编辑', 'warning')
      editing.value = false;
    }
    // 校验通过后，以确认页中的最终分句作为后续提交结果
    commitSegmentDraft()
    segmentsConfirmed.value = true
  }
  currentPage.value += 1;
}

const prevPage = () => {
  if (currentPage.value == 3) {
    if (sourceTemplateId.value && isTemplateUnchanged.value && !editing.value) {
      currentPage.value = 0;
      return;
    }
  }
  currentPage.value -= 1;
}

const exitEdit = () => {
  editing.value = false;
  currentPage.value = 0;
}

const onInputBlur = (idx: number) => {
  setTimeout(() => {
    if (selectedSegmentIndex.value == idx)
      setTimeout(() => {
        selectedSegmentIndex.value = null;
      }, 10);
  }, 200);
}

onMounted(() => {
  void load()
  void loadTemplateFromQuery()
})
</script>

<template>
  <div class="p-8 flex gap-6">
    <div class="flex-1 flex flex-col gap-6">
      <div class="flex flex-col gap-6">
        <div v-if="currentPage == 3" class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-black text-[#1F2937]">任务基础信息</h3>
            <div class="flex flex-col gap-2">
              <span class="text-xs font-black text-[#64748B]">任务标题（学生看到）</span>
              <input
                v-model="title"
                type="text"
                placeholder="任务标题"
                class="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02]"
              />
            </div>
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

        <div v-if="currentPage == 1" class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-2">
		    <span class="text-xs font-black text-[#64748B]">练习标题（教师看到）</span>
		    <input
		  	  v-model="templateTitle"
			  type="text"
			  placeholder="练习标题，留空则用任务标题"
			  class="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02]"
		    />
		  </div>
		  <div class="flex flex-col gap-2">
		    <span class="text-xs font-black text-[#64748B]">校本练习可见范围</span>
		    <div class="flex items-center gap-2">
			  <button
			    type="button"
			    :class="[
				  'px-3 py-2 rounded-lg border text-xs font-black transition-colors',
				  templatePublic == 1
				    ? 'bg-[#356B00] border-[#356B00] text-white'
				    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#58CC02]',
			    ]"
			    @click="templatePublic = 1"
			  >
			    同校公开
			  </button>
			  <button
			    type="button"
			    :class="[
				  'px-3 py-2 rounded-lg border text-xs font-black transition-colors',
				  templatePublic == 2
				    ? 'bg-[#356B00] border-[#356B00] text-white'
				    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#58CC02]',
			    ]"
			    @click="templatePublic = 2"
			  >
			    仅自己可复用
			  </button>
			  <button
			    type="button"
			    :class="[
				  'px-3 py-2 rounded-lg border text-xs font-black transition-colors',
				  templatePublic == 0
				    ? 'bg-[#356B00] border-[#356B00] text-white'
				    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#58CC02]',
			    ]"
			    @click="templatePublic = 0"
			  >
			    不复用
			  </button>
		    </div>
		  </div>
		  <div class="grid grid-cols-3 gap-3">
		    <div
              v-for="mode in modes"
              :key="mode.id"
              class="relative group"
            >
              <div
                :class="[
                  'h-full bg-white rounded-xl p-6 flex flex-col gap-2 transition-colors border shadow-[0px_4px_20px_rgba(0,0,0,0.04)]',
                  mode.disabled
                    ? 'cursor-not-allowed bg-[#F8FAFC] opacity-60 border-[#F1F5F9]'
                    : selectedMode === mode.id
                      ? 'cursor-pointer border-[#356B00] border-2'
                      : 'cursor-pointer border-[#F1F5F9] hover:border-[#58CC02]/20',
                ]"
                @click="onModeSelect(mode.id)"
              >
                <h3
                  class="text-sm font-black"
                  :class="mode.disabled ? 'text-[#9CA3AF]' : 'text-[#1F2937]'"
                >
                  {{ mode.label }}
                </h3>
                <p class="text-xs font-bold" :class="mode.disabled ? 'text-[#CBD5E1]' : 'text-[#9CA3AF]'">{{ mode.desc }}</p>
                <span
                  v-if="mode.disabled"
                  class="w-fit px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[10px] font-black text-[#6B7280]"
                >
                  开发中
                </span>
              </div>
              <span
                v-if="mode.disabled"
                class="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-30 w-max max-w-[220px] rounded-lg bg-[#1F2937] px-3 py-2 text-xs font-bold leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              >
                {{ MODE_DISABLED_HINT }}
              </span>
            </div>
          </div>
		  <div class="flex items-center gap-3">
            <span class="text-sm font-black text-[#1F2937]">内容文本</span>
            <span class="text-xs font-bold text-[#9CA3AF]">{{ modeText.contentHint }}</span>
          </div>
          <textarea
            v-model="contentText"
            class="w-full h-44 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
            :placeholder="modeText.contentPlaceholder"
          />
        </div>

		<div v-if="currentPage == 0" class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-2">
		    <span class="text-xs font-black text-[#64748B]">练习标题（教师看到）</span>
		    <span class="text-xs font-black text-[#64748B]">{{ templateTitle }}</span>
		  </div>
		  <div class="flex items-center gap-3">
            <span class="text-sm font-black text-[#1F2937]">内容文本</span>
          </div>
          <template v-for="(_segment, idx) in segmentedSentences" :key="idx">
			<div
			  class="flex items-center gap-2 rounded-lg transition-colors"
			>
			  <span class="text-xs font-black text-[#9CA3AF] w-8 shrink-0 pl-1">#{{ idx + 1 }}</span>
			  <div
				class="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
			  >
			    {{segmentedSentences[idx]}}
			  </div>
			</div>
		  </template>
        </div>

		<div v-if="currentPage == 3" class="flex justify-between gap-6">

			<div class="flex-grow-1 bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
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
				<div class="me-auto truncate text-sm font-black text-[#1F2937]">{{ item.class_name }}</div>
				<div class="flex text-xs font-bold text-[#9CA3AF]">{{ item.student_count }}名学生 · {{ item.task_count }}个任务</div>
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

			<div class="flex-grow-1 bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
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
						<span class="flex items-center gap-1.5">
						  <button
							v-if="field.id === 'from'"
							type="button"
							class="px-2.5 py-1 rounded-md bg-white border border-[#D7E5C8] text-xs font-black text-[#356B00] hover:bg-[#F2F5E8] transition-colors"
							@click="setAvailableFromNow"
						  >
							现在
						  </button>
						  <button
							v-if="getTimeValue(field.id)"
							type="button"
							class="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] text-xs font-black text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
							@click="clearTimeField(field.id)"
						  >
							清空
						  </button>
						</span>
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
									  : day.inRange
										? 'bg-[#E6F4D8] text-[#356B00]'
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
						  <div class="flex items-center gap-1">
							<button
							  type="button"
							  class="px-3 py-2 rounded-lg text-xs font-black text-[#356B00] hover:bg-[#F2F5E8]"
							  @click="useTodayForActiveField"
							>
							  今天
							</button>
							<button
							  v-if="activeTimeField && getTimeValue(activeTimeField)"
							  type="button"
							  class="px-3 py-2 rounded-lg text-xs font-black text-[#64748B] hover:bg-[#F8FAFC]"
							  @click="clearTimeField(activeTimeField)"
							>
							  清空
							</button>
						  </div>
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
		
		<div
		  v-if="currentPage == 2"
		  class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6"
		>
			<div class="px-6 pt-6 pb-4 border-b border-[#F1F5F9] flex flex-col gap-1">
			  <h3 class="text-base font-black text-[#1F2937]">确认{{ modeText.segmentTitle }}</h3>
			  <p class="text-xs font-bold text-[#9CA3AF]">请核对自动切分结果，可直接修改、删除或补充后再发布</p>
			</div>
			<div class="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
			  <div v-for="(_segment, idx) in segmentDraft" :key="idx" style="position: relative">
				<div
				  class="flex items-center gap-2 rounded-lg transition-colors"
				>
				  <span class="text-xs font-black text-[#9CA3AF] w-8 shrink-0 pl-1">#{{ idx + 1 }}</span>
				  <input
				    ref="segmentDraftref"
					v-model="segmentDraft[idx]"
					type="text"
					class="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] outline-none hover:border-[#58CC02]"
					:class="selectedSegmentIndex === idx ? 'bg-[#F2F8E8] ring-2 ring-[#58CC02]' : ''"
				    @click="selectedSegmentIndex = idx"
					@blur="onInputBlur(idx)"
				  />
				  <button
					type="button"
					class="w-9 h-9 shrink-0 rounded-lg border border-[#E2E8F0] text-[#BA1A1A] font-black hover:bg-[#FEF2F2] transition-colors"
					@click.stop="removeSegmentDraft(idx)"
				  >
					×
				  </button>
				</div>
				<button
				  v-if="idx < segmentDraft.length - 1 && selectedSegmentIndex == idx"
				  class="self-start ml-3.5 px-1.5 py-1 rounded-lg border border-dashed border-[#D7E5C8] text-xs font-black text-[#356B00] hover:bg-[#F2F5E8] transition-colors"
				  style="position: absolute; z-index: 10; top: 80%"
				  @click="insertSegmentDraftBelow(idx)"
				>
				  +
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
			</div>
		</div>
		<div class="flex justify-end gap-2">
		  <button
				  v-if="currentPage > 1"
				  type="button"
				  class="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-black text-[#64748B] hover:border-[#58CC02] transition-colors"
				  @click="prevPage"
				>
				上一页
		  </button>
		  <button
				  v-if="currentPage == 0 && sourceTemplateId"
				  type="button"
				  class="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-black text-[#64748B] hover:border-[#58CC02] transition-colors"
				  @click="editContent"
				>
				编辑该内容
		  </button>
		  <button
				  v-if="(currentPage == 1 || currentPage == 2) && editing"
				  type="button"
				  class="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-black text-[#64748B] hover:border-[#58CC02] transition-colors"
				  @click="exitEdit"
				>
				退出编辑
		  </button>
		  <button
				  v-if="currentPage == 2 && templatePublic != 0"
				  type="button"
				  class="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-black text-[#64748B] hover:border-[#58CC02] transition-colors"
				  @click="onSaveAsTemplate"
				  :disabled="templateReq.loading.value"
				>
				{{ templateReq.loading.value ? '保存中...' : '仅保存为校本共建' }}
		  </button>
		  <button
				  v-if="currentPage < 3"
				  type="button"
				  class="px-4 py-2 rounded-lg bg-[#356B00] text-xs font-black text-white hover:bg-[#2E5E00] transition-colors"
				  @click="nextPage"
				>
				下一页
		  </button>
		  <button
				  v-if="currentPage == 3"
				  type="button"
				  class="px-4 py-2 rounded-lg bg-[#356B00] text-xs font-black text-white hover:bg-[#2E5E00] transition-colors"
				  @click="onPublish"
				  :disabled="saveReq.loading.value"
				>
				{{ saveReq.loading.value ? '发布中...' : '保存并发布' }}
		  </button>
		</div>
      </div>
    </div>
    
  </div>
</template>
