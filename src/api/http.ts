import { ApiError } from './errors'
import { resolveMock } from './mock'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions = {
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined | null>
  headers?: Record<string, string>
  body?: unknown
  timeoutMs?: number
  signal?: AbortSignal
  credentials?: RequestCredentials
}

export type ApiClientConfig = {
  baseUrl: string
  timeoutMs: number
  getToken: () => string | null
  onUnauthorized?: () => void
}

const defaultConfig: ApiClientConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api',
  timeoutMs: 10_000,
  getToken: () => localStorage.getItem('token'),
}

let clientConfig: ApiClientConfig = defaultConfig

export function configureApiClient(partial: Partial<ApiClientConfig>) {
  clientConfig = { ...clientConfig, ...partial }
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const base = clientConfig.baseUrl.replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  const url = new URL(`${base}${cleanPath}`, origin)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      url.searchParams.set(k, String(v))
    })
  }
  if (clientConfig.baseUrl) return url.toString()
  return `${cleanPath}${url.search ? url.search : ''}`
}

function withTimeout(timeoutMs: number, signal?: AbortSignal) {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId)
      if (signal) signal.removeEventListener('abort', onAbort)
    },
  }
}

async function parseResponseBody(res: Response) {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return res.json()
  const text = await res.text()
  return text || null
}

function messageFromStatus(status: number) {
  if (status === 400) return '请求参数错误'
  if (status === 401) return '登录已过期，请重新登录'
  if (status === 403) return '没有权限执行该操作'
  if (status === 404) return '资源不存在或无权访问'
  if (status >= 500) return '服务器异常，请稍后重试'
  return '请求失败，请稍后重试'
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const url = buildUrl(path, options.query)

  // 本地 Mock 仅在显式开启 VITE_ENABLE_MOCK=true 时生效；默认走真实后端
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const mock = await resolveMock(method, path, options.query, options.body)
    if (mock !== null) return mock as T
  }

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  const token = clientConfig.getToken()
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined && method !== 'GET') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    body = headers['Content-Type'].includes('application/json') ? JSON.stringify(options.body) : (options.body as any)
  }

  const { signal, cleanup } = withTimeout(options.timeoutMs ?? clientConfig.timeoutMs, options.signal)

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal,
      credentials: options.credentials ?? 'same-origin',
    })

    if (res.status >= 200 && res.status < 400) {
      return (await parseResponseBody(res)) as T
    }

    const parsed = await parseResponseBody(res).catch(() => null)
    if (res.status === 401) clientConfig.onUnauthorized?.()

    const message =
      typeof parsed === 'object' && parsed && 'message' in (parsed as any)
        ? String((parsed as any).message)
        : typeof parsed === 'object' && parsed && 'detail' in (parsed as any)
          ? Array.isArray((parsed as any).detail)
            ? (parsed as any).detail.map((item: any) => item?.msg ?? String(item)).join('；')
            : String((parsed as any).detail)
          : messageFromStatus(res.status)

    const code =
      typeof parsed === 'object' && parsed && 'code' in (parsed as any) ? String((parsed as any).code) : undefined

    throw new ApiError(message, res.status, code, parsed)
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new ApiError('请求超时，请检查网络后重试', 0)
    if (err instanceof ApiError) throw err
    throw new ApiError('网络异常，请检查网络后重试', 0, undefined, err)
  } finally {
    cleanup()
  }
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const method = options.method ?? 'GET'
  const url = buildUrl(path, options.query)

  // 本地 Mock 仅在显式开启 VITE_ENABLE_MOCK=true 时生效；默认走真实后端
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const mock = await resolveMock(method, path, options.query, options.body)
    if (mock !== null) return new Blob(['mock-audio'], { type: 'audio/mpeg' })
  }

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  const token = clientConfig.getToken()
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined && method !== 'GET') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    body = headers['Content-Type'].includes('application/json') ? JSON.stringify(options.body) : (options.body as any)
  }

  const { signal, cleanup } = withTimeout(options.timeoutMs ?? clientConfig.timeoutMs, options.signal)

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal,
      credentials: options.credentials ?? 'same-origin',
    })

    if (res.status >= 200 && res.status < 400) return await res.blob()

    const parsed = await parseResponseBody(res).catch(() => null)
    if (res.status === 401) clientConfig.onUnauthorized?.()

    const message =
      typeof parsed === 'object' && parsed && 'message' in (parsed as any)
        ? String((parsed as any).message)
        : typeof parsed === 'object' && parsed && 'detail' in (parsed as any)
          ? Array.isArray((parsed as any).detail)
            ? (parsed as any).detail.map((item: any) => item?.msg ?? String(item)).join('；')
            : String((parsed as any).detail)
          : messageFromStatus(res.status)

    const code =
      typeof parsed === 'object' && parsed && 'code' in (parsed as any) ? String((parsed as any).code) : undefined

    throw new ApiError(message, res.status, code, parsed)
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new ApiError('请求超时，请检查网络后重试', 0)
    if (err instanceof ApiError) throw err
    throw new ApiError('网络异常，请检查网络后重试', 0, undefined, err)
  } finally {
    cleanup()
  }
}
