<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">档案资料</h2>
      <p class="text-sm font-bold text-gray-400">此页面为临时占位，将在后续接入档案统计与条目详情。</p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <section class="xl:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <SkeletonBlock class="h-6 w-32" />
        <SkeletonBlock class="h-20 w-full" />
        <SkeletonBlock class="h-20 w-full" />
      </section>
      <section class="xl:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <SkeletonBlock class="h-6 w-40" />
        <SkeletonBlock class="h-12 w-full" />
        <SkeletonBlock class="h-12 w-full" />
        <SkeletonBlock class="h-12 w-full" />
      </section>
    </div>
    <!-- TODO: 接入 /student/archive/statistics 与 /student/custom_content/detail/<session_id>。 -->
  </main>
</template>

