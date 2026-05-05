<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">录音</h2>
      <p class="text-sm font-bold text-gray-400">此页面为临时占位，保留录音控制结构与后续接入点。</p>
    </div>

    <div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div class="text-xs font-black text-gray-400 uppercase tracking-widest">录音状态</div>
          <div class="text-lg font-black text-gray-900">未开始</div>
        </div>
        <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div class="text-xs font-black text-gray-400 uppercase tracking-widest">音频波形</div>
          <SkeletonBlock class="h-10 w-full" />
        </div>
      </div>

      <div class="flex items-center gap-4 flex-wrap">
        <button type="button" class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm opacity-70 cursor-not-allowed" disabled>
          开始录音
        </button>
        <button type="button" class="bg-[#FF80B5] text-white px-5 py-3 rounded-2xl font-black text-sm opacity-70 cursor-not-allowed" disabled>
          停止录音
        </button>
      </div>
      <!-- TODO: 接入 /api/create_reading_session 创建 session_id；录音完成后按句调用 /api/process_sentence；最终调用 /api/submit_session。 -->
    </div>
  </main>
</template>

