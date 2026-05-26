<script setup lang="ts">
import SkeletonBlock from '../../components/SkeletonBlock.vue'
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Top Box: Comprehensive Report -->
    <div class="bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-sm flex flex-col mb-8 min-h-[340px] shrink-0">
      <h3 class="text-lg font-black text-gray-900 mb-6">综合评测报告</h3>
      
      <div class="flex flex-col gap-4">
        <div class="text-sm font-bold text-gray-500">
          暂无评测数据。请在左侧输入文本并开始录音后查看结果。
        </div>
        <div class="grid grid-cols-2 gap-4">
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
        </div>
      </div>
      
      <!-- 语速 -->
      <div class="bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between mt-4">
        <span class="text-gray-500 font-black uppercase tracking-wider text-sm">语速</span>
        <span class="text-xl font-black text-gray-900">--</span>
      </div>
    </div>

    <!-- Bottom Box: Sentence Analysis -->
    <div class="bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-[400px]">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black text-gray-900">单句评分分析</h3>
        <div class="bg-gray-100 px-4 py-1.5 rounded-full">
          <span class="text-gray-500 font-black text-xs uppercase tracking-wider">0 个句子</span>
        </div>
      </div>

      <div class="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col gap-4">
        <div class="text-sm font-bold text-gray-500">完成一次评测后将展示单句得分与音素薄弱点。</div>
        <SkeletonBlock class="h-14 w-full" />
        <SkeletonBlock class="h-14 w-full" />
        <SkeletonBlock class="h-14 w-full" />
        <!-- TODO: 接入 /student/test/create_session、/student/pron-test/analyze、/student/test/submit_session，并将返回的 evaluation 映射为“综合评测报告 + 单句评分分析”。 -->
      </div>
    </div>
  </div>
</template>
