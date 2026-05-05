<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { getTeacherDashboard } from '../api/endpoints'
import { useAsync } from '../composables/useAsync'
import ErrorState from '../components/ErrorState.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'

const req = useAsync<Awaited<ReturnType<typeof getTeacherDashboard>>>()

const stats = computed(() => req.data.value)

const load = async () => {
  await req.run(async () => getTeacherDashboard())
}

onMounted(load)
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <ErrorState
      v-if="req.error.value"
      title="教师概览加载失败"
      message="无法获取教师面板数据，请检查网络或登录状态。"
      :busy="req.loading.value"
      @retry="load"
    />

    <template v-else>
      <div class="flex items-start justify-between gap-6 flex-wrap">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">教师概览</h2>
          <p class="text-sm font-bold text-gray-400">班级与作业数据概览</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div class="text-xs font-black text-gray-400 uppercase tracking-widest">班级数</div>
          <div class="text-3xl font-black text-gray-900 mt-2">
            <SkeletonBlock v-if="req.loading.value" class="h-9 w-20" />
            <span v-else>{{ stats?.total_classes ?? 0 }}</span>
          </div>
        </div>
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div class="text-xs font-black text-gray-400 uppercase tracking-widest">学生数</div>
          <div class="text-3xl font-black text-gray-900 mt-2">
            <SkeletonBlock v-if="req.loading.value" class="h-9 w-20" />
            <span v-else>{{ stats?.total_students ?? 0 }}</span>
          </div>
        </div>
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div class="text-xs font-black text-gray-400 uppercase tracking-widest">作业数</div>
          <div class="text-3xl font-black text-gray-900 mt-2">
            <SkeletonBlock v-if="req.loading.value" class="h-9 w-20" />
            <span v-else>{{ stats?.total_content ?? 0 }}</span>
          </div>
        </div>
      </div>

      <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h3 class="text-lg font-black text-gray-900">班级列表</h3>
          <div class="text-sm font-bold text-gray-400">共 {{ stats?.class_details?.length ?? 0 }} 个班级</div>
        </div>

        <div v-if="req.loading.value" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonBlock class="h-24 w-full" />
          <SkeletonBlock class="h-24 w-full" />
          <SkeletonBlock class="h-24 w-full" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            v-for="(c, idx) in stats?.class_details ?? []"
            :key="idx"
            class="bg-[#F8F9FA] border border-gray-100 rounded-3xl p-6 flex flex-col gap-2"
          >
            <div class="text-sm font-black text-gray-900">班级</div>
            <div class="text-sm font-bold text-gray-500">学生数 {{ c.student_count }} · 作业数 {{ c.content_count }}</div>
          </div>
        </div>
        <!-- TODO: 将 class_details 中的 class 字段映射为可展示的 class_name、grade 等信息（后端返回为 SQLAlchemy 对象序列化结果）。 -->
      </section>
    </template>
  </main>
</template>
