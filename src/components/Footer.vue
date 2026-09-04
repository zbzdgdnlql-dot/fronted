<script setup lang="ts">
const navGroups = [
  {
    title: 'AI多语',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '联系方式', href: '#' },
      { label: '帮助中心', href: '#' },
    ],
  },
  {
    title: '学习资源',
    links: [
      { label: '法语发音', href: '#' },
      { label: '语法练习', href: '#' },
      { label: '公开课', href: '#' },
    ],
  },
  {
    title: '法律条款',
    links: [
      { label: '隐私政策', href: '#' },
      { label: '服务条款', href: '#' },
    ],
  },
]
</script>

<template>
  <footer class="bg-white border-t-2 border-gray-200 mt-auto">
    <div class="max-w-[1440px] mx-auto px-8 py-12 flex flex-col md:flex-row gap-12">
      <div class="flex-1 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1CB0F6] to-[#58CC02]">
            <span class="text-white text-lg font-black">A</span>
          </div>
          <span class="text-xl font-black text-[#1F2937] tracking-tight">AI多语</span>
        </div>
        <p class="text-sm text-[#9CA3AF] leading-relaxed max-w-xs">
          专业多语发音练习平台，由 AI 驱动，为每位学习者提供个性化的语音评估与指导。
        </p>
      </div>

      <div
        v-for="group in navGroups"
        :key="group.title"
        class="flex flex-col gap-3"
      >
        <h4 class="text-sm font-black text-[#1F2937] tracking-wider uppercase">{{ group.title }}</h4>
        <a
          v-for="link in group.links"
          :key="link.label"
          :href="link.href"
          class="text-sm font-bold text-[#9CA3AF] hover:text-[#356B00] transition-colors"
        >
          {{ link.label }}
        </a>
      </div>
    </div>

    <div class="border-t border-[#F1F5F9]">
      <div class="max-w-[1440px] mx-auto px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs font-bold text-[#9CA3AF]">
          &copy; {{ new Date().getFullYear() }} AI多语. All rights reserved.
        </p>
        <div class="flex items-center gap-6">
          <a href="#" class="text-xs font-bold text-[#9CA3AF] hover:text-[#475569] transition-colors">隐私政策</a>
          <a href="#" class="text-xs font-bold text-[#9CA3AF] hover:text-[#475569] transition-colors">服务条款</a>
        </div>
      </div>
    </div>
  </footer>
</template>
