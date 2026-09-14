<script setup lang="ts">
import { onUnmounted } from 'vue'
import HomeLeftColumn from './home/HomeLeftColumn.vue'
import HomeRightColumn from './home/HomeRightColumn.vue'
import { useHomeEvaluation } from './home/useHomeEvaluation'

const { resetAll, cleanup } = useHomeEvaluation()

// 每次进入主页都从空文本开始，避免上一次的输入被缓存后再次显示
resetAll()

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <!-- 单屏测评页：xl 及以上定为「视口高 - 页头高」，整页不滚动，溢出由卡片内部滚动承接 -->
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-6 xl:p-8 flex flex-col xl:flex-row gap-6 xl:gap-8 min-h-0 xl:flex-none xl:h-[calc(100vh-72px)] xl:max-h-[calc(100vh-72px)] xl:overflow-hidden">
    <!-- Left Column -->
    <HomeLeftColumn class="w-full xl:w-[55%] flex flex-col gap-6 min-h-0" />

    <!-- Right Column -->
    <HomeRightColumn class="w-full xl:w-[45%] flex flex-col gap-6 min-h-0" />
  </main>
</template>
