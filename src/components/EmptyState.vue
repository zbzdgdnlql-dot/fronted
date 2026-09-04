<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-6 gap-6">
    <div v-if="icon" class="w-20 h-20 rounded-full bg-[#F4FAEE] flex items-center justify-center">
      <img :src="icon" :alt="title" class="w-10 h-10" />
    </div>
    <div class="w-20 h-20 rounded-full bg-[#F4FAEE] flex items-center justify-center" v-else>
      <svg class="w-10 h-10 text-[#70C125]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
    <div class="flex flex-col items-center gap-2 text-center max-w-sm">
      <h3 class="text-xl font-black text-gray-900">{{ title }}</h3>
      <p class="text-sm font-bold text-gray-400 leading-relaxed">{{ description }}</p>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      class="bg-[#70C125] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
