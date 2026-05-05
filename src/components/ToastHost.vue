<script setup lang="ts">
import { useToast } from '../composables/useToast'

const toast = useToast()

const tone = (level: string) => {
  if (level === 'success') return 'border-green-200 bg-green-50 text-green-800'
  if (level === 'warning') return 'border-yellow-200 bg-yellow-50 text-yellow-800'
  if (level === 'error') return 'border-red-200 bg-red-50 text-red-800'
  return 'border-gray-200 bg-white text-gray-800'
}
</script>

<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(520px,calc(100vw-2rem))]">
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="item in toast.items"
        :key="item.id"
        class="px-4 py-3 rounded-2xl shadow-lg border flex items-center justify-between gap-3"
        :class="tone(item.level)"
      >
        <div class="text-sm font-bold leading-snug">{{ item.message }}</div>
        <button
          type="button"
          class="text-sm font-black text-gray-500 hover:text-gray-700"
          @click="toast.dismiss(item.id)"
        >
          关闭
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

