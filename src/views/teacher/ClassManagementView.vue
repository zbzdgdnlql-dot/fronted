<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ChevronLeft, Users } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getTeacherClasses, type TeacherClassItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const router = useRouter()
const classesReq = useAsync<TeacherClassItem[]>()
const classes = computed(() => classesReq.data.value ?? [])

const load = async () => {
  await classesReq.run(() => getTeacherClasses())
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex items-center justify-between gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">班级管理</h2>
        <p class="text-sm font-bold text-gray-400">查看和管理您的所有班级。</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
          @click="router.push('/teacher/overview')"
        >
          <ChevronLeft class="w-4 h-4" />
          教师版
        </button>
      </div>
    </div>

    <ErrorState
      v-if="classesReq.error.value"
      title="加载失败"
      message="无法获取班级列表，请稍后重试。"
      :busy="classesReq.loading.value"
      @retry="load"
    />

    <template v-else-if="classesReq.loading.value">
      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-6">
          <SkeletonBlock class="h-12 w-full mb-4" />
          <SkeletonBlock class="h-12 w-full mb-4" />
          <SkeletonBlock class="h-12 w-full" />
        </div>
      </div>
    </template>

    <EmptyState
      v-else-if="!classes.length"
      title="暂无班级"
      description="您还没有创建任何班级。"
      actionLabel="创建班级"
      @action="router.push('/teacher/content')"
    />

    <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <!-- Table Header -->
      <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-[#F8F9FA] border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
        <div class="col-span-3">班级名称</div>
        <div class="col-span-2">学生数</div>
        <div class="col-span-2">作业数</div>
        <div class="col-span-5">创建时间</div>
      </div>

      <!-- Table Rows -->
      <div
        v-for="cls in classes"
        :key="cls.class_id"
        class="grid grid-cols-12 gap-4 px-6 py-5 border-b border-gray-50 items-center hover:bg-[#F8F9FA] transition-colors"
      >
        <div class="col-span-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#F4FAEE] border border-[#EAF0DD] flex items-center justify-center">
            <Users class="w-5 h-5 text-[#70C125]" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black text-gray-900">{{ cls.class_name }}</span>
            <span v-if="cls.description" class="text-xs font-bold text-gray-400 truncate max-w-[160px]">{{ cls.description }}</span>
          </div>
        </div>
        <div class="col-span-2 text-sm font-bold text-gray-700">{{ cls.student_count }}</div>
        <div class="col-span-2 text-sm font-bold text-gray-700">{{ cls.task_count }}</div>
        <div class="col-span-5 text-sm font-bold text-gray-400">{{ cls.created_at || '--' }}</div>
      </div>
    </section>
  </main>
</template>
