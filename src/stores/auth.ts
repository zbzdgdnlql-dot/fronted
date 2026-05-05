import { reactive, computed } from 'vue'

export type ClassContext = {
  class_id: string
  class_name: string
  teacher_name: string
}

export type UserType = 'student' | 'teacher' | 'admin' | 'guest' | string

export type Session = {
  user_id: string
  user_type: UserType
  class_context?: ClassContext
}

const STORAGE_KEY = 'session'

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function persistSession(session: Session | null) {
  if (!session) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

const state = reactive<{ session: Session | null }>({
  session: loadSession(),
})

export function useAuth() {
  const isAuthed = computed(() => !!state.session?.user_id)
  const userType = computed(() => state.session?.user_type)
  const className = computed(() => state.session?.class_context?.class_name)

  const setSession = (session: Session) => {
    state.session = session
    persistSession(session)
  }

  const clearSession = () => {
    state.session = null
    persistSession(null)
  }

  return {
    session: computed(() => state.session),
    isAuthed,
    userType,
    className,
    setSession,
    clearSession,
  }
}

