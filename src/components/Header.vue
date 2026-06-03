<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useAuth } from '../stores/auth'
import { logout as apiLogout } from '../api/endpoints'
import { useToast } from '../composables/useToast'
import UserAccountMenu from './UserAccountMenu.vue'
import router from '../router'

const route = useRoute()
const auth = useAuth()
const toast = useToast()
const classMenuOpen = ref(false)

const studentLinks = [
  { name: '主页', path: '/' },
  { name: '任务', path: '/tasks' },
  { name: '历史记录', path: '/history' },
  { name: '档案资料', path: '/archive' },
  { name: '个人中心', path: '/profile' },
  { name: '关于', path: '/about' },
] as const

const teacherLinks = [
  { name: '概览', path: '/teacher/overview' },
  { name: '内容管理', path: '/teacher/content' },
  { name: '关于', path: '/about' },
] as const

const navLinks = computed(() => (auth.userType.value === 'teacher' ? teacherLinks : studentLinks))
const showClassSwitcher = computed(() => auth.userType.value === 'student' && auth.classContexts.value.length > 0)

const isActive = (path: string) => {
  if (path.startsWith('/teacher')) return route.path.startsWith('/teacher')
  return route.path === path
}

const onLogout = async () => {
  try {
    await apiLogout()
  } catch {}
  auth.clearSession()
  toast.push('已退出登录', 'success')
  router.push('/login')
}

const toggleClassMenu = () => {
  if (!showClassSwitcher.value) return
  classMenuOpen.value = !classMenuOpen.value
}

const selectClass = (classId: string) => {
  auth.setCurrentClass(classId)
  classMenuOpen.value = false
  toast.push('已切换班级', 'success')
}

const closeClassMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-class-switcher]')) classMenuOpen.value = false
}

document.addEventListener('click', closeClassMenu)
onBeforeUnmount(() => {
  document.removeEventListener('click', closeClassMenu)
})
</script>

<template>
  <header class="w-full bg-white border-b border-[#F2F4F7] h-[72px] px-6 flex items-center justify-between shadow-sm">
    <!-- Logo Area -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-sm shadow-green-100">
        <img src="../assets/figma/link.svg" alt="Logo" class="w-full h-full object-cover" />
      </div>
      <h1 class="text-xl font-bold text-gray-900 tracking-tight">AI法语</h1>
    </div>

    <!-- Navigation -->
    <nav class="hidden md:flex items-center gap-8">
      <router-link 
        v-for="link in navLinks" 
        :key="link.name" 
        :to="link.path" 
        :class="[
          'text-[15px] font-bold transition-colors',
          isActive(link.path) ? 'text-[#70C125]' : 'text-gray-400 hover:text-gray-600'
        ]"
      >
        {{ link.name }}
      </router-link>
    </nav>

    <!-- Right Area: Class Label & User Avatar -->
    <div class="flex items-center gap-4">
      <div v-if="showClassSwitcher" data-class-switcher class="relative hidden lg:block">
        <button
          type="button"
          class="flex items-center gap-2 border-2 border-[#70C125] px-4 py-1.5 rounded-xl bg-white hover:bg-[#F4FAEE] transition-colors"
          @click.stop="toggleClassMenu"
        >
          <span class="max-w-40 truncate text-sm font-black text-[#70C125] tracking-wide">{{ auth.className.value }}</span>
          <span class="text-xs font-black text-[#70C125]">{{ classMenuOpen ? '▲' : '▼' }}</span>
        </button>

        <div
          v-if="classMenuOpen"
          class="absolute right-0 top-[calc(100%+8px)] z-30 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg"
        >
          <button
            v-for="item in auth.classContexts.value"
            :key="item.class_id"
            type="button"
            class="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-[#F8F9FA]"
            :class="item.class_id === auth.session.value?.class_context?.class_id ? 'bg-[#F4FAEE]' : 'bg-white'"
            @click="selectClass(item.class_id)"
          >
            <span class="text-sm font-black text-gray-900">{{ item.class_name }}</span>
            <span v-if="item.teacher_name" class="text-xs font-bold text-gray-400">教师：{{ item.teacher_name }}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="hidden md:inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
        @click="onLogout"
      >
        退出
      </button>

      <UserAccountMenu />
    </div>
  </header>
</template>
