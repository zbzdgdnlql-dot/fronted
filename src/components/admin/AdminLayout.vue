<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminSideNav from './AdminSideNav.vue'
import TeacherTopBar from '../teacher/TeacherTopBar.vue'

const route = useRoute()

const topLevelTitles: Record<string, string> = {
  '/admin/overview': '总览',
  '/admin/classes': '班级管理',
  '/admin/teachers': '教师管理',
  '/admin/students': '学生管理',
}

const isTopLevel = computed(() => route.path in topLevelTitles)
const showBack = computed(() => !isTopLevel.value)

const pageTitle = computed(() => {
  const path = route.path
  if (topLevelTitles[path]) return topLevelTitles[path]
  if (path === '/admin/classes/create') return '创建班级'
  if (/^\/admin\/classes\/[^/]+\/edit$/.test(path)) return '编辑班级信息'
  if (/^\/admin\/classes\/[^/]+\/students\/add$/.test(path)) return '添加学生'
  if (path === '/admin/teachers/create') return '创建教师'
  if (/^\/admin\/teachers\/[^/]+\/edit$/.test(path)) return '编辑教师信息'
  if (/^\/admin\/teachers\/[^/]+\/assign$/.test(path)) return '分配班级'
  if (/^\/admin\/teachers\/[^/]+\/unassign$/.test(path)) return '解除班级分配'
  if (/^\/admin\/students\/[^/]+\/edit$/.test(path)) return '编辑学生信息'
  if (/^\/admin\/students\/[^/]+\/change-class$/.test(path)) return '更改学生班级'
  return ''
})
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[#F8FAFB]">
    <TeacherTopBar
      :title="pageTitle"
      :show-back="showBack"
      badge="管理员端"
    />
    <div class="flex flex-1 overflow-hidden">
      <AdminSideNav />
      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
