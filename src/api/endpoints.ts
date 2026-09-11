import { request, requestBlob } from './http'
import { ApiError } from './errors'
import type { StudentTaskApiStatus } from '../utils/studentTaskAvailability'

export type LoginForm = {
  institute: string
  school_seq: string
  user_type: 'Student' | 'Teacher' | 'Admin'
  stu_id: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  must_change_password: boolean
  user: {
    user_id: string
    user_type: string
  }
}

export async function login(form: LoginForm) {
  return request<LoginResponse>('auth/login', { method: 'POST', body: form })
}

export async function logout() {
  return request<unknown>('auth/logout', { method: 'POST' })
}

export type EditPasswordPayload = {
  oldPassword?: string
  password: string
}

export type EditPasswordResponse = {
  ok: boolean
  access_token: string
  token_type: string
  must_change_password: boolean
}

export async function editUserPassword(payload: EditPasswordPayload) {
  const body: { old_password?: string; password: string } = {
    password: payload.password,
  }
  if (payload.oldPassword !== undefined) body.old_password = payload.oldPassword

  return request<EditPasswordResponse>('auth/users/edit_password', {
    method: 'PUT',
    body,
  })
}

export type InstituteItem = {
  school_seq?: string
  school_id: string
  school_name: string
}

export type InstituteListData = {
  page?: number
  per_page?: number
  total?: number
  cnt?: number
  items: InstituteItem[]
}

export type InstituteResponse = {
  ok: boolean
  data: InstituteListData
}

export async function getInstitutes() {
  return request<InstituteResponse>('auth/institute/all', { method: 'GET' })
}

export async function searchInstitutes(keyWord: string) {
  return request<InstituteResponse>('auth/institute/search', {
    method: 'GET',
    query: { key_word: keyWord },
  })
}

export type StudentClassContext = {
  class_id: string
  class_name: string
  teacher_name: string | string[]
  language?: string
}

export type StudentBasicInformationResponse = {
  class_cnt: number
  info: StudentClassContext[]
}

export async function getStudentBasicInformation() {
  return request<StudentBasicInformationResponse>('student/basic_information', { method: 'GET' })
}

export type StudentTaskItem = {
  task_id: string
  class_id: string
  task_type: 'practice' | 'homework'
  /** 后端权威任务状态；列表接口不返回 available_from / available_until，状态判断以本字段为准 */
  task_status?: StudentTaskApiStatus
  title: string
  segmented_sentences: string[]
  max_submission: number
  target_phonemes: string[] | string | null
  created_at: string
  updated_at: string
  available_from?: string | null
  available_until?: string | null
  avg_score: number
  is_active: boolean
  attempt_count?: number
}

export async function getStudentTasks(classId?: string | null) {
  return request<{ ok: boolean; data: StudentTaskItem[] }>('student/tasks', {
    method: 'GET',
    query: { class_id: classId },
  })
}

/**
 * 练习模式：
 * - sentence 句子模式：正常评测
 * - word     单词模式：仅评测音准
 * - pair     词对模式：对照练习含相同音素的单词
 *
 * 后端 tasks / task_templates 表没有 mode 字段，教师端保存时的额外字段会被
 * 直接丢弃，因此模式借道任务备注 notes，以 `[[mode:word]]` 前缀透传给前端。
 */
export type TaskMode = 'sentence' | 'word' | 'pair'

const TASK_MODE_PREFIX = /^\s*\[\[mode:(sentence|word|pair)\]\]\s*/

export function encodeTaskNotes(notes: string | null | undefined, mode: TaskMode = 'sentence') {
  const clean = (notes ?? '').trim().replace(TASK_MODE_PREFIX, '').trim()
  if (mode === 'sentence') return clean || null
  return `[[mode:${mode}]]${clean}`
}

export function decodeTaskNotes(raw: string | null | undefined): { mode: TaskMode; notes: string | null } {
  const value = raw ?? ''
  const matched = value.match(TASK_MODE_PREFIX)
  if (!matched) return { mode: 'sentence', notes: value.trim() || null }
  const rest = value.slice(matched[0].length).trim()
  return { mode: matched[1] as TaskMode, notes: rest || null }
}

export type StudentTaskDetail = {
  task_id: string
  course: Array<{
    class_id: string
    class_name: string
  }>
  task_type: 'practice' | 'homework'
  language_type: 'jp' | 'de' | 'fr' | 'sp' | 'ru' | string
  title: string
  segments: string[]
  notes: string | null
  mode?: TaskMode
  max_attempt: number | null
  target_phoneme: string[] | string | null
  is_active: boolean
  created_at: string
  updated_at: string
  available_from: string | null
  available_until: string | null
}

export async function getStudentTaskDetail(taskId: string | number) {
  const res = await request<{ ok: boolean; data: StudentTaskDetail }>('student/task_detail', {
    method: 'GET',
    query: { task_id: String(taskId) },
  })
  const detail = res?.data
  if (detail) {
    const { mode, notes } = decodeTaskNotes(detail.notes)
    detail.mode = mode
    detail.notes = notes
  }
  return res
}

export type StudentTaskRecordItem = {
  session_id: string
  title: string
  average_score: number
  teacher_score: number
  teacher_notes: string
  completed_at: string
  created_at: string
}

export async function getStudentTaskRecords(taskId: string | number) {
  return request<{ tasks: StudentTaskRecordItem[] }>('student/task', {
    method: 'GET',
    query: { task_id: String(taskId) },
  })
}

export type PhonemeScoreItem = {
  phoneme: string
  pronunciation: number
}

export type SyllableScoreItem = {
  syllable: string
  grapheme?: string
  pronunciation: number
}

export type WordScoreItem = {
  word: string
  pronunciation: number
  overall?: number | null
  error_type?: string
  phonemes?: PhonemeScoreItem[]
  syllables?: SyllableScoreItem[]
}

export type StudentSessionEvaluationItem = {
  eval_id: string
  audio_file_id?: string | null
  line_number: number
  sentence_text: string
  pronunciation: number
  rhythm: number
  fluency: number
  completeness: number
  total_score: number
  words: WordScoreItem[]
  teacher_notes: string
  created_at: string
}

export async function getStudentSessionDetails(sessionId: string) {
  return request<{ success: boolean; details: StudentSessionEvaluationItem[] }>('student/session', {
    method: 'GET',
    query: { session_id: sessionId },
  })
}

export type StudentArchiveStatistics = {
  total_entries: number
  main_page_entries: number
  aufgaben_entries: number
  average_score: number
  max_score: number
  latest_activity: string | null
}

export async function getStudentArchiveStatistics() {
  return request<{ success: boolean; statistics: StudentArchiveStatistics }>('student/archive/statistics', { method: 'GET' })
}

export async function getStudentHistoryWords() {
  return request<{ success: boolean; words: string[] }>('student/history/words', { method: 'GET' })
}

export type UserDetailClass = {
  class_id: string
  class_name: string
  grade_level: string
}

export type UserDetail = {
  user_id: number
  user_type: 'student' | 'teacher' | 'admin' | 'root' | string
  username: string
  school: {
    school_id: string
    school_name: string
  } | null
  is_active: boolean | null
  gender: boolean | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
  stu_id: string | null
  staff_id: string | null
  language: string | null
  classes: UserDetailClass[]
  is_root: boolean | null
}

export async function getUserDetail() {
  return request<{ ok: boolean; data: UserDetail }>('auth/users/user_detail', { method: 'GET' })
}

export type CreateStudentTestSessionResponse = {
  ok: boolean
  session_id: string
}

export async function createStudentTestSession(taskId?: string | number | null) {
  return request<CreateStudentTestSessionResponse>('student/pron-test/create_session', {
    method: 'POST',
    body: {
      source: taskId ? 'task' : 'main_page',
      task_id: taskId ?? undefined,
    },
  })
}

export type SubmitStudentTestSessionResponse = {
  ok: boolean
  session_id: string
  total_score: number
  evaluation_count: number
  average_score: number
}

export async function submitStudentTestSession(taskId?: string | number | null) {
  return request<SubmitStudentTestSessionResponse>('student/pron-test/submit_session', {
    method: 'POST',
    body: {
      source: taskId ? 'task' : 'main_page',
      task_id: taskId ?? undefined,
    },
  })
}

export type StudentPronTestAnalyzeResultScore = {
  total_score: number
  accuracy: number
  fluency: number
  completeness: number
  words?: WordScoreItem[]
}

export type StudentPronTestAnalyzeParams = {
  audio: File | Blob
  refText: string
  taskId?: string | number | null
  sentenceSeq?: number
  lang?: string
  core?: string
  source?: 'task' | 'main_page'
}

export async function analyzeStudentPronTest(params: StudentPronTestAnalyzeParams) {
  const fd = new FormData()
  fd.set('audio', params.audio)
  fd.set('ref_text', params.refText)
  fd.set('source', params.source ?? (params.taskId ? 'task' : 'main_page'))
  if (params.taskId !== undefined && params.taskId !== null && params.taskId !== '') {
    fd.set('task_id', String(params.taskId))
  }
  fd.set('sentence_seq', String(params.sentenceSeq ?? 0))
  fd.set('lang', params.lang ?? 'fr')
  fd.set('core', params.core ?? 'sent')
  return request<{
    ok: boolean
    lang: string
    core: string
    evaluation_id: string
    audio_file_id: string
    session_id: string
    task_id: string
    sentence_seq: number
    ref_text: string
    result_score: StudentPronTestAnalyzeResultScore
  }>('student/pron-test/analyze', { method: 'POST', body: fd, timeoutMs: 60_000 })
}

export type TeacherBasicInformation = {
  total_classes: number
  total_students: number
  total_tasks: number
}

export async function getTeacherBasicInformation() {
  return request<TeacherBasicInformation>('teacher/basic_information', { method: 'GET' })
}

export type TeacherClassItem = {
  class_id: string
  class_name: string
  description: string | null
  student_count: number
  task_count: number
  grade_level: string
  created_at?: string
}

export async function getTeacherClasses() {
  return request<TeacherClassItem[]>('teacher/classes', { method: 'GET' })
}

export type TeacherTaskItem = {
  task_id: string
  course: Array<{ class_id: string; class_name: string }>
  task_type: 'practice' | 'homework'
  title: string
  segments: string[]
  notes: string | null
  mode?: TaskMode
  max_attempt: number | null
  target_phoneme: string[] | null
  available_from: string | null
  available_until: string | null
}

export async function getTeacherTasks() {
  const rows = await request<TeacherTaskItem[]>('teacher/tasks', { method: 'GET' })
  if (!Array.isArray(rows)) return rows
  return rows.map((item) => {
    const { mode, notes } = decodeTaskNotes(item.notes)
    return { ...item, mode, notes }
  })
}

export type TeacherClassTaskSummary = {
  task_id: string
  title: string
  finished_students_count: number
  unfinished_students: Array<{
    user_id: number
    username: string
    stu_id?: string
  }>
}

export async function getTeacherClassTasks(classId: string) {
  return request<TeacherClassTaskSummary[]>('teacher/class/tasks', {
    method: 'POST',
    body: { class_id: classId },
  })
}

export type TeacherClassStudent = {
  user_id: number
  username: string
  evaluation_count: number
  last_evaluation: string | null
  average_score: number | null
}

export async function getTeacherClassStudents(classId: string) {
  return request<TeacherClassStudent[]>('teacher/class/students', {
    method: 'POST',
    body: { class_id: classId },
  })
}

export type TeacherScoreSummary = {
  overall: number | null
  pronunciation: number | null
  rhythm: number | null
  fluency: number | null
  integrity: number | null
  tone: number | null
}

export async function getTeacherStudentBasicInformation(userId: string | number, timeRange?: string | null) {
  return request<TeacherScoreSummary>('teacher/student/basic_information', {
    method: 'POST',
    body: { user_id: Number(userId), time_range: timeRange ?? null },
  })
}

export type TeacherStudentTaskRecord = {
  task_id: string
  title: string
  records_count: number
  records: Array<{
    session_id: string
    average_score: number | null
    completed_at: string | null
  }>
}

export async function getTeacherStudentRecords(userId: string | number, timeRange?: string | null) {
  return request<TeacherStudentTaskRecord[]>('teacher/student/records', {
    method: 'POST',
    body: { user_id: Number(userId), time_range: timeRange ?? null },
  })
}

export async function getTeacherTaskBasicInformation(classId: string, taskId: string | number, timeRange?: string | null) {
  return request<TeacherScoreSummary>('teacher/task/basic_information', {
    method: 'POST',
    body: { class_id: classId, task_id: String(taskId), time_range: timeRange ?? null },
  })
}

export type SegmentTeacherContentResponse = {
  segments: string[]
}

export async function segmentTeacherContent(contentText: string) {
  return request<SegmentTeacherContentResponse>('teacher/task/auto_segment', {
    method: 'POST',
    query: { text: contentText },
  })
}

export async function createTeacherContent(params: {
  classId: string
  title: string
  contentText: string
  taskType?: 'practice' | 'homework'
  maxSubmission?: number
  targetPhonemes?: string[]
  notes?: string | null
  availableFrom?: string | null
  availableUntil?: string | null
}) {
  const segmented = await segmentTeacherContent(params.contentText)
  const defaultUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  return request<{ success: boolean }>('teacher/task/save', {
    method: 'POST',
    body: {
      course: [params.classId],
      task_type: params.taskType ?? 'homework',
      title: params.title,
      segments: segmented.segments.length ? segmented.segments : [params.contentText],
      notes: params.notes ?? null,
      max_attempt: params.maxSubmission,
      target_phoneme: params.targetPhonemes?.length ? params.targetPhonemes : null,
      available_from: params.availableFrom ?? new Date().toISOString(),
      available_until: params.availableUntil ?? defaultUntil,
    },
  })
}

export async function publishTeacherTask(params: {
  classIds: string[]
  title: string
  segments: string[]
  notes?: string | null
  mode?: TaskMode
  taskType: 'practice' | 'homework'
  maxAttempt?: number | null
  targetPhoneme?: string[] | null
  availableFrom: string
  availableUntil: string
}) {
  return request<{ success: boolean }>('teacher/task/save', {
    method: 'POST',
    body: {
      task_id: null,
      course: params.classIds,
      task_type: params.taskType,
      title: params.title,
      segments: params.segments,
      notes: encodeTaskNotes(params.notes, params.mode),
      max_attempt: params.maxAttempt ?? null,
      target_phoneme: params.targetPhoneme?.length ? params.targetPhoneme : null,
      available_from: params.availableFrom,
      available_until: params.availableUntil,
    },
  })
}

/**
 * 保存为模板：不传 course / task_id，后端据此只创建 TaskTemplate（同校公开）。
 * 依据 service.py：task_template_id 为空 → 创建模板；course 为空 → 不创建 Task。
 */
export async function saveTeacherTemplate(params: {
  title: string
  segments: string[]
  targetPhoneme?: string[] | null
  isPublic?: boolean
}) {
  return request<{ success: boolean }>('teacher/task/save', {
    method: 'POST',
    body: {
      task_id: null,
      task_template_id: null,
      template_title: params.title,
      segments: params.segments,
      target_phoneme: params.targetPhoneme?.length ? params.targetPhoneme : null,
      is_public: params.isPublic ?? true,
    },
  })
}

export type UpdateTeacherTaskParams = {
  taskId: string | number
  title?: string
  notes?: string | null
  mode?: TaskMode
  maxAttempt?: number | null
  targetPhoneme?: string[] | null
  availableFrom?: string | null
  availableUntil?: string | null
}

export async function updateTeacherTask(params: UpdateTeacherTaskParams) {
  return request<{ success: boolean }>('teacher/task/save', {
    method: 'POST',
    body: {
      task_id: String(params.taskId),
      title: params.title,
      notes: params.notes === undefined ? undefined : encodeTaskNotes(params.notes, params.mode),
      max_attempt: params.maxAttempt,
      target_phoneme: params.targetPhoneme,
      available_from: params.availableFrom,
      available_until: params.availableUntil,
    },
  })
}

export async function deleteTeacherTask(taskId: string | number) {
  return request<{ success: boolean }>('teacher/task/delete', {
    method: 'POST',
    query: { task_id: String(taskId) },
  })
}

export type TeacherTaskRecordStudent = {
  user_id: number
  username: string
  records_count: number
  records: Array<{
    session_id: string
    average_score: number | null
    completed_at: string | null
  }>
}

export async function getTeacherTaskRecords(classId: string, taskId: string | number) {
  return request<TeacherTaskRecordStudent[]>('teacher/task/records', {
    method: 'POST',
    body: { class_id: classId, task_id: String(taskId) },
  })
}

export async function getTeacherSessionDetails(userId: string | number, sessionId: string) {
  return request<StudentSessionEvaluationItem[]>('teacher/get_session', {
    method: 'POST',
    query: { user_id: userId, session_id: sessionId },
  })
}

export async function getTeacherEvaluationAudio(evaluationId: string) {
  return requestBlob('teacher/evaluation/audio', {
    method: 'GET',
    query: { evaluation_id: evaluationId },
  })
}

export async function saveTeacherComments(comment: Record<string, { comment: string; evaluations: Record<string, string> }>) {
  return request<{ success: boolean }>('teacher/comment', {
    method: 'POST',
    body: { comment },
  })
}

export type TeacherDashboardResponse = TeacherBasicInformation & {
  class_details: Array<{
    class: TeacherClassItem
    student_count: number
    content_count: number
  }>
  total_content: number
}

export async function getTeacherDashboard(): Promise<TeacherDashboardResponse> {
  const [basic, classes] = await Promise.all([getTeacherBasicInformation(), getTeacherClasses()])
  return {
    ...basic,
    total_content: basic.total_tasks,
    class_details: classes.map((item) => ({
      class: item,
      student_count: item.student_count,
      content_count: item.task_count,
    })),
  }
}

export type TeacherContentItem = TeacherTaskItem
export type TeacherContentRecordsStudent = TeacherTaskRecordStudent

export async function getTeacherClassContents(classId: string) {
  const tasks = await getTeacherTasks()
  return tasks.filter((task) => task.course.some((course) => course.class_id === classId))
}

export async function validateTeacherContent(contentText: string) {
  const trimmed = contentText.trim()
  return {
    valid: !!trimmed,
    has_german_chars: false,
    word_count: trimmed ? trimmed.split(/\s+/).length : 0,
    sentence_count: trimmed ? trimmed.split(/[.!?。！？]+/).filter(Boolean).length : 0,
    character_count: trimmed.length,
    message: trimmed ? 'ok' : '内容不能为空',
  }
}

export async function getTeacherCustomContentRecords(taskId: string | number, classId: string) {
  return getTeacherTaskRecords(classId, taskId)
}

// ========================================
// 管理员端 — API 封装
// 说明：后端 /admin 仅提供基础 CRUD 路由（basic_information / teachers / classes /
// class/students / class/create / class/edit / class/students/add / teacher/add /
// teacher/assign / student/change_class / user/edit / user/unlink_class）。
// 本层负责把上述真实路由组合、并做字段映射，向上层视图暴露统一结构。
// ========================================

/** 后端语种枚举值 → 中文展示名 */
const LANGUAGE_LABEL_BY_CODE: Record<string, string> = {
  jp: '日语',
  de: '德语',
  fr: '法语',
  sp: '西班牙语',
  ru: '俄语',
}

/** 中文展示名 / 后端枚举值 → 后端语种枚举值 */
const LANGUAGE_CODE_BY_LABEL: Record<string, string> = {
  日语: 'jp',
  德语: 'de',
  法语: 'fr',
  西班牙语: 'sp',
  西语: 'sp',
  俄语: 'ru',
  jp: 'jp',
  de: 'de',
  fr: 'fr',
  sp: 'sp',
  ru: 'ru',
}

/** 后端语种枚举值 → 列表页角标展示码 */
const LANGUAGE_BADGE_BY_CODE: Record<string, string> = {
  jp: 'JP',
  de: 'DE',
  fr: 'FR',
  sp: 'ES',
  ru: 'RU',
}

/** 管理员端可支持的语种（后端 LanguageType） */
export const ADMIN_LANGUAGE_OPTIONS = ['日语', '德语', '法语', '西班牙语', '俄语']

/** 后端创建学生接口必填密码，前端批量导入未采集 → 使用统一初始密码 */
const DEFAULT_STUDENT_PASSWORD = 'demo123456'
/** 后端创建教师接口必填语种，前端表单未采集 → 使用默认语种 */
const DEFAULT_TEACHER_LANGUAGE = 'fr'

function languageLabel(code: string | null | undefined) {
  if (!code) return ''
  return LANGUAGE_LABEL_BY_CODE[code] ?? code
}

function languageCode(label: string | null | undefined) {
  if (!label) return ''
  return LANGUAGE_CODE_BY_LABEL[label] ?? ''
}

type BackendClass = {
  class_id: string
  class_name: string
  description: string | null
  teachers: Array<{ user_id: number; username: string }>
  language: string
  student_count: number
}

type BackendTeacher = {
  user_id: number
  username: string
  staff_id: string
  classes: Array<{ class_id: string; class_name: string }>
  language: string
}

type BackendStudent = {
  user_id: number
  username: string
  student_id: string
}

async function fetchAdminClasses(): Promise<BackendClass[]> {
  const data = await request<BackendClass[]>('admin/classes', { method: 'GET' })
  return Array.isArray(data) ? data : []
}

async function fetchAdminTeachers(): Promise<BackendTeacher[]> {
  const data = await request<BackendTeacher[]>('admin/teachers', { method: 'GET' })
  return Array.isArray(data) ? data : []
}

async function fetchAdminClassStudents(classId: string): Promise<BackendStudent[]> {
  const data = await request<BackendStudent[]>('admin/class/students', {
    method: 'POST',
    body: { class_id: classId },
  })
  return Array.isArray(data) ? data : []
}

function mapBackendClass(raw: BackendClass): AdminClassItem {
  const teacher = raw.teachers?.[0]
  return {
    class_id: raw.class_id,
    class_name: raw.class_name,
    language: languageLabel(raw.language),
    language_code: LANGUAGE_BADGE_BY_CODE[raw.language] ?? String(raw.language ?? '').toUpperCase(),
    student_count: raw.student_count ?? 0,
    teacher_id: teacher ? String(teacher.user_id) : null,
    teacher_name: teacher?.username ?? '',
    status: 'active',
    description: raw.description ?? null,
    start_date: null,
    capacity: null,
  }
}

export type AdminOverviewActivity = {
  activity_id: string
  title: string
  time: string
  type: 'config' | 'teacher' | 'student' | 'class' | 'system'
}

export type AdminOverviewData = {
  class_count: number
  teacher_count: number
  student_count: number
  pending_count: number
  activities: AdminOverviewActivity[]
}

export async function getAdminOverview() {
  const [classes, teachers] = await Promise.all([fetchAdminClasses(), fetchAdminTeachers()])
  const data: AdminOverviewData = {
    class_count: classes.length,
    teacher_count: teachers.length,
    student_count: classes.reduce((total, item) => total + (item.student_count ?? 0), 0),
    pending_count: 0,
    activities: [],
  }
  return { ok: true, data }
}

export type AdminClassStatus = 'active' | 'ended'

export type AdminClassItem = {
  class_id: string
  class_name: string
  language: string
  language_code: string
  student_count: number
  teacher_id: string | null
  teacher_name: string
  status: AdminClassStatus
  description?: string | null
  start_date?: string | null
  capacity?: number | null
}

export type AdminClassQuery = {
  keyword?: string
  language?: string
  status?: AdminClassStatus | ''
}

export async function getAdminClasses(query: AdminClassQuery = {}) {
  const raw = await fetchAdminClasses()
  const keyword = (query.keyword ?? '').trim().toLowerCase()
  const data = raw.map(mapBackendClass).filter((item) => {
    if (query.language && item.language !== query.language) return false
    if (query.status && item.status !== query.status) return false
    if (keyword && !item.class_name.toLowerCase().includes(keyword)) return false
    return true
  })
  return { ok: true, data }
}

export async function getAdminClassDetail(classId: string) {
  const raw = await fetchAdminClasses()
  const target = raw.find((item) => item.class_id === classId)
  if (!target) throw new ApiError('未找到对应班级', 404)
  return { ok: true, data: mapBackendClass(target) }
}

export type AdminClassSavePayload = {
  class_id?: string | null
  class_name: string
  language: string
  teacher_id?: string | null
  status?: AdminClassStatus
  description?: string | null
  start_date?: string | null
  capacity?: number | null
  students?: Array<{ stu_id: string; name: string }>
}

export async function saveAdminClass(payload: AdminClassSavePayload) {
  // 编辑班级：后端 edit_class 仅支持 class_name（其 description 分支存在缺陷，暂不提交）
  if (payload.class_id) {
    await request<{ success: boolean }>('admin/class/edit', {
      method: 'POST',
      body: { class_id: payload.class_id, class_name: payload.class_name },
    })
    if (payload.teacher_id) {
      await request<{ success: boolean }>('admin/teacher/assign', {
        method: 'POST',
        body: { user_id: Number(payload.teacher_id), classes_id: [payload.class_id] },
      })
    }
    return { ok: true, class_id: payload.class_id }
  }

  // 新建班级
  const created = await request<{ class_id: string; class_name: string }>('admin/class/create', {
    method: 'POST',
    body: {
      class_name: payload.class_name,
      grade_level: String(new Date().getFullYear()),
      description: payload.description ?? null,
      language_type: languageCode(payload.language) || DEFAULT_TEACHER_LANGUAGE,
    },
  })

  const classId = created?.class_id ?? ''

  // 批量导入学生
  if (classId && payload.students?.length) {
    await request<Array<{ user_id: number }>>('admin/class/students/add', {
      method: 'POST',
      body: {
        class_id: classId,
        students: payload.students.map((item) => ({
          username: item.name,
          password: DEFAULT_STUDENT_PASSWORD,
          student_staff_id: item.stu_id,
        })),
      },
    })
  }

  // 分配任课教师
  if (classId && payload.teacher_id) {
    await request<{ success: boolean }>('admin/teacher/assign', {
      method: 'POST',
      body: { user_id: Number(payload.teacher_id), classes_id: [classId] },
    })
  }

  return { ok: true, class_id: classId }
}

export type AdminStudentItem = {
  user_id: string
  name: string
  stu_id: string
  class_id?: string | null
  class_name?: string | null
  language?: string | null
}

export type AdminClassStudentsData = {
  class_id: string
  class_name: string
  language: string
  students: AdminStudentItem[]
}

export async function getAdminClassStudents(classId: string) {
  const [classes, students] = await Promise.all([fetchAdminClasses(), fetchAdminClassStudents(classId)])
  const target = classes.find((item) => item.class_id === classId)
  const className = target?.class_name ?? ''
  const language = languageLabel(target?.language)
  const data: AdminClassStudentsData = {
    class_id: classId,
    class_name: className,
    language,
    students: students.map((item) => ({
      user_id: String(item.user_id),
      name: item.username,
      stu_id: item.student_id,
      class_id: classId,
      class_name: className,
      language,
    })),
  }
  return { ok: true, data }
}

export type AdminStudentQuery = {
  keyword?: string
  class_id?: string
}

export async function getAdminStudents(query: AdminStudentQuery = {}) {
  const classes = await fetchAdminClasses()
  const targets = query.class_id ? classes.filter((item) => item.class_id === query.class_id) : classes

  const data: AdminStudentItem[] = []
  for (const cls of targets) {
    const students = await fetchAdminClassStudents(cls.class_id)
    for (const student of students) {
      data.push({
        user_id: String(student.user_id),
        name: student.username,
        stu_id: student.student_id,
        class_id: cls.class_id,
        class_name: cls.class_name,
        language: languageLabel(cls.language),
      })
    }
  }

  const keyword = (query.keyword ?? '').trim().toLowerCase()
  const filtered = keyword
    ? data.filter(
        (item) => item.name.toLowerCase().includes(keyword) || item.stu_id.toLowerCase().includes(keyword),
      )
    : data
  return { ok: true, data: filtered }
}

export async function getAdminStudentDetail(userId: string) {
  const { data } = await getAdminStudents()
  const target = data.find((item) => item.user_id === String(userId))
  if (!target) throw new ApiError('未找到该学生', 404)
  return { ok: true, data: target }
}

export type AdminStudentSavePayload = {
  user_id?: string | null
  class_id?: string | null
  name: string
  stu_id: string
  password?: string
}

export async function saveAdminStudent(payload: AdminStudentSavePayload) {
  // 编辑学生
  if (payload.user_id) {
    await request<{ success: boolean }>('admin/user/edit', {
      method: 'POST',
      body: {
        user_id: Number(payload.user_id),
        user_type: 'Student',
        username: payload.name,
        student_staff_id: payload.stu_id,
      },
    })
    return { ok: true, user_id: payload.user_id }
  }

  // 新增学生并加入班级
  if (!payload.class_id) throw new ApiError('缺少目标班级', 400)
  const created = await request<Array<{ user_id: number }>>('admin/class/students/add', {
    method: 'POST',
    body: {
      class_id: payload.class_id,
      students: [
        {
          username: payload.name,
          password: payload.password || DEFAULT_STUDENT_PASSWORD,
          student_staff_id: payload.stu_id,
        },
      ],
    },
  })
  return { ok: true, user_id: String(created?.[0]?.user_id ?? '') }
}

export type AdminStudentChangeClassPayload = {
  user_id: string
  target_class_id: string
  reason?: string
}

export async function changeAdminStudentClass(payload: AdminStudentChangeClassPayload) {
  const detail = await getAdminStudentDetail(payload.user_id)
  const oldClassId = detail.data.class_id ?? ''
  if (!oldClassId) throw new ApiError('未找到该学生当前所在班级', 400)

  await request<{ success: boolean }>('admin/student/change_class', {
    method: 'POST',
    body: {
      user_id: Number(payload.user_id),
      old_class_id: oldClassId,
      new_class_id: payload.target_class_id,
    },
  })
  return { ok: true }
}

export type AdminTeacherStatus = 'active' | 'inactive'

export type AdminTeacherItem = {
  teacher_id: string
  name: string
  staff_id: string
  subject: string
  class_count: number
  email: string
  status: AdminTeacherStatus
}

export type AdminTeacherQuery = {
  keyword?: string
  subject?: string
  status?: AdminTeacherStatus | ''
}

function mapBackendTeacher(raw: BackendTeacher): AdminTeacherItem {
  return {
    teacher_id: String(raw.user_id),
    name: raw.username,
    staff_id: raw.staff_id,
    subject: languageLabel(raw.language),
    class_count: raw.classes?.length ?? 0,
    email: '',
    status: 'active',
  }
}

export async function getAdminTeachers(query: AdminTeacherQuery = {}) {
  const raw = await fetchAdminTeachers()
  const keyword = (query.keyword ?? '').trim().toLowerCase()
  const data = raw.map(mapBackendTeacher).filter((item) => {
    if (query.subject && item.subject !== query.subject) return false
    if (query.status && item.status !== query.status) return false
    if (keyword && !item.name.toLowerCase().includes(keyword) && !item.staff_id.toLowerCase().includes(keyword)) {
      return false
    }
    return true
  })
  return { ok: true, data }
}

export async function getAdminTeacherDetail(teacherId: string) {
  const { data } = await getAdminTeachers()
  const target = data.find((item) => item.teacher_id === String(teacherId))
  if (!target) throw new ApiError('未找到该教师', 404)
  return { ok: true, data: target }
}

export type AdminTeacherSavePayload = {
  teacher_id?: string | null
  name: string
  staff_id: string
  subject?: string
  password?: string
  status?: AdminTeacherStatus
}

export async function saveAdminTeacher(payload: AdminTeacherSavePayload) {
  // 编辑教师
  if (payload.teacher_id) {
    await request<{ success: boolean }>('admin/user/edit', {
      method: 'POST',
      body: {
        user_id: Number(payload.teacher_id),
        user_type: 'Teacher',
        username: payload.name,
        student_staff_id: payload.staff_id,
      },
    })
    return { ok: true, teacher_id: payload.teacher_id }
  }

  // 新增教师（后端必填语种，前端表单未采集 → 使用默认语种）
  const created = await request<{ user_id: number }>('admin/teacher/add', {
    method: 'POST',
    body: {
      username: payload.name,
      password: payload.password ?? '',
      student_staff_id: payload.staff_id,
      language: languageCode(payload.subject) || DEFAULT_TEACHER_LANGUAGE,
    },
  })
  return { ok: true, teacher_id: String(created?.user_id ?? '') }
}

export type AdminTeacherAssignmentClass = {
  class_id: string
  class_name: string
  language: string
  assigned: boolean
}

export type AdminTeacherAssignmentData = {
  teacher_id: string
  teacher_name: string
  staff_id: string
  classes: AdminTeacherAssignmentClass[]
}

export async function getAdminTeacherAssignments(teacherId: string) {
  const [teachers, classes] = await Promise.all([fetchAdminTeachers(), fetchAdminClasses()])
  const teacher = teachers.find((item) => String(item.user_id) === String(teacherId))
  if (!teacher) throw new ApiError('未找到该教师', 404)

  const assignedIds = new Set((teacher.classes ?? []).map((item) => item.class_id))
  const data: AdminTeacherAssignmentData = {
    teacher_id: String(teacher.user_id),
    teacher_name: teacher.username,
    staff_id: teacher.staff_id,
    classes: classes.map((item) => ({
      class_id: item.class_id,
      class_name: item.class_name,
      language: languageLabel(item.language),
      assigned: assignedIds.has(item.class_id),
    })),
  }
  return { ok: true, data }
}

export async function assignAdminTeacherClasses(teacherId: string, classIds: string[]) {
  if (!classIds.length) return { ok: true }
  await request<{ success: boolean }>('admin/teacher/assign', {
    method: 'POST',
    body: { user_id: Number(teacherId), classes_id: classIds },
  })
  return { ok: true }
}

export async function unassignAdminTeacherClasses(teacherId: string, classIds: string[]) {
  for (const classId of classIds) {
    await request<{ success: boolean }>('admin/user/unlink_class', {
      method: 'POST',
      body: { user_type: 'Teacher', user_id: Number(teacherId), class_id: classId },
    })
  }
  return { ok: true }
}

// ========================================
// 教师端 — 模板库
// ========================================

export type TeacherTemplateVisibility = 'school' | 'private'

export type TeacherTemplateItem = {
  template_id: string
  title: string
  sentence_count: number
  phonemes: string[]
  visibility: TeacherTemplateVisibility
  preview: string
  segments: string[]
}

type BackendTaskTemplate = {
  task_template_id: string
  template_title: string
  segments: string[]
  target_phoneme: string[] | null
  creator: number
}

export async function getTeacherTemplates() {
  const raw = await request<BackendTaskTemplate[]>('teacher/task_templates', { method: 'GET' })
  const list = Array.isArray(raw) ? raw : []
  const data: TeacherTemplateItem[] = list.map((item) => {
    const segments = item.segments ?? []
    return {
      template_id: item.task_template_id,
      title: item.template_title,
      sentence_count: segments.length,
      phonemes: item.target_phoneme ?? [],
      visibility: 'school',
      preview: segments[0] ?? '',
      segments,
    }
  })
  return { ok: true, data }
}
