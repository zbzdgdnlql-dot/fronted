import { request, requestBlob } from './http'

export type LoginForm = {
  institute: string
  user_type: 'Student' | 'Teacher'
  stu_id: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
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

export type InstituteItem = {
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

export type StudentTaskDetail = {
  task_id: number
  course: Array<{
    class_id: string
    class_name: string
  }>
  task_type: 'practice' | 'homework'
  language_type: 'jp' | 'de' | 'fr' | 'sp' | 'ru' | string
  title: string
  segments: string[]
  notes: string | null
  max_attempt: number | null
  target_phoneme: string[] | string | null
  is_active: boolean
  created_at: string
  updated_at: string
  available_from: string | null
  available_until: string | null
}

export async function getStudentTaskDetail(taskId: string | number) {
  return request<{ ok: boolean; data: StudentTaskDetail }>('student/task_detail', {
    method: 'GET',
    query: { task_id: taskId },
  })
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
    query: { task_id: taskId },
  })
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

export async function createStudentTestSession(taskId: string | number) {
  return request<CreateStudentTestSessionResponse>('student/test/create_session', {
    method: 'POST',
    body: { task_id: Number(taskId) },
  })
}

export type SubmitStudentTestSessionResponse = {
  ok: boolean
  session_id: string
  total_score: number
  evaluation_count: number
  average_score: number
}

export async function submitStudentTestSession(taskId: string | number) {
  return request<SubmitStudentTestSessionResponse>('student/test/submit_session', {
    method: 'POST',
    body: { task_id: Number(taskId) },
  })
}

export type StudentPronTestAnalyzeParams = {
  audio: File | Blob
  refText: string
  taskId: string | number
  sentenceSeq?: number
  lang?: string
  core?: string
}

export async function analyzeStudentPronTest(params: StudentPronTestAnalyzeParams) {
  const fd = new FormData()
  fd.set('audio', params.audio)
  fd.set('ref_text', params.refText)
  fd.set('task_id', String(params.taskId))
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
    task_id: number
    sentence_seq: number
    ref_text: string
    result_score: unknown
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
}

export async function getTeacherClasses() {
  return request<TeacherClassItem[]>('teacher/classes', { method: 'GET' })
}

export type TeacherTaskItem = {
  task_id: number
  course: Array<{ class_id: string; class_name: string }>
  task_type: 'practice' | 'homework'
  title: string
  segments: string[]
  notes: string | null
  max_attempt: number | null
  target_phoneme: string[] | null
  available_from: string | null
  available_until: string | null
}

export async function getTeacherTasks() {
  return request<TeacherTaskItem[]>('teacher/tasks', { method: 'GET' })
}

export type TeacherClassTaskSummary = {
  task_id: number
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
  task_id: number
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
    body: { class_id: classId, task_id: Number(taskId), time_range: timeRange ?? null },
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
      notes: params.notes ?? null,
      max_attempt: params.maxAttempt ?? null,
      target_phoneme: params.targetPhoneme?.length ? params.targetPhoneme : null,
      available_from: params.availableFrom,
      available_until: params.availableUntil,
    },
  })
}

export type UpdateTeacherTaskParams = {
  taskId: string | number
  title?: string
  notes?: string | null
  maxAttempt?: number | null
  targetPhoneme?: string[] | null
  availableFrom?: string | null
  availableUntil?: string | null
}

export async function updateTeacherTask(params: UpdateTeacherTaskParams) {
  return request<{ success: boolean }>('teacher/task/save', {
    method: 'POST',
    body: {
      task_id: Number(params.taskId),
      title: params.title,
      notes: params.notes,
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
    query: { task_id: taskId },
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
    body: { class_id: classId, task_id: Number(taskId) },
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
