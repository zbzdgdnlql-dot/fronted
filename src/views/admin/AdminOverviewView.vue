<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  School,
  Users,
  GraduationCap,
  Bell,
  Plus,
  UserPlus,
  Settings2,
  CheckCircle,
  Database,
} from 'lucide-vue-next'
import { getAdminOverview, type AdminOverviewActivity, type AdminOverviewData } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const overviewReq = useAsync<AdminOverviewData>()
const overview = computed(() => overviewReq.data.value ?? null)

const statCards = computed(() => [
  {
    label: '班级总数',
    value: overview.value?.class_count ?? 0,
    icon: School,
    border: 'border-l-[#70C125]',
    iconBg: 'bg-[#F4FAEE]',
    iconColor: 'text-[#70C125]',
  },
  {
    label: '教师总数',
    value: overview.value?.teacher_count ?? 0,
    icon: Users,
    border: 'border-l-[#1CB0F6]',
    iconBg: 'bg-[#F0F9FF]',
    iconColor: 'text-[#1899D6]',
  },
  {
    label: '学生总数',
    value: overview.value?.student_count ?? 0,
    icon: GraduationCap,
    border: 'border-l-[#FFC800]',
    iconBg: 'bg-[#FFF9E6]',
    iconColor: 'text-[#CA8A04]',
  },
  {
    label: '待处理事项',
    value: overview.value?.pending_count ?? 0,
    icon: Bell,
    border: 'border-l-[#FF4BBD]',
    iconBg: 'bg-[#FFF0F9]',
    iconColor: 'text-[#CF3EA5]',
  },
])

const quickActions = [
  {
    label: '创建班级',
    icon: Plus,
    iconBg: 'bg-[#F4FAEE]',
    iconColor: 'text-[#70C125]',
    to: '/admin/classes/create',
  },
  {
    label: '创建教师',
    icon: UserPlus,
    iconBg: 'bg-[#F0F9FF]',
    iconColor: 'text-[#1899D6]',
    to: '/admin/teachers/create',
  },
  {
    label: '查看学生',
    icon: Users,
    iconBg: 'bg-[#FFF9E6]',
    iconColor: 'text-[#CA8A04]',
    to: '/admin/students',
  },
]

const activityStyle: Record<AdminOverviewActivity['type'], { icon: unknown; bg: string; color: string }> = {
  config: { icon: Settings2, bg: 'bg-[#F4FAEE]', color: 'text-[#70C125]' },
  teacher: { icon: UserPlus, bg: 'bg-[#F0F9FF]', color: 'text-[#1899D6]' },
  student: { icon: CheckCircle, bg: 'bg-[#22C55E]', color: 'text-white' },
  class: { icon: School, bg: 'bg-[#FFF9E6]', color: 'text-[#CA8A04]' },
  system: { icon: Database, bg: 'bg-[#FFF0F9]', color: 'text-[#CF3EA5]' },
}

const styleOf = (type: AdminOverviewActivity['type']) => activityStyle[type] ?? activityStyle.system

const load = async () => {
  await overviewReq.run(async () => (await getAdminOverview()).data)
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">总览</h2>
      <p class="text-sm font-bold text-gray-400">欢迎回来，管理班级、教师与学生账号</p>
    </div>

    <ErrorState
      v-if="overviewReq.error.value"
      title="加载失败"
      message="无法获取平台总览数据，请稍后重试。"
      :busy="overviewReq.loading.value"
      @retry="load"
    />

    <template v-else-if="overviewReq.loading.value">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-28 w-full" />
      </div>
      <SkeletonBlock class="h-40 w-full" />
      <SkeletonBlock class="h-64 w-full" />
    </template>

    <template v-else>
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-3xl border border-gray-100 border-l-4 shadow-sm p-6 flex items-center justify-between gap-4"
          :class="card.border"
        >
          <div class="flex flex-col gap-2 min-w-0">
            <p class="text-xs font-black text-gray-400 uppercase tracking-widest truncate">{{ card.label }}</p>
            <p class="text-3xl font-black text-gray-800">{{ card.value }}</p>
          </div>
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" :class="[card.iconBg, card.iconColor]">
            <component :is="card.icon" class="w-6 h-6" />
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h3 class="text-lg font-black text-gray-800">快捷操作</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="bg-white rounded-3xl border-2 border-transparent shadow-sm p-6 flex flex-col items-center gap-3 hover:border-[#70C125]/30 hover:shadow-md transition-all"
            @click="router.push(action.to)"
          >
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="[action.iconBg, action.iconColor]">
              <component :is="action.icon" class="w-6 h-6" />
            </div>
            <span class="text-sm font-black text-gray-800">{{ action.label }}</span>
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h3 class="text-lg font-black text-gray-800">近期动态</h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="item in overview?.activities ?? []"
            :key="item.activity_id"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 p-4"
          >
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" :class="[styleOf(item.type).bg, styleOf(item.type).color]">
              <component :is="styleOf(item.type).icon" class="w-5 h-5" />
            </div>
            <div class="flex flex-col min-w-0">
              <p class="text-sm font-black text-gray-800 truncate">{{ item.title }}</p>
              <p class="text-xs font-bold text-gray-400">{{ item.time }}</p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
