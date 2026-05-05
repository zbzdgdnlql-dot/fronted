<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">关于</h2>
      <p class="text-sm font-bold text-gray-400">此页面为临时占位，可后续替换为真实内容。</p>
    </div>

    <div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4">
      <SkeletonBlock class="h-6 w-40" />
      <SkeletonBlock class="h-4 w-full" />
      <SkeletonBlock class="h-4 w-5/6" />
      <SkeletonBlock class="h-4 w-2/3" />
      <!-- TODO: 接入产品介绍/帮助中心内容（后端暂无接口文档）。 -->
    </div>
  </main>
</template>

