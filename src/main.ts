import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { configureApiClient } from './api/http'
import { useAuth } from './stores/auth'

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
