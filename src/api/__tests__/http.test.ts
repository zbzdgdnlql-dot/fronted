import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from '../errors'
import { configureApiClient, request } from '../http'

describe('api/http', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns parsed JSON on 200', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    globalThis.fetch = mockFetch as any

    configureApiClient({
      baseUrl: '',
      timeoutMs: 10_000,
      getToken: () => null,
    })

    const res = await request<{ ok: boolean }>('/ping')
    expect(res.ok).toBe(true)
  })

  it('throws ApiError and triggers onUnauthorized on 401', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ message: '未授权' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    })
    globalThis.fetch = mockFetch as any

    const onUnauthorized = vi.fn()
    configureApiClient({
      baseUrl: '',
      timeoutMs: 10_000,
      getToken: () => null,
      onUnauthorized,
    })

    await expect(request('/need-auth')).rejects.toBeInstanceOf(ApiError)
    await expect(request('/need-auth')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalled()
  })

  it('throws ApiError on 500', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response('server error', { status: 500, headers: { 'content-type': 'text/plain' } })
    })
    globalThis.fetch = mockFetch as any

    configureApiClient({
      baseUrl: '',
      timeoutMs: 10_000,
      getToken: () => null,
    })

    await expect(request('/oops')).rejects.toMatchObject({ status: 500 })
  })
})

