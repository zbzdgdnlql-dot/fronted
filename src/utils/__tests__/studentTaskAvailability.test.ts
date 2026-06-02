import { describe, expect, it, vi } from 'vitest'
import { getStudentTaskAvailability } from '../studentTaskAvailability'

describe('getStudentTaskAvailability', () => {
  const now = new Date('2026-06-02T12:00:00+08:00')

  it('blocks inactive tasks before checking time or attempts', () => {
    expect(getStudentTaskAvailability({
      isActive: false,
      availableFrom: '2026-06-01T00:00:00+08:00',
      availableUntil: '2026-06-03T00:00:00+08:00',
      maxAttempts: 1,
      attemptCount: 0,
    })).toBe('inactive')
  })

  it('reports not started and ended windows', () => {
    vi.setSystemTime(now)
    expect(getStudentTaskAvailability({
      isActive: true,
      availableFrom: '2026-06-03T00:00:00+08:00',
      availableUntil: '2026-06-04T00:00:00+08:00',
      maxAttempts: 1,
      attemptCount: 0,
    })).toBe('not_started')

    expect(getStudentTaskAvailability({
      isActive: true,
      availableFrom: '2026-06-01T00:00:00+08:00',
      availableUntil: '2026-06-02T00:00:00+08:00',
      maxAttempts: 1,
      attemptCount: 0,
    })).toBe('ended')
    vi.useRealTimers()
  })

  it('blocks when max attempts are exhausted', () => {
    vi.setSystemTime(now)
    expect(getStudentTaskAvailability({
      isActive: true,
      availableFrom: '2026-06-01T00:00:00+08:00',
      availableUntil: '2026-06-03T00:00:00+08:00',
      maxAttempts: 2,
      attemptCount: 2,
    })).toBe('attempts_exhausted')
    vi.useRealTimers()
  })

  it('treats null or zero max attempts as unlimited', () => {
    vi.setSystemTime(now)
    expect(getStudentTaskAvailability({
      isActive: true,
      maxAttempts: null,
      attemptCount: 99,
    })).toBe('open')
    expect(getStudentTaskAvailability({
      isActive: true,
      maxAttempts: 0,
      attemptCount: 99,
    })).toBe('open')
    vi.useRealTimers()
  })
})
