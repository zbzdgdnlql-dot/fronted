import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../http', () => {
  return {
    request: vi.fn(async (path: string) => {
      if (path === 'teacher/basic_information') return { total_classes: 0, total_students: 0, total_tasks: 0 }
      if (path === 'teacher/classes') return []
      if (path === 'teacher/tasks') return []
      if (path === 'teacher/task/auto_segment') return { segments: ['hello'] }
      if (path === 'teacher/task_templates') {
        return [
          {
            task_template_id: 'tpl-1',
            template_title: '问候语模板',
            segments: ['Bonjour', 'Ça va ?'],
            target_phoneme: ['ʁ'],
            creator: 1,
          },
        ]
      }
      // 管理员端（真实后端路由）
      if (path === 'admin/classes') {
        return [
          {
            class_id: 'cls-1',
            class_name: '法语初级班-A',
            description: null,
            teachers: [{ user_id: 21, username: '张老师' }],
            language: 'fr',
            student_count: 2,
          },
        ]
      }
      if (path === 'admin/teachers') {
        return [
          {
            user_id: 21,
            username: '张老师',
            staff_id: 'T1001',
            classes: [{ class_id: 'cls-1', class_name: '法语初级班-A' }],
            language: 'fr',
          },
        ]
      }
      if (path === 'admin/class/students') {
        return [
          { user_id: 31, username: '王小明', student_id: 'S1001' },
          { user_id: 32, username: '李华', student_id: 'S1002' },
        ]
      }
      if (path === 'admin/class/create') return { class_id: 'cls-new', class_name: '新班级' }
      if (path === 'admin/class/edit') return { success: true }
      if (path === 'admin/class/students/add') return [{ user_id: 41, username: '王小明' }]
      if (path === 'admin/teacher/assign') return { success: true }
      if (path === 'admin/user/unlink_class') return { success: true }
      if (path === 'admin/user/edit') return { success: true }
      if (path === 'admin/teacher/add') return { user_id: 51, username: '李老师' }
      if (path === 'admin/student/change_class') return { success: true }
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
  ADMIN_LANGUAGE_OPTIONS,
  getTeacherTemplates,
  getAdminOverview,
  getAdminClasses,
  getAdminClassDetail,
  saveAdminClass,
  getAdminClassStudents,
  getAdminStudents,
  getAdminStudentDetail,
  saveAdminStudent,
  changeAdminStudentClass,
  getAdminTeachers,
  getAdminTeacherDetail,
  saveAdminTeacher,
  getAdminTeacherAssignments,
  assignAdminTeacherClasses,
  unassignAdminTeacherClasses,
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
      expect.objectContaining({ method: 'POST', body: { source: 'task', task_id: 'task-2026-c' } }),
    )
    expect(request).toHaveBeenCalledWith(
      'student/pron-test/submit_session',
      expect.objectContaining({ method: 'POST', body: { source: 'task', task_id: 'task-2026-c' } }),
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

  it('teacher templates map backend task_templates into template items', async () => {
    const res = await getTeacherTemplates()
    expect(request).toHaveBeenCalledWith('teacher/task_templates', expect.objectContaining({ method: 'GET' }))
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toEqual({
      template_id: 'tpl-1',
      title: '问候语模板',
      sentence_count: 2,
      phonemes: ['ʁ'],
      visibility: 'school',
      preview: 'Bonjour',
      segments: ['Bonjour', 'Ça va ?'],
    })
  })

  it('admin language options only expose backend-supported languages', () => {
    expect(ADMIN_LANGUAGE_OPTIONS).toEqual(['日语', '德语', '法语', '西班牙语', '俄语'])
  })

  it('admin overview composes classes and teachers from real routes', async () => {
    const res = await getAdminOverview()
    expect(request).toHaveBeenCalledWith('admin/classes', expect.objectContaining({ method: 'GET' }))
    expect(request).toHaveBeenCalledWith('admin/teachers', expect.objectContaining({ method: 'GET' }))
    expect(res.data.class_count).toBe(1)
    expect(res.data.teacher_count).toBe(1)
    expect(res.data.student_count).toBe(2)
  })

  it('admin classes map backend fields and filter by keyword', async () => {
    const res = await getAdminClasses({ keyword: '法语' })
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toEqual(
      expect.objectContaining({
        class_id: 'cls-1',
        class_name: '法语初级班-A',
        language: '法语',
        language_code: 'FR',
        teacher_id: '21',
        teacher_name: '张老师',
      }),
    )
    const empty = await getAdminClasses({ keyword: '不存在的班级' })
    expect(empty.data).toHaveLength(0)
  })

  it('admin class detail resolves target and throws when missing', async () => {
    const res = await getAdminClassDetail('cls-1')
    expect(res.data.class_id).toBe('cls-1')
    await expect(getAdminClassDetail('missing')).rejects.toThrow('未找到对应班级')
  })

  it('save admin class (edit) calls class/edit and optional teacher/assign', async () => {
    await saveAdminClass({ class_id: 'cls-1', class_name: '新名字', language: '法语', teacher_id: '21' })
    expect(request).toHaveBeenCalledWith(
      'admin/class/edit',
      expect.objectContaining({ method: 'POST', body: { class_id: 'cls-1', class_name: '新名字' } }),
    )
    expect(request).toHaveBeenCalledWith(
      'admin/teacher/assign',
      expect.objectContaining({ method: 'POST', body: { user_id: 21, classes_id: ['cls-1'] } }),
    )
  })

  it('save admin class (create) creates class, imports students and assigns teacher', async () => {
    const res = await saveAdminClass({
      class_name: '新班级',
      language: '西班牙语',
      teacher_id: '21',
      students: [{ stu_id: 'S1001', name: '王小明' }],
    })
    expect(res.class_id).toBe('cls-new')
    expect(request).toHaveBeenCalledWith(
      'admin/class/create',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ class_name: '新班级', language_type: 'sp' }),
      }),
    )
    expect(request).toHaveBeenCalledWith(
      'admin/class/students/add',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ class_id: 'cls-new' }),
      }),
    )
    expect(request).toHaveBeenCalledWith(
      'admin/teacher/assign',
      expect.objectContaining({ method: 'POST', body: { user_id: 21, classes_id: ['cls-new'] } }),
    )
  })

  it('admin class students merges class info and student list', async () => {
    const res = await getAdminClassStudents('cls-1')
    expect(res.data.class_name).toBe('法语初级班-A')
    expect(res.data.language).toBe('法语')
    expect(res.data.students).toHaveLength(2)
    expect(res.data.students[0]).toEqual(
      expect.objectContaining({ user_id: '31', name: '王小明', stu_id: 'S1001', class_id: 'cls-1' }),
    )
  })

  it('admin students aggregate across classes and filter by keyword', async () => {
    const res = await getAdminStudents()
    expect(res.data).toHaveLength(2)
    const filtered = await getAdminStudents({ keyword: 'S1002' })
    expect(filtered.data).toHaveLength(1)
    expect(filtered.data[0].name).toBe('李华')
  })

  it('admin student detail resolves by user_id and throws when missing', async () => {
    const res = await getAdminStudentDetail('31')
    expect(res.data.name).toBe('王小明')
    await expect(getAdminStudentDetail('999')).rejects.toThrow('未找到该学生')
  })

  it('save admin student (edit) calls user/edit', async () => {
    await saveAdminStudent({ user_id: '31', name: '王小明', stu_id: 'S1001' })
    expect(request).toHaveBeenCalledWith(
      'admin/user/edit',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ user_id: 31, user_type: 'Student', student_staff_id: 'S1001' }),
      }),
    )
  })

  it('save admin student (create) calls class/students/add', async () => {
    const res = await saveAdminStudent({ class_id: 'cls-1', name: '王小明', stu_id: 'S1001' })
    expect(res.user_id).toBe('41')
    expect(request).toHaveBeenCalledWith(
      'admin/class/students/add',
      expect.objectContaining({ method: 'POST', body: expect.objectContaining({ class_id: 'cls-1' }) }),
    )
  })

  it('change admin student class resolves the old class before switching', async () => {
    await changeAdminStudentClass({ user_id: '31', target_class_id: 'cls-2' })
    expect(request).toHaveBeenCalledWith(
      'admin/student/change_class',
      expect.objectContaining({
        method: 'POST',
        body: { user_id: 31, old_class_id: 'cls-1', new_class_id: 'cls-2' },
      }),
    )
  })

  it('admin teachers map backend fields and filter by subject', async () => {
    const res = await getAdminTeachers({ subject: '法语' })
    expect(res.data[0]).toEqual(
      expect.objectContaining({ teacher_id: '21', name: '张老师', staff_id: 'T1001', subject: '法语', class_count: 1 }),
    )
    const empty = await getAdminTeachers({ keyword: '不存在' })
    expect(empty.data).toHaveLength(0)
  })

  it('admin teacher detail resolves target and throws when missing', async () => {
    const res = await getAdminTeacherDetail('21')
    expect(res.data.name).toBe('张老师')
    await expect(getAdminTeacherDetail('999')).rejects.toThrow('未找到该教师')
  })

  it('save admin teacher (edit) calls user/edit', async () => {
    await saveAdminTeacher({ teacher_id: '21', name: '张老师', staff_id: 'T1001' })
    expect(request).toHaveBeenCalledWith(
      'admin/user/edit',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ user_id: 21, user_type: 'Teacher' }),
      }),
    )
  })

  it('save admin teacher (create) falls back to default language when subject missing', async () => {
    await saveAdminTeacher({ name: '李老师', staff_id: 'T1002', password: 'p' })
    expect(request).toHaveBeenCalledWith(
      'admin/teacher/add',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ username: '李老师', student_staff_id: 'T1002', language: 'fr' }),
      }),
    )

    await saveAdminTeacher({ name: '李老师', staff_id: 'T1002', subject: '日语' })
    expect(request).toHaveBeenCalledWith(
      'admin/teacher/add',
      expect.objectContaining({ body: expect.objectContaining({ language: 'jp' }) }),
    )
  })

  it('admin teacher assignments mark assigned classes', async () => {
    const res = await getAdminTeacherAssignments('21')
    expect(res.data.teacher_name).toBe('张老师')
    expect(res.data.classes[0]).toEqual({
      class_id: 'cls-1',
      class_name: '法语初级班-A',
      language: '法语',
      assigned: true,
    })
  })

  it('assign/unassign admin teacher classes hit the real routes', async () => {
    await assignAdminTeacherClasses('21', ['cls-1', 'cls-2'])
    expect(request).toHaveBeenCalledWith(
      'admin/teacher/assign',
      expect.objectContaining({ method: 'POST', body: { user_id: 21, classes_id: ['cls-1', 'cls-2'] } }),
    )

    await unassignAdminTeacherClasses('21', ['cls-1'])
    expect(request).toHaveBeenCalledWith(
      'admin/user/unlink_class',
      expect.objectContaining({
        method: 'POST',
        body: { user_type: 'Teacher', user_id: 21, class_id: 'cls-1' },
      }),
    )
  })
})
