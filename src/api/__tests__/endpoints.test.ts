import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../http', () => {
  return {
    request: vi.fn(async () => ({})),
  }
})

import { request } from '../http'
import {
  login,
  logout,
  getStudentCustomContents,
  getStudentCustomContentRecords,
  getTeacherDashboard,
  getTeacherClasses,
  getTeacherClassContents,
  validateTeacherContent,
  segmentTeacherContent,
  getTeacherCustomContentRecords,
  createTeacherContent,
} from '../endpoints'

describe('api/endpoints', () => {
  beforeEach(() => {
    ;(request as any).mockClear?.()
  })

  it('login uses POST auth/login', async () => {
    await login({ institute: 'i', username: 'u', password: 'p' })
    expect(request).toHaveBeenCalledWith('auth/login', expect.objectContaining({ method: 'POST' }))
  })

  it('logout uses GET auth/logout', async () => {
    await logout()
    expect(request).toHaveBeenCalledWith('auth/logout', expect.objectContaining({ method: 'GET' }))
  })

  it('student custom content list uses GET student/custom_content', async () => {
    await getStudentCustomContents()
    expect(request).toHaveBeenCalledWith('student/custom_content', expect.objectContaining({ method: 'GET' }))
  })

  it('student records uses GET student/custom_content/<id>', async () => {
    await getStudentCustomContentRecords('abc')
    expect(request).toHaveBeenCalledWith('student/custom_content/abc', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher dashboard uses GET teacher/dashboard', async () => {
    await getTeacherDashboard()
    expect(request).toHaveBeenCalledWith('teacher/dashboard', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher classes uses GET teacher//api/classes', async () => {
    await getTeacherClasses()
    expect(request).toHaveBeenCalledWith('teacher//api/classes', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher class content uses GET teacher/class/<id>/content', async () => {
    await getTeacherClassContents('c1')
    expect(request).toHaveBeenCalledWith('teacher/class/c1/content', expect.objectContaining({ method: 'GET' }))
  })

  it('validate content uses POST teacher/api/content/validate', async () => {
    await validateTeacherContent('hello')
    expect(request).toHaveBeenCalledWith(
      'teacher/api/content/validate',
      expect.objectContaining({ method: 'POST', body: { content_text: 'hello' } }),
    )
  })

  it('segment content uses POST teacher/api/content/segment', async () => {
    await segmentTeacherContent('hello')
    expect(request).toHaveBeenCalledWith(
      'teacher/api/content/segment',
      expect.objectContaining({ method: 'POST', body: { content_text: 'hello' } }),
    )
  })

  it('teacher records uses GET teacher/custom_content/<id>/custom_content_detail', async () => {
    await getTeacherCustomContentRecords('x1')
    expect(request).toHaveBeenCalledWith(
      'teacher/custom_content/x1/custom_content_detail',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('create teacher content uses POST teacher/class/<id>/content with FormData', async () => {
    await createTeacherContent({ classId: 'c1', title: 't', contentText: 'txt', maxSubmission: 2, targetPhonemes: ['a'] })
    const call = (request as any).mock.calls.find((c: any[]) => c[0] === 'teacher/class/c1/content')
    expect(call).toBeTruthy()
    expect(call[1]).toEqual(expect.objectContaining({ method: 'POST' }))
    expect(call[1].body).toBeInstanceOf(FormData)
  })
})

