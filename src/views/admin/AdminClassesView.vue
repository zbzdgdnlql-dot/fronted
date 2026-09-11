<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Pencil, UserPlus, Eye, Languages } from 'lucide-vue-next'
import {
  ADMIN_LANGUAGE_OPTIONS,
  getAdminClasses,
  type AdminClassItem,
  type AdminClassStatus,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const router = useRouter()

const keyword = ref('')
const language = ref('')
const status = ref<AdminClassStatus | ''>('')

const classesReq = useAsync<AdminClassItem[]>()
const classes = computed(() => classesReq.data.value ?? [])

const languages = ADMIN_LANGUAGE_OPTIONS

const languageStyle: Record<string, string> = {
  JP: 'bg-[#FFF0F9] text-[#CF3EA5]',
  DE: 'bg-[#EEF2FF] text-[#4F46E5]',
  FR: 'bg-[#F0F9FF] text-[#1899D6]',
  ES: 'bg-[#FFF9E6] text-[#CA8A04]',
  RU: 'bg-[#F4FAEE] text-[#5E9E1A]',
}

const load = async () => {
  await classesReq.run(
    async () =>
      (
        await getAdminClasses({
          keyword: keyword.value.trim(),
          language: language.value,
          status: status.value,
        })
      ).data,
  )
}

const resetFilters = () => {
  keyword.value = ''
  language.value = ''
  status.value = ''
  void load()
}

const goEdit = (classId: string) => router.push(`/admin/classes/${classId}/edit`)
const goAddStudent = (classId: string) => router.push(`/admin/classes/${classId}/students/add`)
const goViewStudents = (classId: string) => router.push({ path: '/admin/students', query: { class_id: classId } })

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">班级列表</h2>
        <p class="text-sm font-bold text-gray-400">管理所有班级、教师与学生的归属关系</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 bg-[#70C125] text-white font-black text-sm px-5 py-3 rounded-2xl border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
        @click="router.push('/admin/classes/create')"
      >
        <Plus class="w-4 h-4" />
        <span>创建班级</span>
      </button>
    </div>

    <!-- 搜索 / 筛选 -->
    <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-4">
      <div class="flex items-center gap-2 flex-1 min-w-[220px] px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB]">
        <Search class="w-4 h-4 text-[#9CA3AF] shrink-0" />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索班级名称"
          class="flex-1 bg-transparent text-sm font-bold text-[#3C3C3C] outline-none placeholder:text-[#9CA3AF]"
          @keyup.enter="load"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-xs font-black text-gray-400">授课语言</label>
        <select
          v-model="language"
          class="min-w-[160px] px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] outline-none focus:border-[#70C125] focus:ring-2 focus:ring-[#70C125]/30 transition"
          @change="load"
        >
          <option value="">全部语言</option>
          <option v-for="item in languages" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-xs font-black text-gray-400">状态</label>
        <select
          v-model="status"
          class="min-w-[140px] px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] outline-none focus:border-[#70C125] focus:ring-2 focus:ring-[#70C125]/30 transition"
          @change="load"
        >
          <option value="">全部状态</option>
          <option value="active">进行中</option>
          <option value="ended">已结课</option>
        </select>
      </div>
      <button
        type="button"
        class="px-5 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
        @click="resetFilters"
      >
        重置
      </button>
    </div>

    <ErrorState
      v-if="classesReq.error.value"
      title="加载失败"
      message="无法获取班级列表，请稍后重试。"
      :busy="classesReq.loading.value"
      @retry="load"
    />

    <template v-else-if="classesReq.loading.value">
      <div class="flex flex-col gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-24 w-full" />
      </div>
    </template>

    <EmptyState
      v-else-if="!classes.length"
      title="暂无班级"
      description="当前筛选条件下没有匹配的班级，可调整关键词或清空筛选后重试。"
      action-label="创建班级"
      @action="router.push('/admin/classes/create')"
    />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="cls in classes"
        :key="cls.class_id"
        class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center gap-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-4 flex-1 min-w-[240px]">
          <span
            class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
            :class="languageStyle[cls.language_code] ?? 'bg-[#F3F4F6] text-[#6B7280]'"
          >
            {{ cls.language_code }}
          </span>
          <div class="flex flex-col gap-1 min-w-0">
            <span class="text-sm font-black text-gray-900 truncate">{{ cls.class_name }}</span>
            <div class="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
              <span class="inline-flex items-center gap-1">
                <Languages class="w-3 h-3" />
                {{ cls.language }}
              </span>
              <span>·</span>
              <span>任课教师：{{ cls.teacher_name || '未分配' }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center px-4 shrink-0">
          <span class="text-xl font-black text-gray-800">{{ cls.student_count }}</span>
          <span class="text-xs font-bold text-gray-400">学生数</span>
        </div>

        <span
          class="px-3 py-1 rounded-full text-xs font-black shrink-0"
          :class="cls.status === 'active' ? 'bg-[#F4FAEE] text-[#5E9E1A]' : 'bg-[#F3F4F6] text-[#9CA3AF]'"
        >
          {{ cls.status === 'active' ? '进行中' : '已结课' }}
        </span>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border-2 border-[#E2E8F0] text-[#6B7280] text-xs font-black hover:bg-[#F8FAFB] transition-colors"
            @click="goEdit(cls.class_id)"
          >
            <Pencil class="w-3.5 h-3.5" />
            编辑
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A] text-xs font-black hover:bg-[#EAF0DD] transition-colors"
            @click="goAddStudent(cls.class_id)"
          >
            <UserPlus class="w-3.5 h-3.5" />
            添加学生
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#F0F9FF] text-[#1899D6] text-xs font-black hover:bg-[#E0F2FE] transition-colors"
            @click="goViewStudents(cls.class_id)"
          >
            <Eye class="w-3.5 h-3.5" />
            查看学生
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
