import { ApiError } from './errors'

// =====================================================
// 全局 Mock 数据层（仅开发模式启用）
// 在 http.ts 的 request / requestBlob 中优先拦截 /api/** 请求，
// 使前后端分离开发时各页面不依赖真实后端也能正常展示。
// 登录账号：
//   教师端  teacher / 123456（用户类型选「教师」）
//   学生端  student / 123456（用户类型选「学生」）
//   管理员端 admin  / 123456（用户类型选「管理员」）
// 学校：华东师范大学
// =====================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------- 基础数据 ----------------

const SCHOOLS = [
  { school_id: 'ecnu', school_seq: 'ecnu', school_name: '华东师范大学' },
  { school_id: 'ecnu-soft', school_seq: 'ecnu-soft', school_name: '华东师范大学软件工程学院' },
  { school_id: 'fudan', school_seq: 'fudan', school_name: '复旦大学' },
  { school_id: 'shanghai-jiao-tong', school_seq: 'shanghai-jiao-tong', school_name: '上海交通大学' },
]

const CLASSES = [
  {
    class_id: 'mock-class-001',
    class_name: '法语 A 班',
    description: '零基础入门，掌握基础发音与日常用语',
    student_count: 28,
    task_count: 12,
    grade_level: 'A1',
    created_at: '2026-03-05',
  },
  {
    class_id: 'mock-class-002',
    class_name: '法语 B 班',
    description: '初级进阶，强化语法与听说能力',
    student_count: 24,
    task_count: 10,
    grade_level: 'A2',
    created_at: '2026-04-12',
  },
  {
    class_id: 'mock-class-003',
    class_name: '法语 C 班',
    description: '中级强化，提升读写与表达水平',
    student_count: 20,
    task_count: 8,
    grade_level: 'B1',
    created_at: '2026-05-20',
  },
]

const SEGMENTS = [
  'Bonjour, comment allez-vous ?',
  "Je m'appelle Marie et je viens de Paris.",
  'Nous apprenons le français ensemble.',
  "Quel est votre nom ?",
  "Merci beaucoup pour votre aide.",
]

const TASKS = [
  {
    task_id: 'task-1',
    course: [{ class_id: 'mock-class-001', class_name: '法语 A 班' }],
    task_type: 'practice',
    title: '法语发音练习 #12',
    segments: SEGMENTS.slice(0, 2),
    notes: '重点练习小舌音 r 与圆唇元音 u。',
    max_attempt: 3,
    target_phoneme: ['r', 'u'],
    available_from: '2026-08-01T00:00:00',
    available_until: '2026-09-01T00:00:00',
  },
  {
    task_id: 'task-2',
    course: [{ class_id: 'mock-class-001', class_name: '法语 A 班' }],
    task_type: 'homework',
    title: '元音发音练习 #11',
    segments: SEGMENTS.slice(2, 4),
    notes: '注意区分 /e/ 与 /ɛ/。',
    max_attempt: 2,
    target_phoneme: ['e', 'ɛ'],
    available_from: '2026-08-05T00:00:00',
    available_until: '2026-08-31T00:00:00',
  },
  {
    task_id: 'task-3',
    course: [{ class_id: 'mock-class-002', class_name: '法语 B 班' }],
    task_type: 'practice',
    title: '日常对话跟读练习',
    segments: SEGMENTS,
    notes: null,
    max_attempt: null,
    target_phoneme: null,
    available_from: null,
    available_until: null,
  },
]

const STUDENTS = [
  { user_id: 1, username: 'student', stu_id: 'STU2024001', evaluation_count: 5, last_evaluation: '2026-08-10', average_score: 85.5 },
  { user_id: 2, username: 'xiaoming', stu_id: 'STU2024002', evaluation_count: 3, last_evaluation: '2026-08-08', average_score: 78.2 },
  { user_id: 3, username: 'xiaohong', stu_id: 'STU2024003', evaluation_count: 8, last_evaluation: '2026-08-12', average_score: 91.4 },
  { user_id: 4, username: 'lihua', stu_id: 'STU2024004', evaluation_count: 2, last_evaluation: '2026-07-30', average_score: 72.8 },
]

const SESSION_RECORDS = [
  { session_id: 'session-1', title: '法语发音练习 #12', average_score: 88, teacher_score: 90, teacher_notes: '发音清晰，节奏把握很好。', completed_at: '2026-08-10 10:20:00', created_at: '2026-08-10 10:20:00' },
  { session_id: 'session-2', title: '元音发音练习 #11', average_score: 76, teacher_score: 78, teacher_notes: '/ɛ/ 发音略紧，注意放松。', completed_at: '2026-08-08 09:15:00', created_at: '2026-08-08 09:15:00' },
  { session_id: 'session-3', title: '日常对话跟读练习', average_score: 91, teacher_score: 92, teacher_notes: '表现出色！', completed_at: '2026-08-01 14:05:00', created_at: '2026-08-01 14:05:00' },
]

// 学生端任务列表（StudentTaskItem 结构）
const STUDENT_TASKS = [
  {
    task_id: 'task-1',
    class_id: 'mock-class-001',
    task_type: 'practice',
    title: '法语发音练习 #12',
    segmented_sentences: SEGMENTS.slice(0, 2),
    max_submission: 3,
    target_phonemes: ['r', 'u'],
    created_at: '2026-08-01T00:00:00',
    updated_at: '2026-08-01T00:00:00',
    available_from: '2026-08-01T00:00:00',
    available_until: '2026-09-01T00:00:00',
    avg_score: 85.3,
    is_active: true,
    attempt_count: 2,
  },
  {
    task_id: 'task-2',
    class_id: 'mock-class-001',
    task_type: 'homework',
    title: '元音发音练习 #11',
    segmented_sentences: SEGMENTS.slice(2, 4),
    max_submission: 2,
    target_phonemes: ['e', 'ɛ'],
    created_at: '2026-08-05T00:00:00',
    updated_at: '2026-08-05T00:00:00',
    available_from: '2026-08-05T00:00:00',
    available_until: '2026-08-31T00:00:00',
    avg_score: 78.6,
    is_active: true,
    attempt_count: 1,
  },
]

const SCORE_SUMMARY = {
  overall: 85.2,
  pronunciation: 82,
  rhythm: 88,
  fluency: 86,
  integrity: 84,
  tone: 87,
}

// ---------------- 管理员端数据 ----------------

const ADMIN_OVERVIEW = {
  class_count: 8,
  teacher_count: 12,
  student_count: 320,
  pending_count: 5,
  activities: [
    { activity_id: 'act-1', title: '张老师 更新了 三年级1班 的配置', time: '10 分钟前', type: 'config' },
    { activity_id: 'act-2', title: '新增教师 李老师', time: '1 小时前', type: 'teacher' },
    { activity_id: 'act-3', title: '王同学 完成了 英语口语练习', time: '2 小时前', type: 'student' },
    { activity_id: 'act-4', title: '新增班级 四年级2班', time: '昨天', type: 'class' },
    { activity_id: 'act-5', title: '系统 备份了平台数据', time: '2 天前', type: 'system' },
  ],
}

// 结构对齐 endpoints.ts 的 BackendClass（/admin/classes 返回数组）
const ADMIN_CLASSES = [
  {
    class_id: 'admin-class-001',
    class_name: '初级日语 A班',
    description: '零基础日语入门，掌握五十音图与日常问候语。',
    teachers: [{ user_id: 1001, username: '李思远' }],
    language: 'jp',
    student_count: 24,
  },
  {
    class_id: 'admin-class-002',
    class_name: '商务法语 B班',
    description: '面向商务场景的法语听说训练。',
    teachers: [{ user_id: 1002, username: '王梦洁' }],
    language: 'fr',
    student_count: 18,
  },
  {
    class_id: 'admin-class-003',
    class_name: '德语进阶 C班',
    description: '德语中级语法与口语表达强化。',
    teachers: [{ user_id: 1003, username: '佐藤美咲' }],
    language: 'de',
    student_count: 30,
  },
  {
    class_id: 'admin-class-004',
    class_name: '西班牙语 D班',
    description: '西班牙语语音与日常交流。',
    teachers: [{ user_id: 1004, username: '陈嘉禾' }],
    language: 'sp',
    student_count: 21,
  },
  {
    class_id: 'admin-class-005',
    class_name: '俄语基础 E班',
    description: '俄语字母与基础语法入门。',
    teachers: [{ user_id: 1005, username: '赵云飞' }],
    language: 'ru',
    student_count: 15,
  },
  {
    class_id: 'admin-class-006',
    class_name: '法语口语 F班',
    description: '强化法语口语表达与语音语调。',
    teachers: [{ user_id: 1006, username: '林晓雯' }],
    language: 'fr',
    student_count: 12,
  },
]

// 结构对齐 endpoints.ts 的 BackendTeacher（/admin/teachers 返回数组）
const ADMIN_TEACHERS = [
  { user_id: 1001, username: '李思远', staff_id: 'T-1001', classes: [{ class_id: 'admin-class-001', class_name: '初级日语 A班' }], language: 'jp' },
  { user_id: 1002, username: '王梦洁', staff_id: 'T-1002', classes: [{ class_id: 'admin-class-002', class_name: '商务法语 B班' }], language: 'fr' },
  { user_id: 1003, username: '佐藤美咲', staff_id: 'T-1003', classes: [{ class_id: 'admin-class-003', class_name: '德语进阶 C班' }], language: 'de' },
  { user_id: 1004, username: '陈嘉禾', staff_id: 'T-1004', classes: [{ class_id: 'admin-class-004', class_name: '西班牙语 D班' }], language: 'sp' },
  { user_id: 1005, username: '赵云飞', staff_id: 'T-1005', classes: [{ class_id: 'admin-class-005', class_name: '俄语基础 E班' }], language: 'ru' },
  { user_id: 1006, username: '林晓雯', staff_id: 'T-1006', classes: [{ class_id: 'admin-class-006', class_name: '法语口语 F班' }], language: 'fr' },
]

// 结构对齐 endpoints.ts 的 BackendStudent（/admin/class/students 返回数组）
const ADMIN_STUDENTS = [
  { user_id: 2001, username: '王小明', student_id: 'S1001', class_id: 'admin-class-001' },
  { user_id: 2002, username: '李华', student_id: 'S1002', class_id: 'admin-class-001' },
  { user_id: 2003, username: '张伟', student_id: 'S1003', class_id: 'admin-class-002' },
  { user_id: 2004, username: '赵芳', student_id: 'S1004', class_id: 'admin-class-002' },
  { user_id: 2005, username: '陈静', student_id: 'S1005', class_id: 'admin-class-004' },
  { user_id: 2006, username: '刘洋', student_id: 'S1006', class_id: 'admin-class-006' },
]

const TEACHER_TEMPLATES = [
  {
    template_id: 'tpl-001',
    title: '牛津树 · 三年级 Unit 3 朗读',
    sentence_count: 12,
    phonemes: ['/æ/', '/eɪ/'],
    visibility: 'school',
    preview: 'The children went to the park and played on the swings. Everyone had a wonderful time together.',
    segments: [
      'The children went to the park.',
      'They played on the swings all afternoon.',
      'Everyone had a wonderful time together.',
    ],
  },
  {
    template_id: 'tpl-002',
    title: '人教版 · 七年级上册 Unit 1 朗读',
    sentence_count: 8,
    phonemes: [],
    visibility: 'private',
    preview: 'My name is Li Ming. I am a student in Grade Seven. Nice to meet you all.',
    segments: ['My name is Li Ming.', 'I am a student in Grade Seven.', 'Nice to meet you all.'],
  },
  {
    template_id: 'tpl-003',
    title: '绘本 · 饥饿的毛毛虫 精读',
    sentence_count: 15,
    phonemes: ['/θ/', '/ð/'],
    visibility: 'school',
    preview: 'In the light of the moon a little egg lay on a leaf. One Sunday morning the warm sun came up.',
    segments: [
      'In the light of the moon a little egg lay on a leaf.',
      'One Sunday morning the warm sun came up.',
      'The very hungry caterpillar started to look for some food.',
    ],
  },
  {
    template_id: 'tpl-004',
    title: '语音语调 · 疑问句 & 重读',
    sentence_count: 10,
    phonemes: ['/ɪ/', '/iː/'],
    visibility: 'private',
    preview: 'Is this your seat? Yes, it is. Please sit down and keep it clean.',
    segments: ['Is this your seat?', 'Yes, it is.', 'Please sit down and keep it clean.'],
  },
]

// ---------------- 登录 ----------------

function mockLogin(body: any) {
  const { user_type, stu_id, password } = body ?? {}
  if (password !== '123456') throw new ApiError('账号或密码错误', 401, '401', { detail: '账号或密码错误' })
  if (user_type === 'Teacher') {
    if (stu_id !== 'teacher') throw new ApiError('账号或密码错误', 401, '401', { detail: '账号或密码错误' })
    return {
      access_token: 'mock-teacher-token',
      token_type: 'bearer',
      must_change_password: false,
      user: { user_id: 'mock-teacher-1', user_type: 'Teacher' },
    }
  }
  if (user_type === 'Student') {
    if (stu_id !== 'student') throw new ApiError('账号或密码错误', 401, '401', { detail: '账号或密码错误' })
    return {
      access_token: 'mock-student-token',
      token_type: 'bearer',
      must_change_password: false,
      user: { user_id: 'mock-student-1', user_type: 'Student' },
    }
  }
  if (user_type === 'Admin') {
    if (stu_id !== 'admin') throw new ApiError('账号或密码错误', 401, '401', { detail: '账号或密码错误' })
    return {
      access_token: 'mock-admin-token',
      token_type: 'bearer',
      must_change_password: false,
      user: { user_id: 'mock-admin-1', user_type: 'Admin' },
    }
  }
  throw new ApiError('账号或密码错误', 401, '401', { detail: '账号或密码错误' })
}

function currentUserDetail() {
  try {
    const raw = localStorage.getItem('session')
    const session = raw ? JSON.parse(raw) : null
    const userType = String(session?.user_type ?? 'student')
    const isTeacher = userType === 'teacher'
    const isAdmin = userType === 'admin'
    const isStudent = !isTeacher && !isAdmin
    return {
      ok: true,
      data: {
        user_id: isAdmin ? 100 : isTeacher ? 99 : 1,
        user_type: isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student',
        username: isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student',
        school: { school_id: 'ecnu', school_name: '华东师范大学' },
        is_active: true,
        gender: null,
        email: null,
        phone: null,
        avatar_url: null,
        created_at: '2026-03-01 08:00:00',
        updated_at: '2026-08-01 08:00:00',
        stu_id: isStudent ? 'STU2024001' : null,
        staff_id: isTeacher ? 'TCH2024001' : isAdmin ? 'ADM2024001' : null,
        language: 'fr',
        classes: isStudent
          ? CLASSES.map((c) => ({ class_id: c.class_id, class_name: c.class_name, grade_level: c.grade_level }))
          : [],
        is_root: false,
      },
    }
  } catch {
    return { ok: true, data: null }
  }
}

// ---------------- 路由匹配 ----------------

function route(re: RegExp, p: string): RegExpMatchArray | null {
  return p.match(re)
}

// ---------------- Mock 音频 ----------------

// 真实后端返回的是录音二进制流，Mock 下没有真实录音。
// 这里按路径生成一段可解码的短 WAV 提示音，避免播放器报「音频播放失败」。
// 标准录音与我的录音使用不同音高，便于在无后端时区分两个播放入口。
export function createMockAudioBlob(path: string): Blob {
  const sampleRate = 8000
  const totalSamples = 40000 // 约 5 秒，需覆盖 mock 单词的 start_ms + duration_ms 区间
  const frequency = path.includes('sentence_stdaudio') ? 660 : 440
  const bytes = new Uint8Array(44 + totalSamples * 2)
  const view = new DataView(bytes.buffer)

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }

  // WAV 头（PCM 16bit 单声道）
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + totalSamples * 2, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, totalSamples * 2, true)

  for (let i = 0; i < totalSamples; i += 1) {
    // 首尾淡入淡出，避免爆音
    const fade = Math.min(1, i / 240, (totalSamples - i) / 240)
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.35 * fade
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true)
  }

  return new Blob([bytes], { type: 'audio/wav' })
}

export async function resolveMock(
  method: string,
  path: string,
  query: Record<string, string | number | boolean | undefined | null> = {},
  body?: unknown,
): Promise<unknown | null> {
  if (!import.meta.env.DEV) return null

  const p = `/${path.replace(/^\/+/, '')}`
  const m = method.toUpperCase()
  const q: Record<string, string> = {}
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q[k] = String(v)
  })

  await sleep(150)

  // ---------- 认证 ----------
  if (m === 'POST' && p === '/auth/login') return mockLogin(body)
  if (m === 'POST' && p === '/auth/logout') return { ok: true }
  if (m === 'PUT' && p === '/auth/users/edit_password') {
    return { ok: true, access_token: 'mock-token', token_type: 'bearer', must_change_password: false }
  }
  if (m === 'GET' && p === '/auth/institute/all') {
    return { ok: true, data: { items: SCHOOLS } }
  }
  if (m === 'GET' && p === '/auth/institute/search') {
    const kw = (q.key_word ?? '').toLowerCase()
    return { ok: true, data: { items: SCHOOLS.filter((s) => s.school_name.toLowerCase().includes(kw)) } }
  }
  if (m === 'GET' && p === '/auth/users/user_detail') return currentUserDetail()

  // ---------- 学生端 ----------
  if (m === 'GET' && p === '/student/basic_information') {
    return {
      class_cnt: 1,
      info: [{ class_id: 'mock-class-001', class_name: '法语 A 班', teacher_name: '张老师', language: 'fr' }],
    }
  }
  if (m === 'GET' && p === '/student/tasks') {
    return { ok: true, data: STUDENT_TASKS }
  }
  if (m === 'GET' && p === '/student/task_detail') {
    const task = TASKS.find((t) => t.task_id === q.task_id) ?? TASKS[0]
    return {
      ok: true,
      data: {
        task_id: task.task_id,
        course: task.course,
        task_type: task.task_type,
        language_type: 'fr',
        title: task.title,
        segments: task.segments,
        notes: task.notes,
        max_attempt: task.max_attempt,
        target_phoneme: task.target_phoneme,
        is_active: true,
        created_at: '2026-08-01T00:00:00',
        updated_at: '2026-08-01T00:00:00',
        available_from: task.available_from,
        available_until: task.available_until,
      },
    }
  }
  if (m === 'GET' && p === '/student/task') {
    // task-2 仅一次提交，用于验证「仅一次尝试直接展示」；其余任务返回多次提交
    if (q.task_id === 'task-2') return { tasks: SESSION_RECORDS.slice(1, 2) }
    return { tasks: SESSION_RECORDS.slice(0, 2) }
  }
  if (m === 'GET' && p === '/student/session') {
    return {
      success: true,
      details: [
        {
          eval_id: 'eval-1',
          audio_file_id: null,
          line_number: 1,
          sentence_text:
            "Bonjour, je m'appelle Marie et je suis très heureuse de vous rencontrer aujourd'hui.",
          pronunciation: 88,
          rhythm: 90,
          fluency: 86,
          completeness: 92,
          total_score: 89,
          teacher_notes: '',
          created_at: '2026-08-10 10:20:00',
          // start_ms / duration_ms 与后端保持一致，单位为 ticks（1ms = 10000 ticks）
          words: [
            { word: 'Bonjour', pronunciation: 92, overall: 92, error_type: 'None', start_ms: 0, duration_ms: 4600000, phonemes: [{ phoneme: 'b', pronunciation: 95 }, { phoneme: 'ɔ̃', pronunciation: 88 }, { phoneme: 'ʒ', pronunciation: 93 }, { phoneme: 'u', pronunciation: 90 }, { phoneme: 'ʁ', pronunciation: 74 }] },
            { word: 'je', pronunciation: 90, overall: 90, error_type: 'None', start_ms: 5000000, duration_ms: 1200000, phonemes: [{ phoneme: 'ʒ', pronunciation: 90 }, { phoneme: 'ə', pronunciation: 88 }] },
            { word: "m'appelle", pronunciation: 76, overall: 75, error_type: 'Mispronunciation', start_ms: 6600000, duration_ms: 4600000, phonemes: [{ phoneme: 'm', pronunciation: 92 }, { phoneme: 'a', pronunciation: 85 }, { phoneme: 'p', pronunciation: 88 }, { phoneme: 'ɛ', pronunciation: 62 }, { phoneme: 'l', pronunciation: 90 }] },
            { word: 'Marie', pronunciation: 88, overall: 88, error_type: 'None', start_ms: 11600000, duration_ms: 3800000, phonemes: [{ phoneme: 'm', pronunciation: 90 }, { phoneme: 'a', pronunciation: 88 }, { phoneme: 'ʁ', pronunciation: 71 }, { phoneme: 'i', pronunciation: 92 }] },
            { word: 'et', pronunciation: 91, overall: 91, error_type: 'None', start_ms: 15800000, duration_ms: 1200000, phonemes: [{ phoneme: 'e', pronunciation: 94 }] },
            { word: 'je', pronunciation: 89, overall: 89, error_type: 'None', start_ms: 17400000, duration_ms: 1200000, phonemes: [{ phoneme: 'ʒ', pronunciation: 89 }, { phoneme: 'ə', pronunciation: 87 }] },
            { word: 'suis', pronunciation: 85, overall: 85, error_type: 'None', start_ms: 19000000, duration_ms: 2600000, phonemes: [{ phoneme: 's', pronunciation: 88 }, { phoneme: 'ɥ', pronunciation: 70 }, { phoneme: 'i', pronunciation: 92 }] },
            { word: 'très', pronunciation: 62, overall: 62, error_type: 'Mispronunciation', start_ms: 22000000, duration_ms: 2400000, phonemes: [{ phoneme: 't', pronunciation: 85 }, { phoneme: 'ʁ', pronunciation: 58 }, { phoneme: 'ɛ', pronunciation: 65 }] },
            { word: 'heureuse', pronunciation: 84, overall: 84, error_type: 'None', start_ms: 24800000, duration_ms: 4200000, phonemes: [{ phoneme: 'ø', pronunciation: 80 }, { phoneme: 'ʁ', pronunciation: 72 }, { phoneme: 'z', pronunciation: 90 }] },
            { word: 'de', pronunciation: 93, overall: 93, error_type: 'None', start_ms: 29400000, duration_ms: 1100000, phonemes: [{ phoneme: 'd', pronunciation: 94 }, { phoneme: 'ə', pronunciation: 92 }] },
            { word: 'vous', pronunciation: 55, overall: 55, error_type: 'Mispronunciation', start_ms: 30900000, duration_ms: 2200000, phonemes: [{ phoneme: 'v', pronunciation: 82 }, { phoneme: 'u', pronunciation: 48 }] },
            { word: 'rencontrer', pronunciation: 80, overall: 80, error_type: 'None', start_ms: 33500000, duration_ms: 4800000, phonemes: [{ phoneme: 'ʁ', pronunciation: 75 }, { phoneme: 'ɑ̃', pronunciation: 78 }] },
            { word: "aujourd'hui", pronunciation: 72, overall: 72, error_type: 'Mispronunciation', start_ms: 38700000, duration_ms: 5200000, phonemes: [{ phoneme: 'o', pronunciation: 88 }, { phoneme: 'ʒ', pronunciation: 65 }, { phoneme: 'd', pronunciation: 90 }] },
          ],
        },
        {
          eval_id: 'eval-2',
          audio_file_id: null,
          line_number: 2,
          sentence_text: "Je m'appelle Marie.",
          pronunciation: 84,
          rhythm: 85,
          fluency: 82,
          completeness: 88,
          total_score: 85,
          teacher_notes: '',
          created_at: '2026-08-10 10:21:00',
          words: [
            { word: 'Je', pronunciation: 90, overall: 90, error_type: 'None', start_ms: 0, duration_ms: 2600000, phonemes: [{ phoneme: 'ʒ', pronunciation: 90 }, { phoneme: 'ə', pronunciation: 88 }] },
            { word: "m'appelle", pronunciation: 76, overall: 75, error_type: 'Mispronunciation', start_ms: 3000000, duration_ms: 7200000, phonemes: [{ phoneme: 'm', pronunciation: 92 }, { phoneme: 'a', pronunciation: 85 }, { phoneme: 'p', pronunciation: 88 }, { phoneme: 'ɛ', pronunciation: 62 }, { phoneme: 'l', pronunciation: 90 }] },
            { word: 'Marie', pronunciation: 88, overall: 88, error_type: 'None', start_ms: 10800000, duration_ms: 6200000, phonemes: [{ phoneme: 'm', pronunciation: 90 }, { phoneme: 'a', pronunciation: 88 }, { phoneme: 'ʁ', pronunciation: 71 }, { phoneme: 'i', pronunciation: 92 }] },
          ],
        },
      ],
    }
  }
  if (m === 'GET' && p === '/student/archive/statistics') {
    return {
      success: true,
      statistics: {
        total_entries: 42,
        main_page_entries: 30,
        aufgaben_entries: 12,
        average_score: 85.3,
        max_score: 96,
        latest_activity: '2026-08-12 15:30:00',
      },
    }
  }
  if (m === 'GET' && p === '/student/history/words') {
    return { success: true, words: ['bonjour', 'merci', 'paris', 'apprendre', 'français'] }
  }
  if (m === 'GET' && p === '/student/history/phonemes') {
    return { success: true, phonemes: ['r', 'u', 'e', 'ɛ', 'y'] }
  }
  if (m === 'GET' && p === '/student/history/ranking') {
    return {
      best_words: [{ word: 'merci', score: 94 }, { word: 'bonjour', score: 92 }],
      worst_words: [{ word: 'apprendre', score: 71 }, { word: 'français', score: 74 }],
      best_phonemes: [{ phoneme: 'y', score: 93 }, { phoneme: 'e', score: 90 }],
      worst_phonemes: [{ phoneme: 'r', score: 68 }, { phoneme: 'u', score: 72 }],
    }
  }
  if (route(/^\/student\/history\/word\/(.+)$/, p)) {
    return {
      word: decodeURIComponent(p.split('/word/')[1]),
      average_score: 86,
      max_score: 96,
      min_score: 72,
      count: 8,
      scores: [
        { score: 82, date: '2026-07-20' },
        { score: 85, date: '2026-07-27' },
        { score: 88, date: '2026-08-03' },
        { score: 90, date: '2026-08-10' },
      ],
    }
  }
  if (route(/^\/student\/history\/phoneme\/(.+)$/, p)) {
    return {
      phoneme: decodeURIComponent(p.split('/phoneme/')[1]),
      average_score: 80,
      max_score: 92,
      min_score: 65,
      count: 12,
      scores: [
        { score: 72, date: '2026-07-18' },
        { score: 78, date: '2026-07-25' },
        { score: 82, date: '2026-08-02' },
        { score: 88, date: '2026-08-09' },
      ],
    }
  }
  if (m === 'POST' && p === '/student/pron-test/create_session') {
    return { ok: true, session_id: 'mock-session-1' }
  }
  if (m === 'POST' && p === '/student/pron-test/analyze') {
    return {
      ok: true,
      lang: 'fr',
      core: 'sent',
      evaluation_id: 'eval-mock-1',
      audio_file_id: 'audio-mock-1',
      session_id: 'mock-session-1',
      task_id: String((body as any)?.task_id ?? ''),
      sentence_seq: Number((body as any)?.sentence_seq ?? 0),
      ref_text: String((body as any)?.ref_text ?? ''),
      result_score: {
        total_score: 86,
        accuracy: 84,
        fluency: 86,
        completeness: 90,
        words: [
          { word: 'bonjour', pronunciation: 90, phonemes: [{ phoneme: 'r', pronunciation: 85 }] },
          { word: 'merci', pronunciation: 92, phonemes: [] },
        ],
      },
    }
  }
  if (m === 'POST' && p === '/student/pron-test/submit_session') {
    return { ok: true, session_id: 'mock-session-1', total_score: 86, evaluation_count: 3, average_score: 86 }
  }
  // 参考音频为二进制流：只要命中该路由，requestBlob 即返回 mock 音频 Blob。
  if (m === 'POST' && p === '/student/task/sentence_stdaudio') return { __blob: true }
  if (m === 'POST' && p === '/student/evaluation/audio') return { __blob: true }
  if (route(/^\/student\/custom_content\/detail\/(.+)$/, p)) {
    return {
      session_id: 'mock-session-1',
      total_score: 86,
      submitted_at: '2026-08-10 10:22:00',
      sentences: [
        { sentence_text: 'Bonjour, comment allez-vous ?', pronunciation: 88, rhythm: 90, fluency: 86, completeness: 92, total_score: 89 },
        { sentence_text: "Je m'appelle Marie.", pronunciation: 84, rhythm: 85, fluency: 82, completeness: 88, total_score: 85 },
      ],
    }
  }
  if (route(/^\/student\/custom_content\/problem_areas\/(.+)$/, p)) {
    return {
      weak_phonemes: ['r', 'u'],
      difficult_words: ['apprendre', 'français'],
      problematic_sentences: ['Nous apprenons le français ensemble.'],
    }
  }

  // ---------- 管理员端 ----------
  // 注意：endpoints.ts 里 admin/classes 与 admin/teachers 直接读取数组，
  // 其余 admin 封装多在前端本地组装，因此这里只需返回基础数组/成功标记。
  if (m === 'GET' && p === '/admin/overview') return { ok: true, data: ADMIN_OVERVIEW }
  if (m === 'GET' && p === '/admin/classes') return ADMIN_CLASSES.slice()
  if (m === 'POST' && p === '/admin/class/create') {
    const payload = (body ?? {}) as any
    return {
      class_id: payload.class_id ?? `admin-class-${Date.now()}`,
      class_name: payload.class_name ?? '新建班级',
    }
  }
  if (m === 'POST' && p === '/admin/class/edit') return { success: true }
  if (m === 'POST' && p === '/admin/class/students') {
    const payload = (body ?? {}) as any
    const classId = String(payload.class_id ?? '')
    return ADMIN_STUDENTS.filter((s) => !classId || s.class_id === classId).map((s) => ({
      user_id: s.user_id,
      username: s.username,
      student_id: s.student_id,
    }))
  }
  if (m === 'POST' && p === '/admin/class/students/add') {
    const payload = (body ?? {}) as any
    const incoming = Array.isArray(payload.students) ? payload.students : []
    return incoming.map((_item: any, index: number) => ({ user_id: Date.now() + index }))
  }
  if (m === 'GET' && route(/^\/admin\/class\/([^/]+)\/students$/, p)) {
    const classId = p.split('/')[3]
    const cls = ADMIN_CLASSES.find((c) => c.class_id === classId) ?? ADMIN_CLASSES[0]
    return {
      ok: true,
      data: {
        class_id: cls.class_id,
        class_name: cls.class_name,
        language: cls.language,
        students: ADMIN_STUDENTS.filter((s) => s.class_id === cls.class_id),
      },
    }
  }
  if (m === 'GET' && route(/^\/admin\/class\/([^/]+)$/, p)) {
    const classId = p.split('/')[3]
    const cls = ADMIN_CLASSES.find((c) => c.class_id === classId) ?? ADMIN_CLASSES[0]
    return { ok: true, data: cls }
  }
  if (m === 'POST' && p === '/admin/student/save') {
    const payload = (body ?? {}) as any
    return { ok: true, user_id: payload.user_id ?? `admin-student-${Date.now()}` }
  }
  if (m === 'POST' && p === '/admin/student/change_class') return { ok: true }
  if (m === 'GET' && p === '/admin/students') {
    let items = ADMIN_STUDENTS.slice()
    if (q.key_word) items = items.filter((s) => s.username.includes(q.key_word) || s.student_id.includes(q.key_word))
    if (q.class_id) items = items.filter((s) => s.class_id === q.class_id)
    return { ok: true, data: items }
  }
  if (m === 'GET' && route(/^\/admin\/student\/([^/]+)$/, p)) {
    const userId = p.split('/')[3]
    const stu = ADMIN_STUDENTS.find((s) => String(s.user_id) === userId) ?? ADMIN_STUDENTS[0]
    return { ok: true, data: stu }
  }
  if (m === 'GET' && p === '/admin/teachers') return ADMIN_TEACHERS.slice()
  if (m === 'POST' && p === '/admin/teacher/add') {
    const payload = (body ?? {}) as any
    return { user_id: Date.now(), username: payload.username ?? '新教师' }
  }
  if (m === 'POST' && p === '/admin/teacher/save') {
    const payload = (body ?? {}) as any
    return { ok: true, teacher_id: payload.teacher_id ?? `admin-teacher-${Date.now()}` }
  }
  if (m === 'POST' && p === '/admin/teacher/assign') return { ok: true }
  if (m === 'POST' && p === '/admin/teacher/unassign') return { ok: true }
  if (m === 'POST' && p === '/admin/user/edit') return { success: true }
  if (m === 'POST' && p === '/admin/user/unlink_class') return { success: true }
  if (m === 'GET' && route(/^\/admin\/teacher\/([^/]+)\/assignments$/, p)) {
    const teacherId = p.split('/')[3]
    const teacher = ADMIN_TEACHERS.find((t) => String(t.user_id) === teacherId) ?? ADMIN_TEACHERS[0]
    const assignedIds = new Set((teacher.classes ?? []).map((item) => item.class_id))
    return {
      ok: true,
      data: {
        teacher_id: String(teacher.user_id),
        teacher_name: teacher.username,
        staff_id: teacher.staff_id,
        classes: ADMIN_CLASSES.map((c) => ({
          class_id: c.class_id,
          class_name: c.class_name,
          language: c.language,
          assigned: assignedIds.has(c.class_id),
        })),
      },
    }
  }
  if (m === 'GET' && route(/^\/admin\/teacher\/([^/]+)$/, p)) {
    const teacherId = p.split('/')[3]
    const teacher = ADMIN_TEACHERS.find((t) => String(t.user_id) === teacherId) ?? ADMIN_TEACHERS[0]
    return { ok: true, data: teacher }
  }

  // ---------- 教师端 ----------
  if (m === 'GET' && p === '/teacher/templates') return { ok: true, data: TEACHER_TEMPLATES }
  // 模板库页面走 getTeacherTemplates()：直接返回后端契约数组（BackendTaskTemplate[]）
  if (m === 'GET' && p === '/teacher/task_templates') {
    return TEACHER_TEMPLATES.map((tpl) => ({
      task_template_id: tpl.template_id,
      template_title: tpl.title,
      segments: tpl.segments,
      target_phoneme: tpl.phonemes.length ? tpl.phonemes : null,
      creator: 99,
    }))
  }
  if (m === 'GET' && p === '/teacher/basic_information') {
    return { total_classes: 3, total_students: 72, total_tasks: 30 }
  }
  if (m === 'GET' && p === '/teacher/classes') return CLASSES
  if (m === 'GET' && p === '/teacher/tasks') return TASKS
  if (m === 'POST' && p === '/teacher/class/tasks') {
    return [
      { task_id: 'task-1', title: '法语发音练习 #12', finished_students_count: 20, unfinished_students: [{ user_id: 2, username: 'xiaoming', stu_id: 'STU2024002' }] },
      { task_id: 'task-2', title: '元音发音练习 #11', finished_students_count: 15, unfinished_students: [{ user_id: 1, username: 'student', stu_id: 'STU2024001' }] },
    ]
  }
  if (m === 'POST' && p === '/teacher/class/students') return STUDENTS
  if (m === 'POST' && p === '/teacher/student/basic_information') return SCORE_SUMMARY
  if (m === 'POST' && p === '/teacher/student/records') {
    return [
      {
        task_id: 'task-1',
        title: '法语发音练习 #12',
        records_count: 2,
        records: [
          { session_id: 'session-1', average_score: 88, completed_at: '2026-08-10 10:20:00' },
          { session_id: 'session-3', average_score: 91, completed_at: '2026-08-01 14:05:00' },
        ],
      },
      {
        task_id: 'task-2',
        title: '元音发音练习 #11',
        records_count: 1,
        records: [{ session_id: 'session-2', average_score: 76, completed_at: '2026-08-08 09:15:00' }],
      },
    ]
  }
  if (m === 'POST' && p === '/teacher/task/basic_information') return SCORE_SUMMARY
  if (m === 'POST' && p === '/teacher/task/records') {
    return [
      { user_id: 1, username: 'student', records_count: 2, records: [{ session_id: 'session-1', average_score: 88, completed_at: '2026-08-10 10:20:00' }] },
      { user_id: 3, username: 'xiaohong', records_count: 3, records: [{ session_id: 'session-9', average_score: 93, completed_at: '2026-08-11 16:00:00' }] },
    ]
  }
  if (m === 'POST' && p === '/teacher/task/auto_segment') {
    const text = String((query.text as string) ?? '')
    const sentences = text
      .split(/[.!?。！？]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return { segments: sentences.length ? sentences : SEGMENTS }
  }
  if (m === 'POST' && p === '/teacher/task/save') return { success: true }
  if (m === 'POST' && p === '/teacher/task/delete') return { success: true }
  if (m === 'POST' && p === '/teacher/get_session') {
    return [
      {
        eval_id: 'eval-1',
        audio_file_id: null,
        line_number: 1,
        sentence_text: 'Bonjour, comment allez-vous ?',
        pronunciation: 88,
        rhythm: 90,
        fluency: 86,
        completeness: 92,
        total_score: 89,
        words: [{ word: 'bonjour', pronunciation: 90 }, { word: 'comment', pronunciation: 86 }],
        teacher_notes: '',
        created_at: '2026-08-10 10:20:00',
      },
      {
        eval_id: 'eval-2',
        audio_file_id: null,
        line_number: 2,
        sentence_text: "Je m'appelle Marie.",
        pronunciation: 84,
        rhythm: 85,
        fluency: 82,
        completeness: 88,
        total_score: 85,
        words: [{ word: 'appelle', pronunciation: 80 }, { word: 'Marie', pronunciation: 88 }],
        teacher_notes: '',
        created_at: '2026-08-10 10:21:00',
      },
    ]
  }
  if (m === 'POST' && p === '/teacher/evaluation/audio') {
    return { __blob: true }
  }
  if (m === 'POST' && p === '/teacher/comment') return { success: true }
  if (route(/^\/teacher\/class\/([^/]+)\/manage$/, p)) {
    return {
      class_id: 'mock-class-001',
      class_name: '法语 A 班',
      members: [
        { user_id: 1, username: 'student', stu_id: 'STU2024001', user_type: 'student', joined_at: '2026-03-05' },
        { user_id: 2, username: 'xiaoming', stu_id: 'STU2024002', user_type: 'student', joined_at: '2026-03-06' },
        { user_id: 3, username: 'xiaohong', stu_id: 'STU2024003', user_type: 'student', joined_at: '2026-03-08' },
      ],
    }
  }
  if (route(/^\/teacher\/class\/([^/]+)\/add_student$/, p)) return { success: true }
  if (route(/^\/teacher\/class\/([^/]+)\/remove_student$/, p)) return { success: true }
  if (route(/^\/teacher\/class\/([^/]+)\/student\/([^/]+)\/analysis$/, p)) {
    return {
      student_name: 'student',
      evaluation_count: 5,
      first_evaluation_at: '2026-08-01',
      last_evaluation_at: '2026-08-10',
      dimension_scores: { pronunciation: 82, rhythm: 88, fluency: 86, completeness: 84 },
      weak_phonemes: ['r', 'u'],
      difficult_words: ['apprendre', 'français'],
    }
  }
  if (route(/^\/teacher\/api\/student\/([^/]+)\/progress$/, p)) {
    return {
      student_name: 'student',
      evaluation_count: 5,
      scores: [
        { date: '2026-07-27', pronunciation: 78, rhythm: 82, fluency: 80, completeness: 81 },
        { date: '2026-08-03', pronunciation: 81, rhythm: 84, fluency: 83, completeness: 83 },
        { date: '2026-08-10', pronunciation: 84, rhythm: 88, fluency: 86, completeness: 87 },
      ],
    }
  }

  return null
}
