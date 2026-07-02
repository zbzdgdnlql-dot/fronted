import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../http', () => {
  return {
    request: vi.fn(async (path: string) => {
      if (path === 'teacher/basic_information') return { total_classes: 0, total_students: 0, total_tasks: 0 }
      if (path === 'teacher/classes') return []
      if (path === 'teacher/tasks') return []
      if (path === 'teacher/task/auto_segment') return { segments: ['hello'] }
      return {}
    }),
    requestBlob: vi.fn(async () => new Blob(['audio'])),
  }
})

import { request, requestBlob } from '../http'
import {
  login,
  logout,
  editUserPassword,
  getInstitutes,
  searchInstitutes,
  getStudentBasicInformation,
  analyzeStudentPronTest,
  createStudentTestSession,
  getStudentTaskDetail,
  getStudentSessionDetails,
  getStudentTasks,
  getStudentTaskRecords,
  submitStudentTestSession,
  getStudentArchiveStatistics,
  getStudentHistoryWords,
  getUserDetail,
  getTeacherBasicInformation,
  getTeacherDashboard,
  getTeacherClasses,
  getTeacherClassStudents,
  getTeacherClassContents,
  getTeacherTaskRecords,
  getTeacherEvaluationAudio,
  getTeacherStudentBasicInformation,
  getTeacherStudentRecords,
  getTeacherTaskBasicInformation,
  validateTeacherContent,
  segmentTeacherContent,
  getTeacherCustomContentRecords,
  createTeacherContent,
  publishTeacherTask,
  updateTeacherTask,
} from '../endpoints'

describe('api/endpoints', () => {
  beforeEach(() => {
    ;(request as any).mockClear?.()
  })

  it('login uses POST auth/login', async () => {
    await login({ institute: '华东师范大学', school_seq: 'school-1', user_type: 'Student', stu_id: '1001', password: 'p' })
    expect(request).toHaveBeenCalledWith(
      'auth/login',
      expect.objectContaining({
        method: 'POST',
        body: { institute: '华东师范大学', school_seq: 'school-1', user_type: 'Student', stu_id: '1001', password: 'p' },
      }),
    )
  })

  it('logout uses POST auth/logout', async () => {
    await logout()
    expect(request).toHaveBeenCalledWith('auth/logout', expect.objectContaining({ method: 'POST' }))
  })

  it('edit user password uses PUT auth/users/edit_password', async () => {
    await editUserPassword({ oldPassword: 'old123', password: 'new123' })
    expect(request).toHaveBeenCalledWith(
      'auth/users/edit_password',
      expect.objectContaining({ method: 'PUT', body: { old_password: 'old123', password: 'new123' } }),
    )
  })

  it('edit user password can omit old password for forced first login change', async () => {
    await editUserPassword({ password: 'new123' })
    expect(request).toHaveBeenCalledWith(
      'auth/users/edit_password',
      expect.objectContaining({ method: 'PUT', body: { password: 'new123' } }),
    )
  })

  it('get institutes uses GET auth/institute/all', async () => {
    await getInstitutes()
    expect(request).toHaveBeenCalledWith('auth/institute/all', expect.objectContaining({ method: 'GET' }))
  })

  it('search institutes uses GET auth/institute/search with key_word', async () => {
    await searchInstitutes('上海')
    expect(request).toHaveBeenCalledWith(
      'auth/institute/search',
      expect.objectContaining({ method: 'GET', query: { key_word: '上海' } }),
    )
  })

  it('student basic information uses GET student/basic_information', async () => {
    await getStudentBasicInformation()
    expect(request).toHaveBeenCalledWith('student/basic_information', expect.objectContaining({ method: 'GET' }))
  })

  it('student tasks uses GET student/tasks with current class_id', async () => {
    await getStudentTasks('class-a')
    expect(request).toHaveBeenCalledWith(
      'student/tasks',
      expect.objectContaining({ method: 'GET', query: { class_id: 'class-a' } }),
    )
  })

  it('student task detail uses GET student/task_detail with task_id', async () => {
    await getStudentTaskDetail('1001')
    expect(request).toHaveBeenCalledWith(
      'student/task_detail',
      expect.objectContaining({ method: 'GET', query: { task_id: '1001' } }),
    )
  })

  it('student task records uses GET student/task with task_id', async () => {
    await getStudentTaskRecords('abc')
    expect(request).toHaveBeenCalledWith(
      'student/task',
      expect.objectContaining({ method: 'GET', query: { task_id: 'abc' } }),
    )
  })

  it('student session details uses GET student/session with session_id', async () => {
    await getStudentSessionDetails('s1')
    expect(request).toHaveBeenCalledWith(
      'student/session',
      expect.objectContaining({ method: 'GET', query: { session_id: 's1' } }),
    )
  })

  it('student archive statistics uses GET student/archive/statistics', async () => {
    await getStudentArchiveStatistics()
    expect(request).toHaveBeenCalledWith('student/archive/statistics', expect.objectContaining({ method: 'GET' }))
  })

  it('student history words uses GET student/history/words', async () => {
    await getStudentHistoryWords()
    expect(request).toHaveBeenCalledWith('student/history/words', expect.objectContaining({ method: 'GET' }))
  })

  it('user detail uses GET auth/users/user_detail', async () => {
    await getUserDetail()
    expect(request).toHaveBeenCalledWith('auth/users/user_detail', expect.objectContaining({ method: 'GET' }))
  })

  it('student pron test analyze uses multipart POST', async () => {
    await analyzeStudentPronTest({ audio: new Blob(['audio']), refText: 'Bonjour', taskId: '1001', sentenceSeq: 2 })
    const call = (request as any).mock.calls.find((c: any[]) => c[0] === 'student/pron-test/analyze')
    expect(call).toBeTruthy()
    expect(call[1]).toEqual(expect.objectContaining({ method: 'POST' }))
    expect(call[1].body).toBeInstanceOf(FormData)
    expect(call[1].body.get('audio')).toBeInstanceOf(Blob)
    expect(call[1].body.get('ref_text')).toBe('Bonjour')
    expect(call[1].body.get('task_id')).toBe('1001')
    expect(call[1].body.get('sentence_seq')).toBe('2')
    expect(call[1].body.get('lang')).toBe('fr')
    expect(call[1].body.get('core')).toBe('sent')
  })

  it('student test session APIs keep task_id as provided', async () => {
    await createStudentTestSession('task-2026-c')
    await submitStudentTestSession('task-2026-c')

    expect(request).toHaveBeenCalledWith(
      'student/pron-test/create_session',
      expect.objectContaining({ method: 'POST', body: { task_id: 'task-2026-c' } }),
    )
    expect(request).toHaveBeenCalledWith(
      'student/pron-test/submit_session',
      expect.objectContaining({ method: 'POST', body: { task_id: 'task-2026-c' } }),
    )
  })

  it('teacher basic information uses GET teacher/basic_information', async () => {
    await getTeacherBasicInformation()
    expect(request).toHaveBeenCalledWith('teacher/basic_information', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher dashboard composes basic information and classes', async () => {
    await getTeacherDashboard()
    expect(request).toHaveBeenCalledWith('teacher/basic_information', expect.objectContaining({ method: 'GET' }))
    expect(request).toHaveBeenCalledWith('teacher/classes', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher classes uses GET teacher/classes', async () => {
    await getTeacherClasses()
    expect(request).toHaveBeenCalledWith('teacher/classes', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher class content filters GET teacher/tasks', async () => {
    await getTeacherClassContents('c1')
    expect(request).toHaveBeenCalledWith('teacher/tasks', expect.objectContaining({ method: 'GET' }))
  })

  it('teacher class students uses POST teacher/class/students', async () => {
    await getTeacherClassStudents('c1')
    expect(request).toHaveBeenCalledWith(
      'teacher/class/students',
      expect.objectContaining({ method: 'POST', body: { class_id: 'c1' } }),
    )
  })

  it('teacher student basic information uses POST teacher/student/basic_information', async () => {
    await getTeacherStudentBasicInformation('9')
    expect(request).toHaveBeenCalledWith(
      'teacher/student/basic_information',
      expect.objectContaining({ method: 'POST', body: { user_id: 9, time_range: null } }),
    )
  })

  it('teacher student records uses POST teacher/student/records', async () => {
    await getTeacherStudentRecords('9')
    expect(request).toHaveBeenCalledWith(
      'teacher/student/records',
      expect.objectContaining({ method: 'POST', body: { user_id: 9, time_range: null } }),
    )
  })

  it('teacher task basic information uses POST teacher/task/basic_information', async () => {
    await getTeacherTaskBasicInformation('c1', 'task-2')
    expect(request).toHaveBeenCalledWith(
      'teacher/task/basic_information',
      expect.objectContaining({ method: 'POST', body: { class_id: 'c1', task_id: 'task-2', time_range: null } }),
    )
  })

  it('validate content is local because latest backend has no validate route', async () => {
    const res = await validateTeacherContent('hello')
    expect(res.valid).toBe(true)
  })

  it('segment content uses POST teacher/task/auto_segment', async () => {
    await segmentTeacherContent('hello')
    expect(request).toHaveBeenCalledWith(
      'teacher/task/auto_segment',
      expect.objectContaining({ method: 'POST', query: { text: 'hello' } }),
    )
  })

  it('teacher records uses POST teacher/task/records', async () => {
    await getTeacherTaskRecords('c1', 'task-1')
    expect(request).toHaveBeenCalledWith(
      'teacher/task/records',
      expect.objectContaining({ method: 'POST', body: { class_id: 'c1', task_id: 'task-1' } }),
    )
  })

  it('teacher evaluation audio uses GET teacher/evaluation/audio with evaluation_id', async () => {
    await getTeacherEvaluationAudio('e1')
    expect(requestBlob).toHaveBeenCalledWith(
      'teacher/evaluation/audio',
      expect.objectContaining({ method: 'GET', query: { evaluation_id: 'e1' } }),
    )
  })

  it('teacher legacy records wrapper delegates to teacher task records', async () => {
    await getTeacherCustomContentRecords('task-1', 'c1')
    expect(request).toHaveBeenCalledWith(
      'teacher/task/records',
      expect.objectContaining({ method: 'POST', body: { class_id: 'c1', task_id: 'task-1' } }),
    )
  })

  it('create teacher content uses POST teacher/task/save', async () => {
    await createTeacherContent({ classId: 'c1', title: 't', contentText: 'txt', maxSubmission: 2, targetPhonemes: ['a'] })
    const call = (request as any).mock.calls.find((c: any[]) => c[0] === 'teacher/task/save')
    expect(call).toBeTruthy()
    expect(call[1]).toEqual(expect.objectContaining({ method: 'POST' }))
    expect(call[1].body).toEqual(expect.objectContaining({ course: ['c1'], title: 't', available_from: expect.any(String), available_until: expect.any(String) }))
  })

  it('publish teacher task uses POST teacher/task/save with create payload', async () => {
    await publishTeacherTask({
      classIds: ['c1', 'c2'],
      title: 'task',
      segments: ['hello'],
      taskType: 'homework',
      maxAttempt: 3,
      availableFrom: '2026-05-27T00:00:00.000Z',
      availableUntil: '2026-05-28T00:00:00.000Z',
    })
    expect(request).toHaveBeenCalledWith(
      'teacher/task/save',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          task_id: null,
          course: ['c1', 'c2'],
          task_type: 'homework',
          title: 'task',
          segments: ['hello'],
          max_attempt: 3,
          available_from: '2026-05-27T00:00:00.000Z',
          available_until: '2026-05-28T00:00:00.000Z',
        }),
      }),
    )
  })

  it('update teacher task uses POST teacher/task/save without segments', async () => {
    await updateTeacherTask({
      taskId: 'task-1',
      title: 'updated',
      notes: null,
      maxAttempt: 4,
      availableFrom: '2026-05-27T00:00:00.000Z',
    })
    expect(request).toHaveBeenCalledWith(
      'teacher/task/save',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          task_id: 'task-1',
          title: 'updated',
          notes: null,
          max_attempt: 4,
          available_from: '2026-05-27T00:00:00.000Z',
        }),
      }),
    )
    const call = (request as any).mock.calls.find((c: any[]) => c[0] === 'teacher/task/save')
    expect(call[1].body).not.toHaveProperty('segments')
    expect(call[1].body).not.toHaveProperty('course')
    expect(call[1].body).not.toHaveProperty('task_type')
  })
})
