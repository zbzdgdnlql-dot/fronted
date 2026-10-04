import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../api/endpoints', () => ({
  analyzeStudentPronTest: vi.fn(),
  createStudentTestSession: vi.fn(),
  getSentenceStdAudio: vi.fn(),
  getStudentBasicInformation: vi.fn(async () => ({
    class_cnt: 1,
    info: [{ class_id: 'class-1', class_name: 'French', teacher_name: 'Teacher', language: 'fr' }],
  })),
  submitStudentTestSession: vi.fn(),
}))

vi.mock('../../../composables/useToast', () => ({
  useToast: () => ({ push: vi.fn() }),
}))

vi.mock('../../../stores/auth', () => ({
  useAuth: () => ({ session: { value: null } }),
}))

import { createStudentTestSession } from '../../../api/endpoints'
import { useHomeEvaluation } from '../useHomeEvaluation'

describe('useHomeEvaluation', () => {
  beforeEach(() => {
    vi.mocked(createStudentTestSession).mockReset()
    vi.mocked(createStudentTestSession).mockResolvedValue({ ok: true, session_id: 'session-1' })
  })

  afterEach(() => {
    useHomeEvaluation().resetAll()
  })

  it('finishes local sentence splitting while reference audio is still preparing', async () => {
    vi.mocked(createStudentTestSession).mockImplementation(() => new Promise(() => {}))
    const evaluation = useHomeEvaluation()
    evaluation.textContent.value = 'Bonjour. Salut.'

    const splitResult = evaluation.splitSentences().then(() => 'finished' as const)
    const result = await Promise.race([
      splitResult,
      new Promise<'blocked'>((resolve) => setTimeout(() => resolve('blocked'), 0)),
    ])

    expect(result).toBe('finished')
    expect(evaluation.sentences.value).toEqual(['Bonjour.', 'Salut.'])
    expect(evaluation.ttsPreparing.value).toBe(true)
  })
})
