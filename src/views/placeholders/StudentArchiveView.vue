<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import { getStudentArchiveStatistics } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'

const req = useAsync<Awaited<ReturnType<typeof getStudentArchiveStatistics>>>()
const statistics = computed(() => req.data.value?.statistics)

const statCards = computed(() => [
  { label: '完成条目', value: statistics.value?.total_entries ?? 0 },
  { label: '自由评测', value: statistics.value?.main_page_entries ?? 0 },
  { label: '作业记录', value: statistics.value?.aufgaben_entries ?? 0 },
  {
    label: '平均分',
    value: statistics.value && statistics.value.average_score >= 0 ? statistics.value.average_score.toFixed(1) : '--',
  },
  {
    label: '最高分',
    value: statistics.value && statistics.value.max_score >= 0 ? statistics.value.max_score.toFixed(1) : '--',
  },
])

const load = async () => {
  await req.run(() => getStudentArchiveStatistics())
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">档案资料</h2>
      <p class="text-sm font-bold text-gray-400">汇总你的评测次数、作业完成情况与最近活动。</p>
    </div>

    <ErrorState
      v-if="req.error.value"
      message="无法获取档案统计，请检查登录状态或稍后重试。"
      :busy="req.loading.value"
      @retry="load"
    />

    <template v-else-if="req.loading.value">
      <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <SkeletonBlock v-for="n in 5" :key="n" class="h-28 w-full" />
      </div>
      <SkeletonBlock class="h-24 w-full" />
    </template>

    <template v-else>
      <section class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div
          v-for="item in statCards"
          :key="item.label"
          class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3"
        >
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">{{ item.label }}</span>
          <strong class="text-3xl font-black text-gray-900">{{ item.value }}</strong>
        </div>
      </section>

      <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-sm font-black text-gray-400 uppercase tracking-widest">最近活动</span>
          <strong class="text-lg font-black text-gray-900">{{ statistics?.latest_activity ?? '暂无记录' }}</strong>
        </div>
      </section>
    </template>
  </main>
</template>
