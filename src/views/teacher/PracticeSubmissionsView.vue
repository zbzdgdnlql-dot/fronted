<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, Filter, Search, ChevronRight } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { getTeacherCustomContentRecords, type TeacherContentRecordsStudent } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

type SubmissionStatus = '已提交' | '待提交' | '已批改'

type SubmissionItem = {
  studentId: string
  studentName: string
  attempt: number
  status: SubmissionStatus
  submittedAt: string
  action: '批改'
  sessionId: string
}

const router = useRouter()
const route = useRoute()

const meta = computed(() => {
  const contentId = (route.query.contentId as string | undefined) ?? ''
  return {
    classLabel: (route.query.classId as string | undefined) ?? '--',
    contentId,
  }
})

const keyword = ref('')

const req = useAsync<TeacherContentRecordsStudent[]>()

const submissions = computed<SubmissionItem[]>(() => {
  const list = req.data.value ?? []
  const rows: SubmissionItem[] = []
  list.forEach((s) => {
    s.records.forEach((r, idx) => {
      rows.push({
        studentId: s.user_id,
        studentName: s.username,
        attempt: idx + 1,
        status: '已提交',
        submittedAt: r.completed_at || '--',
        action: '批改',
        sessionId: r.session_id,
      })
    })
  })
  return rows
})

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return submissions.value
  return submissions.value.filter((s) => s.studentName.toLowerCase().includes(k) || s.studentId.toLowerCase().includes(k))
})

const openGrading = (item: SubmissionItem) => {
  router.push({
    path: '/teacher/grading',
    query: { student: item.studentName, contentId: meta.value.contentId, sessionId: item.sessionId },
  })
}

const load = async () => {
  if (!meta.value.contentId) return
  await req.run(async () => getTeacherCustomContentRecords(meta.value.contentId))
}

onMounted(load)
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
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
          @click="router.push('/teacher/content')"
        >
          <ChevronLeft class="w-4 h-4" />
          返回练习管理
        </button>
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
            <div>显示 1 到 6，共 24 个条目</div>
            <button type="button" class="text-sm font-black text-gray-500 hover:text-gray-700">
              历史
            </button>
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
  </main>
</template>
