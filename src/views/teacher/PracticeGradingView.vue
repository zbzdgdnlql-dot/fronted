<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, Filter, Search, Mic, Paperclip, Save } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const route = useRoute()

const meta = computed(() => {
  return {
    classLabel: (route.query.classId as string | undefined) ?? '--',
    contentId: (route.query.contentId as string | undefined) ?? '--',
    sessionId: (route.query.sessionId as string | undefined) ?? '--',
  }
})

const keyword = ref('')

const selectedSentenceIndex = ref(1)
const totalSentences = 0
const selectedToken = ref('')
const feedback = ref('')
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8">
    <div class="flex flex-col gap-8">
      <div class="flex items-start justify-between gap-6 flex-wrap">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">练习提交</h2>
          <div class="flex flex-wrap items-center gap-3">
            <div class="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-black text-gray-600">
              班级: {{ meta.classLabel }}
            </div>
            <div class="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-black text-gray-600">
              内容 ID: {{ meta.contentId }}
            </div>
            <div class="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-black text-gray-600">
              Session ID: {{ meta.sessionId }}
            </div>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
          @click="router.push('/teacher/submissions')"
        >
          <ChevronLeft class="w-4 h-4" />
          返回练习管理
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section class="xl:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <h3 class="text-lg font-black text-gray-900">学生提交列表</h3>
            <div class="flex items-center gap-3">
              <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Search class="w-4 h-4 text-gray-400" />
                <input
                  v-model="keyword"
                  class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400 w-52"
                  placeholder="筛选"
                />
              </div>
              <div class="w-11 h-11 rounded-2xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center">
                <Filter class="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-100">
            <table class="w-full text-left">
              <thead class="bg-[#F8F9FA]">
                <tr class="text-xs font-black text-gray-400 uppercase tracking-widest">
                  <th class="px-5 py-4">学生</th>
                  <th class="px-5 py-4">尝试序号</th>
                  <th class="px-5 py-4">状态</th>
                  <th class="px-5 py-4">提交时间</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr>
                  <td class="px-5 py-4" colspan="4">
                    <div class="flex flex-col gap-3">
                      <SkeletonBlock class="h-10 w-full" />
                      <SkeletonBlock class="h-10 w-full" />
                      <SkeletonBlock class="h-10 w-full" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between text-sm font-bold text-gray-400">
            <div>显示 1 到 6，共 24 个条目</div>
            <div class="text-sm font-black text-gray-500">历史</div>
          </div>
        </section>

        <section class="xl:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-gray-900">作业内容</h3>
            <div class="text-sm font-bold text-gray-400">DRAFT SAVED</div>
          </div>

          <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4">
            <div class="text-sm font-extrabold text-gray-900 mb-2">选择一个句子进行批改</div>
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-bold text-gray-500">第 <span class="font-black text-gray-900">{{ selectedSentenceIndex }}</span> / {{ totalSentences }} 句</div>
              <input
                v-model.number="selectedSentenceIndex"
                type="range"
                min="1"
                :max="totalSentences"
                class="w-40"
                :disabled="totalSentences === 0"
              />
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="text-xs font-black text-gray-400 uppercase tracking-widest">发音检测 / PRONUNCIATION</div>
            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
              <div class="text-lg font-black text-gray-900">{{ selectedToken || '--' }}</div>
              <div class="text-sm font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">待接入</div>
            </div>

            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4">
              <div class="flex items-center justify-between text-sm font-bold text-gray-500 mb-3">
                <span>0:04 / 0:12</span>
                <Mic class="w-4 h-4 text-gray-500" />
              </div>
              <div class="h-2 rounded-full bg-white border border-gray-100 overflow-hidden">
                <div class="h-full w-1/3 bg-[#70C125]" />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="text-xs font-black text-gray-400 uppercase tracking-widest">教师评语 / Feedback</div>
            <textarea
              v-model="feedback"
              class="w-full min-h-[140px] bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 outline-none resize-none text-sm font-medium text-gray-800 placeholder:text-gray-400"
              placeholder="在此输入针对该句子的具体反馈..."
            />
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Mic class="w-4 h-4" />
              语音评注
            </button>
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Paperclip class="w-4 h-4" />
              附件
            </button>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-black text-gray-700 hover:bg-gray-50">
              取消
            </button>
            <button type="button" class="bg-[#70C125] text-white rounded-2xl px-5 py-3 text-sm font-black hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2">
              <Save class="w-4 h-4" />
              提交所有批改
            </button>
          </div>
          <!-- TODO: 接入教师批改接口（后端文档暂未提供：提交 teacher_score / teacher_notes 的 API）。此页面仅保留结构与导航。 -->
        </section>
      </div>
    </div>
  </main>
</template>
