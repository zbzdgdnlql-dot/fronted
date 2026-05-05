<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">个人中心</h2>
      <p class="text-sm font-bold text-gray-400">此页面为临时占位，可后续替换为真实用户资料与设置。</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <SkeletonBlock class="h-6 w-32" />
        <SkeletonBlock class="h-4 w-3/4" />
        <SkeletonBlock class="h-4 w-2/3" />
      </div>
      <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <SkeletonBlock class="h-6 w-32" />
        <SkeletonBlock class="h-10 w-full" />
        <SkeletonBlock class="h-10 w-full" />
      </div>
    </div>
    <!-- TODO: 若后端提供用户信息接口（如 user/profile），在此处接入并支持修改。 -->
  </main>
</template>

