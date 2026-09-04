<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import TeacherSideNav from './TeacherSideNav.vue'
import TeacherTopBar from './TeacherTopBar.vue'
import SelectClassModal from '../../views/teacher/components/SelectClassModal.vue'

const route = useRoute()
const router = useRouter()

const showStatisticsPicker = ref(false)

const showBack = computed(() => {
  if (route.path.startsWith('/teacher/statistics')) return false
  return route.path !== '/teacher/overview' && route.path !== '/teacher/content'
})

const pageTitle = computed(() => {
  if (route.path.startsWith('/teacher/statistics')) return '数据统计'
  const map: Record<string, string> = {
    '/teacher/overview': '概览',
    '/teacher/content': '内容管理',
    '/teacher/exercise': '练习管理',
    '/teacher/assignments/create': '创建作业',
    '/teacher/submissions': '批改作业',
    '/teacher/grading': '批改',
  }
  return map[route.path] ?? ''
})

const openStatistics = () => {
  showStatisticsPicker.value = true
}

const closeStatistics = () => {
  showStatisticsPicker.value = false
}

const selectStatisticsClass = (classId: string) => {
  showStatisticsPicker.value = false
  router.push(`/teacher/statistics/${classId}`)
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[#F8FAFB]">
    <TeacherTopBar
      :title="pageTitle"
      :show-back="showBack"
    />
    <div class="flex flex-1 overflow-hidden">
      <TeacherSideNav @open-statistics="openStatistics" />
      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>

    <SelectClassModal
      :open="showStatisticsPicker"
      @close="closeStatistics"
      @select="selectStatisticsClass"
    />
  </div>
</template>
