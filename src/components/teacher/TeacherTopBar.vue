<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserAccountMenu from '../UserAccountMenu.vue'

defineProps<{
  title?: string
  showBack?: boolean
}>()

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()

const onBack = () => {
  emit('back')
  if (router.options.history.state.back) {
    router.back()
  }
}
</script>

<template>
  <header
    class="w-full h-16 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] flex items-center px-6 gap-4 shrink-0"
  >
    <template v-if="showBack">
      <button
        type="button"
        class="flex items-center gap-2 text-[#475569] hover:text-[#334155] transition-colors"
        @click="onBack"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="w-px h-6 bg-[#E2E8F0]" />
      <h1 class="text-lg font-black text-[#1F2937] tracking-tight">{{ title }}</h1>
    </template>

    <template v-else>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1CB0F6] to-[#58CC02]">
          <img src="../../assets/figma/link.svg" alt="Logo" class="w-full h-full object-cover" />
        </div>
        <h1 class="text-xl font-bold text-[#1F2937] tracking-tight">AI多语</h1>
      </div>
    </template>

    <div class="flex-1" />

    <div class="flex items-center gap-3 min-w-0">
      <span class="whitespace-nowrap text-xs font-black text-[#FBFBFA] bg-[rgba(77,124,15,0.65)] rounded-full px-2.5 py-1 leading-none tracking-wider">
        教师端
      </span>
      <UserAccountMenu compact />
    </div>
  </header>
</template>
