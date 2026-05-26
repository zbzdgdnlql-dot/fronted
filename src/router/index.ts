import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

function hasSession() {
  try {
    const raw = localStorage.getItem('session')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { user_id?: string }
    return !!parsed?.user_id
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
      redirect: '/teacher/content',
    },
    {
      path: '/teacher/overview',
      name: 'teacher-overview',
      component: () => import('../views/TeacherOverviewView.vue'),
    },
    {
      path: '/teacher/content',
      name: 'teacher-content',
      component: () => import('../views/teacher/PracticeManagementView.vue'),
    },
    {
      path: '/teacher/submissions',
      name: 'teacher-submissions',
      component: () => import('../views/teacher/PracticeSubmissionsView.vue'),
    },
    {
      path: '/teacher/grading',
      name: 'teacher-grading',
      component: () => import('../views/teacher/PracticeGradingView.vue'),
    },
    {
      path: '/teacher/assignments/create',
      name: 'teacher-create-assignment',
      component: () => import('../views/teacher/CreateAssignmentView.vue'),
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
  if (hasSession()) return true
  return { path: '/login', query: { redirect: to.fullPath } }
})

export default router
