<script setup lang="ts">
import { onUnmounted } from 'vue'
import HomeLeftColumn from './home/HomeLeftColumn.vue'
import HomeRightColumn from './home/HomeRightColumn.vue'
import { useHomeEvaluation } from './home/useHomeEvaluation'

const { cleanup } = useHomeEvaluation()

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col xl:flex-row gap-8">
    <!-- Left Column -->
    <HomeLeftColumn class="w-full xl:w-[55%] flex flex-col gap-8" />

    <!-- Right Column -->
    <HomeRightColumn class="w-full xl:w-[45%] flex flex-col gap-8" />
  </main>
</template>
