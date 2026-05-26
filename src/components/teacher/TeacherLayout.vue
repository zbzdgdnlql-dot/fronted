<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import TeacherSideNav from './TeacherSideNav.vue'
import TeacherTopBar from './TeacherTopBar.vue'

const route = useRoute()

const showSideNav = computed(() => route.path === '/teacher/overview')
const showBack = computed(() => route.path !== '/teacher/overview' && route.path !== '/teacher/content')

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    '/teacher/overview': '概览',
    '/teacher/content': '内容管理',
    '/teacher/exercise': '练习管理',
    '/teacher/assignments/create': '创建作业',
    '/teacher/submissions': '练习提交',
    '/teacher/grading': '批改',
  }
  return map[route.path] ?? ''
})
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[#F8FAFB]">
    <TeacherTopBar
      :title="pageTitle"
      :show-back="showBack"
    />
    <div class="flex flex-1 overflow-hidden">
      <TeacherSideNav v-if="showSideNav" />
      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
