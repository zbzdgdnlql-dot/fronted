<script setup lang="ts">
import { BookOpen, ListTodo, ChevronRight } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import type { StudentCustomContentItem } from '../../api/endpoints'

defineProps<{
  items: StudentCustomContentItem[]
  loading: boolean
  selectedContentId: string | null
}>()

defineEmits<{
  (e: 'select', contentId: string): void
}>()
</script>

<template>
  <aside class="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
    <!-- Class Content Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <BookOpen class="w-4 h-4 text-[#70C125]" />
        </div>
        <h3 class="text-lg font-extrabold text-gray-900">班级内容</h3>
      </div>

      <div class="flex flex-col gap-3">
        <template v-if="loading">
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
        </template>

        <template v-else>
          <button
            v-for="item in items"
            :key="item.content_id"
            type="button"
            :class="[
              'p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden text-left',
              item.content_id === selectedContentId ? 'border-[#70C125] bg-[#F8FAFB]' : 'border-gray-100 bg-white hover:border-gray-200'
            ]"
            @click="$emit('select', item.content_id)"
          >
            <div v-if="item.content_id === selectedContentId" class="absolute left-0 top-0 bottom-0 w-1 bg-[#70C125]"></div>

            <h4 class="text-[15px] font-bold text-gray-900 mb-3">{{ item.title }}</h4>

            <div class="flex items-center justify-between gap-3 flex-wrap">
              <span
                class="px-2 py-0.5 rounded text-xs font-black"
                :class="item.is_active ? 'bg-[#EAF0DD] text-[#70C125]' : 'bg-gray-100 text-gray-500'"
              >
                {{ item.is_active ? '进行中' : '未启用' }}
              </span>
              <span class="text-xs font-medium text-gray-500">平均分: {{ item.avg_score < 0 ? '--' : item.avg_score.toFixed(1) }}</span>
            </div>
          </button>
        </template>
      </div>
    </div>

    <!-- Chapters Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <ListTodo class="w-4 h-4 text-blue-500" />
        </div>
        <h3 class="text-lg font-extrabold text-gray-900">课程章节</h3>
      </div>

      <div class="flex flex-col gap-2">
        <button 
          v-for="n in 3"
          :key="n"
          class="flex items-center justify-between p-3 rounded-xl transition-all text-left w-full group bg-white border border-gray-100 opacity-70 cursor-not-allowed"
          disabled
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-gray-100 text-gray-500">
              {{ n }}
            </div>
            <span class="text-[15px] font-bold text-gray-700">章节功能待接入</span>
          </div>
          
          <ChevronRight class="w-4 h-4 text-gray-300" />
        </button>
        <!-- TODO: 接入章节/单元学习相关接口（当前后端文档未提供对应 student unit_learning API）。 -->
      </div>
    </div>
  </aside>
</template>
