<script setup lang="ts">
import { ref, computed } from 'vue'

interface Submission {
  id: string
  studentName: string
  contentTitle: string
  score: number | null
  status: 'pending' | 'graded'
  submittedAt: string
}

const submissions = ref<Submission[]>([])
const filterClass = ref('all')

const stats = computed(() => ({
  total: submissions.value.length,
  pending: submissions.value.filter(s => s.status === 'pending').length,
  graded: submissions.value.filter(s => s.status === 'graded').length,
  avgScore: submissions.value.reduce((sum, s) => sum + (s.score ?? 0), 0) / (submissions.value.filter(s => s.score != null).length || 1),
}))

const heading = '法语精读1班 · 练习提交'
</script>

<template>
  <div class="p-8 flex flex-col gap-8">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">{{ heading }}</h2>
        <p class="text-sm font-bold text-[#9CA3AF] mt-1">查看和批改学生的德语发音练习</p>
      </div>
      <select
        v-model="filterClass"
        class="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold text-[#475569] outline-none focus:border-[#58CC02]"
      >
        <option value="all">全部班级</option>
        <option value="mock-class-001">法语精读1班</option>
      </select>
    </div>

    <div class="flex gap-8">
      <div class="flex-1 flex flex-col gap-0">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div class="bg-[#F8FAFC] px-6 py-3 grid grid-cols-5 gap-4">
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">学生</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">练习内容</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">得分</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">状态</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">提交时间</span>
          </div>

          <div v-if="submissions.length === 0" class="py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-[#F1F5F9] mx-auto flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <p class="text-sm font-bold text-[#9CA3AF]">暂无提交记录</p>
          </div>

          <div
            v-for="sub in submissions"
            :key="sub.id"
            class="grid grid-cols-5 gap-4 px-6 py-4 border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <span class="text-sm font-bold text-[#1F2937]">{{ sub.studentName }}</span>
            <span class="text-sm text-[#64748B]">{{ sub.contentTitle }}</span>
            <span class="text-sm font-bold" :class="sub.score != null ? 'text-[#1F2937]' : 'text-[#9CA3AF]'">{{ sub.score ?? '—' }}</span>
            <span>
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black',
                  sub.status === 'graded'
                    ? 'bg-[#F2F5E8] text-[#356B00]'
                    : 'bg-[#FFF7ED] text-[#F59E0B]',
                ]"
              >
                {{ sub.status === 'graded' ? '已批改' : '待批改' }}
              </span>
            </span>
            <span class="text-sm text-[#9CA3AF]">{{ sub.submittedAt }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <ErrorState
          v-if="req.error.value"
          class="xl:col-span-8"
          title="加载失败"
          message="无法获取提交列表，请稍后重试。"
          :busy="req.loading.value"
          @retry="load"
        />

        <section v-else class="xl:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
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
                  <th class="px-5 py-4">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr v-if="req.loading.value">
                  <td class="px-5 py-4" colspan="5">
                    <div class="flex flex-col gap-3">
                      <SkeletonBlock class="h-10 w-full" />
                      <SkeletonBlock class="h-10 w-full" />
                      <SkeletonBlock class="h-10 w-full" />
                    </div>
                  </td>
                </tr>
                <tr
                  v-else-if="filtered.length === 0"
                >
                  <td class="px-5 py-8 text-sm font-bold text-gray-500" colspan="5">暂无提交</td>
                </tr>
                <tr
                  v-else
                  v-for="(item, idx) in filtered"
                  :key="item.studentId + item.sessionId"
                  :class="idx !== filtered.length - 1 ? 'border-b border-gray-100' : ''"
                >
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-black text-gray-700">
                        {{ item.studentName.slice(0, 2).toUpperCase() }}
                      </div>
                      <div class="text-sm font-extrabold text-gray-900">{{ item.studentName }}</div>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-sm font-black text-gray-700">{{ item.attempt }}</td>
                  <td class="px-5 py-4">
                    <span
                      :class="[
                        'px-3 py-1.5 rounded-full text-xs font-black',
                        item.status === '已提交' ? 'bg-blue-50 text-blue-600' : '',
                        item.status === '待提交' ? 'bg-gray-100 text-gray-500' : '',
                        item.status === '已批改' ? 'bg-[#EAF0DD] text-[#70C125]' : '',
                      ]"
                    >
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-sm font-bold text-gray-600">{{ item.submittedAt }}</td>
                  <td class="px-5 py-4">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700"
                      @click="openGrading(item)"
                    >
                      {{ item.action }}
                      <ChevronRight class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between text-sm font-bold text-gray-400">
            <div>共 {{ filtered.length }} 条提交记录</div>
            <div class="text-sm font-black text-gray-500">历史</div>
          </div>
        </section>

        <aside class="xl:col-span-4 flex flex-col gap-8">
          <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
            <h3 class="text-lg font-black text-gray-900">提交概览</h3>
            <div class="flex flex-col gap-4">
              <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                <div class="text-xs font-black text-gray-400 uppercase tracking-widest">提交率</div>
                <div class="text-xl font-black text-gray-900">--</div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-1">
                  <div class="text-xs font-black text-gray-400 uppercase tracking-widest">待批改</div>
                  <div class="text-2xl font-black text-gray-900">--</div>
                </div>
                <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-1">
                  <div class="text-xs font-black text-gray-400 uppercase tracking-widest">已完成</div>
                  <div class="text-2xl font-black text-gray-900">--</div>
                </div>
              </div>
            </div>
            <!-- TODO: 后端若提供统计字段（提交率/待批改/已完成），在此处接入并展示。 -->
          </section>

          <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
            <h3 class="text-lg font-black text-gray-900">最近动态</h3>
            <div class="flex flex-col gap-4">
              <div class="flex items-start justify-between gap-4">
                <div class="text-sm font-extrabold text-gray-900">系统 已发送到期提醒</div>
                <div class="text-sm font-bold text-gray-400">10分钟前</div>
              </div>
              <div class="flex items-start justify-between gap-4">
                <div class="text-sm font-extrabold text-gray-900">系统 已发送到期提醒</div>
                <div class="text-sm font-bold text-gray-400">1小时前</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>
