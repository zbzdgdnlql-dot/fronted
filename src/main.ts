import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { configureApiClient } from './api/http'
import { useAuth } from './stores/auth'

if (import.meta.env.DEV) {
  const raw = localStorage.getItem('session')
  if (!raw) {
    localStorage.setItem('session', JSON.stringify({
      user_id: 'mock-teacher-user',
      user_type: 'teacher',
      class_context: {
        class_id: 'mock-class-001',
        class_name: '测试班级 A',
        teacher_name: '张老师',
      },
    }))
  }
}

const app = createApp(App)
app.use(router)

configureApiClient({
  onUnauthorized: () => {
    const auth = useAuth()
    auth.clearSession()
    router.push({ path: '/login', query: { reason: 'unauthorized' } }).catch(() => {})
  },
})

app.mount('#app')
