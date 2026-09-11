<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Filter, Pencil, UserPlus, UserMinus } from 'lucide-vue-next'
import {
  ADMIN_LANGUAGE_OPTIONS,
  getAdminTeachers,
  type AdminTeacherItem,
  type AdminTeacherStatus,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const router = useRouter()

const keyword = ref('')
const subject = ref('')
const status = ref<AdminTeacherStatus | ''>('')

const teachersReq = useAsync<AdminTeacherItem[]>()
const teachers = computed(() => teachersReq.data.value ?? [])

const subjects = ADMIN_LANGUAGE_OPTIONS

const avatarStyles = [
  'bg-[#F4FAEE] text-[#5E9E1A]',
  'bg-[#F0F9FF] text-[#1899D6]',
  'bg-[#FFF0F9] text-[#CF3EA5]',
  'bg-[#F3F4F6] text-[#9CA3AF]',
  'bg-[#FFF9E6] text-[#CA8A04]',
  'bg-[#EEF2FF] text-[#4F46E5]',
]

const avatarStyle = (index: number) => avatarStyles[index % avatarStyles.length]

const load = async () => {
  await teachersReq.run(
    async () =>
      (
        await getAdminTeachers({
          keyword: keyword.value.trim(),
          subject: subject.value,
          status: status.value,
        })
      ).data,
  )
}

const goEdit = (teacherId: string) => router.push(`/admin/teachers/${teacherId}/edit`)
const goAssign = (teacherId: string) => router.push(`/admin/teachers/${teacherId}/assign`)
const goUnassign = (teacherId: string) => router.push(`/admin/teachers/${teacherId}/unassign`)

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">教师列表</h2>
        <p class="text-sm font-bold text-gray-400">管理 AI多语 平台的全部教师账号与班级分配</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 bg-[#70C125] text-white font-black text-sm px-5 py-3 rounded-2xl border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
        @click="router.push('/admin/teachers/create')"
      >
        <Plus class="w-4 h-4" />
        <span>创建教师</span>
      </button>
    </div>

    <!-- 搜索 / 筛选 -->
    <div class="bg-[#F8FAFB] border border-[#E2E8F0] rounded-3xl p-4 flex flex-wrap gap-3">
      <div class="flex items-center gap-2 flex-1 min-w-[220px] bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3">
        <Search class="w-4 h-4 text-[#9CA3AF] shrink-0" />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索教师姓名或工号"
          class="flex-1 bg-transparent text-sm font-bold text-[#3C3C3C] outline-none placeholder:text-[#9CA3AF]"
          @keyup.enter="load"
        />
      </div>
      <select
        v-model="subject"
        class="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#6B7280] outline-none cursor-pointer focus:border-[#70C125] transition"
        @change="load"
      >
        <option value="">全部学科</option>
        <option v-for="item in subjects" :key="item" :value="item">{{ item }}</option>
      </select>
      <select
        v-model="status"
        class="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#6B7280] outline-none cursor-pointer focus:border-[#70C125] transition"
        @change="load"
      >
        <option value="">全部状态</option>
        <option value="active">在职</option>
        <option value="inactive">停用</option>
      </select>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-5 py-3 bg-[#1CB0F6] text-white font-black text-sm rounded-2xl border-b-4 border-[#1899D6] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
        @click="load"
      >
        <Filter class="w-4 h-4" />
        <span>筛选</span>
      </button>
    </div>

    <div class="flex items-center justify-between">
      <h3 class="text-lg font-black text-gray-800">教师账号</h3>
      <span class="text-xs font-bold text-gray-400">共 {{ teachers.length }} 位教师</span>
    </div>

    <ErrorState
      v-if="teachersReq.error.value"
      title="加载失败"
      message="无法获取教师列表，请稍后重试。"
      :busy="teachersReq.loading.value"
      @retry="load"
    />

    <template v-else-if="teachersReq.loading.value">
      <div class="flex flex-col gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-24 w-full" />
      </div>
    </template>

    <EmptyState
      v-else-if="!teachers.length"
      title="暂无教师"
      description="当前筛选条件下没有匹配的教师，可调整关键词或清空筛选后重试。"
      action-label="创建教师"
      @action="router.push('/admin/teachers/create')"
    />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="(teacher, index) in teachers"
        :key="teacher.teacher_id"
        class="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-4"
      >
        <span
          class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0"
          :class="avatarStyle(index)"
        >
          {{ teacher.name.charAt(0) }}
        </span>

        <div class="flex-1 min-w-[220px]">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-black text-gray-900">{{ teacher.name }}</span>
            <span class="text-xs font-bold text-gray-400">工号 {{ teacher.staff_id }}</span>
          </div>
          <div class="flex items-center gap-2 mt-1 flex-wrap text-xs font-bold text-[#6B7280]">
            <span>{{ teacher.subject }}</span>
            <span class="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>任教 {{ teacher.class_count }} 个班级</span>
            <span class="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>{{ teacher.email }}</span>
          </div>
        </div>

        <span
          class="px-3 py-1 rounded-full text-xs font-black shrink-0"
          :class="teacher.status === 'active' ? 'bg-[#F4FAEE] text-[#5E9E1A]' : 'bg-[#F3F4F6] text-[#9CA3AF]'"
        >
          {{ teacher.status === 'active' ? '在职' : '停用' }}
        </span>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border-2 border-[#E2E8F0] text-[#6B7280] text-xs font-black hover:bg-[#F8FAFB] transition-colors"
            @click="goEdit(teacher.teacher_id)"
          >
            <Pencil class="w-3.5 h-3.5" />
            编辑
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A] text-xs font-black hover:bg-[#EAF0DD] transition-colors"
            @click="goAssign(teacher.teacher_id)"
          >
            <UserPlus class="w-3.5 h-3.5" />
            分配班级
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#FFF9E6] text-[#CA8A04] text-xs font-black hover:bg-[#FEF3C7] transition-colors"
            @click="goUnassign(teacher.teacher_id)"
          >
            <UserMinus class="w-3.5 h-3.5" />
            解除分配
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
