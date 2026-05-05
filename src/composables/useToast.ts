import { reactive, readonly } from 'vue'

export type ToastLevel = 'info' | 'success' | 'warning' | 'error'

export type ToastItem = {
  id: string
  level: ToastLevel
  message: string
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useToast() {
  const push = (message: string, level: ToastLevel = 'info', ttlMs = 4000) => {
    const id = uid()
    state.items.push({ id, level, message })
    window.setTimeout(() => dismiss(id), ttlMs)
    return id
  }

  const dismiss = (id: string) => {
    const idx = state.items.findIndex((t) => t.id === id)
    if (idx >= 0) state.items.splice(idx, 1)
  }

  return {
    items: readonly(state.items),
    push,
    dismiss,
  }
}

