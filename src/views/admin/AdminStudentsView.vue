<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserPlus, Search, Pencil, ArrowRightLeft, X } from 'lucide-vue-next'
import { getAdminStudents, type AdminStudentItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const classId = ref((route.query.class_id as string) ?? '')

const studentsReq = useAsync<AdminStudentItem[]>()
const students = computed(() => studentsReq.data.value ?? [])

const load = async () => {
  await studentsReq.run(
    async () =>
      (
        await getAdminStudents({
          keyword: keyword.value.trim(),
          class_id: classId.value,
        })
      ).data,
  )
}

const addStudentTarget = computed(() =>
  classId.value ? `/admin/classes/${classId.value}/students/add` : '/admin/classes',
)

const clearClassFilter = () => {
  classId.value = ''
  void router.replace({ path: '/admin/students' })
}

const goEdit = (userId: string) => router.push(`/admin/students/${userId}/edit`)
const goChangeClass = (userId: string) => router.push(`/admin/students/${userId}/change-class`)

watch(
  () => route.query.class_id,
  (value) => {
    classId.value = (value as string) ?? ''
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">学生列表</h2>
        <p class="text-sm font-bold text-gray-400">查看与管理学生的姓名、学号与班级归属</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 bg-[#70C125] text-white font-black text-sm px-5 py-3 rounded-2xl border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
        @click="router.push(addStudentTarget)"
      >
        <UserPlus class="w-4 h-4" />
        <span>添加学生</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2 flex-1 min-w-[220px] px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB]">
        <Search class="w-4 h-4 text-[#9CA3AF] shrink-0" />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索学生姓名 / 学号"
          class="flex-1 bg-transparent text-sm font-bold text-[#3C3C3C] outline-none placeholder:text-[#9CA3AF]"
          @keyup.enter="load"
        />
      </div>
      <button
        v-if="classId"
        type="button"
        class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#EAF0DD] bg-[#F4FAEE] text-[#5E9E1A] text-xs font-black hover:bg-[#EAF0DD] transition-colors"
        @click="clearClassFilter"
      >
        已按班级筛选
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <ErrorState
      v-if="studentsReq.error.value"
      title="加载失败"
      message="无法获取学生列表，请稍后重试。"
      :busy="studentsReq.loading.value"
      @retry="load"
    />

    <section v-else-if="studentsReq.loading.value" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-6">
        <SkeletonBlock class="h-12 w-full mb-4" />
        <SkeletonBlock class="h-12 w-full mb-4" />
        <SkeletonBlock class="h-12 w-full" />
      </div>
    </section>

    <EmptyState
      v-else-if="!students.length"
      title="暂无匹配的学生"
      description="当搜索或筛选条件没有匹配结果时，将在这里显示空列表提示。你可以调整关键词或清空筛选条件查看全部学生。"
    />

    <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-[#F8F9FA] border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
        <div class="col-span-5">姓名</div>
        <div class="col-span-3">学号</div>
        <div class="col-span-4 text-right">操作</div>
      </div>

      <div
        v-for="stu in students"
        :key="stu.user_id"
        class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 items-center hover:bg-[#F8F9FA] transition-colors"
      >
        <div class="col-span-5 flex flex-col gap-1 min-w-0">
          <span class="text-sm font-black text-gray-900 truncate">{{ stu.name }}</span>
          <span v-if="stu.class_name" class="text-xs font-bold text-gray-400 truncate">{{ stu.class_name }}</span>
        </div>
        <div class="col-span-3 text-sm font-bold text-gray-500">{{ stu.stu_id }}</div>
        <div class="col-span-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border-2 border-[#E2E8F0] text-[#6B7280] text-xs font-black hover:bg-[#F8FAFB] transition-colors"
            @click="goEdit(stu.user_id)"
          >
            <Pencil class="w-3.5 h-3.5" />
            编辑
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#F0F9FF] text-[#1899D6] text-xs font-black hover:bg-[#E0F2FE] transition-colors"
            @click="goChangeClass(stu.user_id)"
          >
            <ArrowRightLeft class="w-3.5 h-3.5" />
            更改班级
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
