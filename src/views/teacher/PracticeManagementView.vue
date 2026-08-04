<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherDashboard, getTeacherClassContents } from '../../api/endpoints'
import type { TeacherDashboardResponse, TeacherContentItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const dashReq = useAsync<TeacherDashboardResponse>()
const dashData = ref<TeacherDashboardResponse | null>(null)
const contentList = ref<TeacherContentItem[]>([])

onMounted(load)

async function load() {
  dashData.value = await dashReq.run(async () => getTeacherDashboard())
  if (dashData.value) {
    try {
      const res = await getTeacherClassContents('mock-class-001')
      contentList.value = res.content_list ?? []
    } catch {}
  }
}

const statCards = [
  { label: '内容总数', key: 'total_content' as const, color: '#01658B' },
  { label: '活跃班级', key: 'total_classes' as const, color: '#356B00' },
  { label: '学生总数', key: 'total_students' as const, color: '#FFB800' },
  { label: '待处理', key: null as null, color: '#BA1A1A', fallback: '-' },
]

const tableHeaders = ['内容标题', '创建时间', '更新时间', '状态', '操作']
</script>

<template>
  <div class="p-6 flex flex-col gap-[22px]">
    <ErrorState
      v-if="dashReq.error.value"
      :message="dashReq.error.value"
      :busy="dashReq.loading.value"
      @retry="load()"
    />

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">内容管理</h2>
          <p class="text-sm font-bold text-[#9CA3AF] mt-1">管理和发布教学练习内容</p>
        </div>
        <button
          type="button"
          class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="!selectedClassId"
          @click="openCreate"
        >
          <Plus class="w-5 h-5" />
          创建练习
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">班级</span>
          <select
            v-model="selectedClassId"
            class="w-full bg-transparent outline-none text-sm font-bold text-gray-800"
            @change="loadContents"
          >
            <option v-for="c in classes" :key="c.class_id" :value="c.class_id">
              {{ c.class_name }}
            </option>
          </select>
        </label>

        <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 lg:col-span-2">
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">练习标题</span>
          <div class="flex items-center gap-2">
            <Search class="w-4 h-4 text-gray-400" />
            <input
              v-model="filters.title"
              class="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
              placeholder="输入标题"
            />
          </div>
        </label>

        <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">练习类型</span>
          <select
            v-model="filters.type"
            class="w-full bg-transparent outline-none text-sm font-bold text-gray-800"
          >
            <option value="所有类型">所有类型</option>
            <option value="句子练习">句子练习</option>
            <option value="单词练习">单词练习</option>
            <option value="综合作业">综合作业</option>
          </select>
        </label>
      </div>
    </section>

    <ErrorState
      v-if="contentsReq.error.value"
      title="加载失败"
      message="无法获取班级内容列表，请稍后重试。"
      :busy="contentsReq.loading.value"
      @retry="loadContents"
    />

    <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <h3 class="text-lg font-black text-gray-900">已有练习列表</h3>
        <p class="text-sm font-bold text-gray-400">已显示所有 {{ filteredPractices.length }} 个练习项目</p>
      </div>

      <div v-if="contentsReq.loading.value" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonBlock class="h-36 w-full" />
        <SkeletonBlock class="h-36 w-full" />
        <SkeletonBlock class="h-36 w-full" />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          v-for="practice in filteredPractices"
          :key="practice.id"
          class="bg-[#F8F9FA] border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <h4 class="text-lg font-extrabold text-gray-900">{{ practice.title }}</h4>
              <div class="text-sm font-bold text-gray-400">ID: {{ practice.id }}</div>
            </div>
            <div class="px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs font-black text-gray-500">
              {{ practice.type }}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div v-if="practice.attemptsLimit" class="text-sm font-bold text-gray-600">
              次数限制 {{ practice.attemptsLimit }}
            </div>
            <div class="text-sm font-bold text-gray-600">创建于 {{ practice.createdAt }}</div>
          </div>

          <button
            type="button"
            class="mt-auto bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-blue-200 hover:bg-blue-50 transition-colors"
            @click="openSubmissions(practice.id)"
          >
            <span class="text-sm font-black text-blue-600">查看提交</span>
            <ChevronRight class="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-0">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex items-center justify-between"
          :style="{ borderLeft: `4px solid ${card.color}` }"
        >
          <div class="flex flex-col gap-2">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">{{ card.label }}</span>
            <span class="text-3xl font-black text-[#1F2937]">
              <SkeletonBlock v-if="dashReq.loading.value" class="w-12 h-8 rounded" />
              <template v-else>{{ card.key ? (dashData as any)?.[card.key] ?? '-' : card.fallback }}</template>
            </span>
          </div>
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: `${card.color}1A` }"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="card.color" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <h3 class="text-base font-black text-[#1F2937]">内容列表</h3>
          <div class="flex items-center gap-2">
            <button class="text-sm font-bold text-[#9CA3AF] hover:text-[#1F2937] transition-colors">导出</button>
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC]">
              <th v-for="h in tableHeaders" :key="h" class="text-left px-6 py-3 text-xs font-black text-[#64748B] uppercase tracking-wider">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="contentList.length === 0 && !dashReq.loading.value">
              <td :colspan="tableHeaders.length" class="text-center py-16 text-sm font-bold text-[#9CA3AF]">
                暂无内容，点击「创建新内容」开始
              </td>
            </tr>
            <tr
              v-for="item in contentList"
              :key="item.content_id"
              class="border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
            >
              <td class="px-6 py-4 text-sm font-bold text-[#1F2937]">{{ item.title || '未命名' }}</td>
              <td class="px-6 py-4 text-sm text-[#64748B]">{{ item.created_at?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4 text-sm text-[#64748B]">{{ item.updated_at?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black',
                    item.is_active ? 'bg-[#F2F5E8] text-[#356B00]' : 'bg-[#F1F5F9] text-[#94A3B8]',
                  ]"
                >
                  {{ item.is_active ? '活跃' : '停用' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button class="text-xs font-bold text-[#356B00] hover:underline">编辑</button>
                  <button class="text-xs font-bold text-[#94A3B8] hover:text-[#475569]">查看</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9] bg-[rgba(248,250,252,0.5)]">
          <span class="text-sm text-[#64748B] font-bold">共 {{ contentList.length }} 项</span>
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-[#9CA3AF] hover:bg-[#F1F5F9] disabled:opacity-30" disabled>‹</button>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold bg-[#F2F5E8] text-[#356B00]">1</button>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-[#9CA3AF] hover:bg-[#F1F5F9] disabled:opacity-30" disabled>›</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
