import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

function hasSession() {
  try {
    const raw = localStorage.getItem('session')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { user_id?: string; user_type?: string }
    return !!parsed?.user_id
  } catch {
    return false
  }
}

function getUserType(): string {
  try {
    const raw = localStorage.getItem('session')
    if (!raw) return ''
    return (JSON.parse(raw) as { user_type?: string }).user_type ?? ''
  } catch {
    return ''
  }
}

function mustChangePassword(): boolean {
  try {
    const raw = localStorage.getItem('session')
    if (!raw) return false
    return !!(JSON.parse(raw) as { must_change_password?: boolean }).must_change_password
  } catch {
    return false
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      meta: { public: true, layout: 'bare' },
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/change-password',
      name: 'change-password',
      meta: { layout: 'bare' },
      component: () => import('../views/ChangePasswordView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/TaskView.vue'),
    },
    {
      path: '/tasks/:taskId/test',
      name: 'task-test',
      component: () => import('../views/placeholders/RecordingView.vue'),
    },
    {
      path: '/teacher',
      component: () => import('../components/teacher/TeacherLayout.vue'),
      children: [
        { path: '', redirect: '/teacher/overview' },
        {
          path: 'overview',
          name: 'teacher-overview',
          component: () => import('../views/teacher/TeacherOverviewView.vue'),
        },
        {
          path: 'content',
          name: 'teacher-content',
          component: () => import('../views/teacher/PracticeManagementView.vue'),
        },
        {
          path: 'exercise',
          name: 'teacher-exercise',
          component: () => import('../views/teacher/PracticeExerciseView.vue'),
        },
        {
          path: 'submissions',
          name: 'teacher-submissions',
          component: () => import('../views/teacher/PracticeSubmissionsView.vue'),
        },
        {
          path: 'grading',
          name: 'teacher-grading',
          component: () => import('../views/teacher/PracticeGradingView.vue'),
        },
        {
          path: 'assignments/create',
          name: 'teacher-create-assignment',
          component: () => import('../views/teacher/CreateAssignmentView.vue'),
        },
      ],
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/placeholders/StudentHistoryView.vue'),
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/placeholders/StudentArchiveView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/placeholders/ProfileView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/placeholders/AboutView.vue'),
    },
    {
      path: '/evaluate/recording',
      name: 'evaluate-recording',
      component: () => import('../views/placeholders/RecordingView.vue'),
    },
    {
      path: '/evaluate/result',
      name: 'evaluate-result',
      component: () => import('../views/placeholders/ResultView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const isPublic = !!to.meta?.public
  if (isPublic) return true
  if (hasSession()) {
    if (mustChangePassword() && to.path !== '/change-password') {
      return { path: '/change-password', query: { redirect: to.fullPath } }
    }
    if (!mustChangePassword() && to.path === '/change-password') {
      return { path: getUserType() === 'teacher' ? '/teacher/overview' : '/' }
    }
    if (to.path === '/') {
      const userType = getUserType()
      if (userType === 'teacher') return { path: '/teacher/overview' }
    }
    return true
  }
  return { path: '/login', query: { redirect: to.fullPath } }
})

export default router
