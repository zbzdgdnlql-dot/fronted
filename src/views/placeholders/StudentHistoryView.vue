<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import { getStudentHistoryWords } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'

const req = useAsync<Awaited<ReturnType<typeof getStudentHistoryWords>>>()
const words = computed(() => req.data.value?.words ?? [])

const load = async () => {
  await req.run(() => getStudentHistoryWords())
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">历史记录</h2>
      <p class="text-sm font-bold text-gray-400">查看你已经评测过的单词集合。</p>
    </div>

    <ErrorState
      v-if="req.error.value"
      message="无法获取历史单词，请检查登录状态或稍后重试。"
      :busy="req.loading.value"
      @retry="load"
    />

    <div v-else class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
      <template v-if="req.loading.value">
        <SkeletonBlock class="h-10 w-full" />
        <SkeletonBlock class="h-10 w-full" />
        <SkeletonBlock class="h-10 w-full" />
      </template>

      <template v-else-if="!words.length">
        <div class="bg-[#F8F9FA] border border-gray-100 rounded-3xl p-6 text-sm font-bold text-gray-500">
          暂无历史单词
        </div>
      </template>

      <template v-else>
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-black text-gray-900">已评测单词</h3>
          <span class="rounded-full bg-[#EAF0DD] px-4 py-1.5 text-xs font-black text-[#70C125]">{{ words.length }} 个</span>
        </div>

        <div class="flex flex-wrap gap-3">
          <span
            v-for="word in words"
            :key="word"
            class="rounded-2xl border border-gray-100 bg-[#F8F9FA] px-4 py-2 text-sm font-black text-gray-700"
          >
            {{ word }}
          </span>
        </div>
      </template>
    </div>
  </main>
</template>
