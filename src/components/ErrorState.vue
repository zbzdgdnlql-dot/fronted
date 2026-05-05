<script setup lang="ts">
defineProps<{
  title?: string
  message: string
  actionText?: string
  busy?: boolean
}>()

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4">
    <div class="text-lg font-black text-gray-900">{{ title ?? '加载失败' }}</div>
    <div class="text-sm font-bold text-gray-500 leading-relaxed">{{ message }}</div>
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="busy"
        @click="$emit('retry')"
      >
        {{ actionText ?? '重试' }}
      </button>
    </div>
  </div>
</template>

