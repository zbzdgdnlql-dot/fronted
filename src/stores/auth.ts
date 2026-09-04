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
  must_change_password?: boolean
  class_context?: ClassContext
  class_contexts?: ClassContext[]
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
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('token')
  }
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

const state = reactive<{ session: Session | null }>({
  session: loadSession(),
})

export function useAuth() {
  const isAuthed = computed(() => !!state.session?.user_id)
  const userType = computed(() => state.session?.user_type)
  const mustChangePassword = computed(() => !!state.session?.must_change_password)
  const className = computed(() => state.session?.class_context?.class_name)
  const classContexts = computed(() => state.session?.class_contexts ?? (state.session?.class_context ? [state.session.class_context] : []))

  const setSession = (session: Session) => {
    state.session = session
    persistSession(session)
  }

  const setCurrentClass = (classId: string) => {
    if (!state.session) return
    const nextClass = classContexts.value.find((item) => item.class_id === classId)
    if (!nextClass) return
    state.session = {
      ...state.session,
      class_context: nextClass,
      class_contexts: classContexts.value,
    }
    persistSession(state.session)
  }

  const markPasswordChanged = () => {
    if (!state.session) return
    state.session = {
      ...state.session,
      must_change_password: false,
    }
    persistSession(state.session)
  }

  const clearSession = () => {
    state.session = null
    persistSession(null)
  }

  return {
    session: computed(() => state.session),
    isAuthed,
    userType,
    mustChangePassword,
    className,
    classContexts,
    setSession,
    setCurrentClass,
    markPasswordChanged,
    clearSession,
  }
}
