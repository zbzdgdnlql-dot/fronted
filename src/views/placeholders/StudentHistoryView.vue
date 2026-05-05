<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">历史记录</h2>
      <p class="text-sm font-bold text-gray-400">此页面为临时占位，将在后续接入历史评分与趋势分析。</p>
    </div>

    <div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonBlock class="h-20 w-full" />
        <SkeletonBlock class="h-20 w-full" />
        <SkeletonBlock class="h-20 w-full" />
      </div>
      <SkeletonBlock class="h-10 w-full" />
      <SkeletonBlock class="h-10 w-full" />
      <SkeletonBlock class="h-10 w-full" />
      <!-- TODO: 接入 /student/history/words、/student/history/phonemes、/student/history/word/<word>、/student/history/phoneme/<phoneme>、/student/history/ranking。 -->
    </div>
  </main>
</template>

