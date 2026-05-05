<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">结果</h2>
      <p class="text-sm font-bold text-gray-400">此页面为临时占位，将在后续展示评分与单句详情。</p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <section class="xl:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <SkeletonBlock class="h-6 w-24" />
        <SkeletonBlock class="h-40 w-full" />
        <SkeletonBlock class="h-16 w-full" />
      </section>
      <section class="xl:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <SkeletonBlock class="h-6 w-40" />
        <SkeletonBlock class="h-12 w-full" />
        <SkeletonBlock class="h-12 w-full" />
        <SkeletonBlock class="h-12 w-full" />
        <SkeletonBlock class="h-12 w-full" />
      </section>
    </div>
    <!-- TODO: 将 /api/process_sentence 返回的 evaluation / word_data 展示为总分与逐句详情；并可跳转到 /student/custom_content/detail/<session_id> 展示归档条目。 -->
  </main>
</template>

