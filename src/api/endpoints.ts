import { request } from './http'
import type { Session } from '../stores/auth'

export type LoginForm = {
  institute: string
  username: string
  password: string
}

export async function login(form: LoginForm) {
  return request<Session>('auth/login', { method: 'POST', body: form })
}

export async function logout() {
  return request<unknown>('auth/logout', { method: 'GET' })
}

export type StudentCustomContentItem = {
  content_id: string
  class_id: string
  title: string
  segmented_sentences: string[]
  max_submission: number
  target_phonemes: string[]
  created_at: string
  updated_at: string
  avg_score: number
  is_active: boolean
}

export async function getStudentCustomContents() {
  return request<{ class_content: StudentCustomContentItem[] }>('student/custom_content', { method: 'GET' })
}

export type StudentContentRecordItem = {
  session_id: string
  title: string
  average_score: number
  teacher_score: number
  teacher_notes: number
  completed_at: string
  created_at: string
}

export async function getStudentCustomContentRecords(contentId: string) {
  return request<{ class_content: StudentContentRecordItem[] }>(`student/custom_content/${encodeURIComponent(contentId)}`, {
    method: 'GET',
  })
}

export type TeacherDashboardResponse = {
  user: unknown
  class_details: Array<{
    class: unknown
    student_count: number
    content_count: number
  }>
  total_classes: number
  total_students: number
  total_content: number
}

export async function getTeacherDashboard() {
  return request<TeacherDashboardResponse>('teacher/dashboard', { method: 'GET' })
}

export type TeacherClassItem = {
  class_id: string
  class_name: string
  description: string
  student_count: number
  content_count: number
  created_at: string
}

export async function getTeacherClasses() {
  return request<{ success: boolean; classes: TeacherClassItem[]; total_count: number }>('teacher//api/classes', { method: 'GET' })
}

export type TeacherContentItem = {
  content_id: string
  title?: string
  created_at?: string
  updated_at?: string
  max_submission?: number
  is_active?: boolean
}

export async function getTeacherClassContents(classId: string) {
  return request<{ class_obj: unknown; content_list: TeacherContentItem[] }>(
    `teacher/class/${encodeURIComponent(classId)}/content`,
    { method: 'GET' },
  )
}

export async function validateTeacherContent(contentText: string) {
  return request<{
    valid: boolean
    has_german_chars: boolean
    word_count: number
    sentence_count: number
    character_count: number
    message: string
  }>('teacher/api/content/validate', { method: 'POST', body: { content_text: contentText } })
}

export async function segmentTeacherContent(contentText: string) {
  return request<{
    success: boolean
    sentences: string[]
    sentence_count: number
    statistics: Record<string, number>
    estimated_difficulty: number
    suggested_phonemes: string[]
    has_german_chars: boolean
  }>('teacher/api/content/segment', { method: 'POST', body: { content_text: contentText } })
}

export type TeacherContentRecordsStudent = {
  user_id: string
  username: string
  records_count: number
  records: Array<{
    session_id: string
    average_score: number
    completed_at: string
  }>
}

export async function getTeacherCustomContentRecords(contentId: string) {
  return request<TeacherContentRecordsStudent[]>(
    `teacher/custom_content/${encodeURIComponent(contentId)}/custom_content_detail`,
    { method: 'GET' },
  )
}

export async function createTeacherContent(params: {
  classId: string
  title: string
  contentText: string
  maxSubmission?: number
  targetPhonemes?: string[]
}) {
  const fd = new FormData()
  fd.set('title', params.title)
  fd.set('content_text', params.contentText)
  if (params.maxSubmission !== undefined) fd.set('max_submission', String(params.maxSubmission))
  if (params.targetPhonemes?.length) fd.set('target_phonemes', JSON.stringify(params.targetPhonemes))
  return request<unknown>(`teacher/class/${encodeURIComponent(params.classId)}/content`, { method: 'POST', body: fd })
}

