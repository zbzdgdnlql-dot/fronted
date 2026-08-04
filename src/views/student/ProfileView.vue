<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { CalendarDays, CheckCircle2, GraduationCap, Hash, History, Layers3 } from 'lucide-vue-next'
import avatarUrl from '../../assets/figma/avatar.png'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'
import {
  getStudentArchiveStatistics,
  getStudentHistoryWords,
  getUserDetail,
  type StudentArchiveStatistics,
  type UserDetail,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useAuth } from '../../stores/auth'
import router from '../../router'

const auth = useAuth()
const userReq = useAsync<Awaited<ReturnType<typeof getUserDetail>>>()
const archiveReq = useAsync<Awaited<ReturnType<typeof getStudentArchiveStatistics>>>()
const wordsReq = useAsync<Awaited<ReturnType<typeof getStudentHistoryWords>>>()

const session = computed(() => auth.session.value)
const userDetail = computed<UserDetail | undefined>(() => userReq.data.value?.data)
const archive = computed<StudentArchiveStatistics | undefined>(() => archiveReq.data.value?.statistics)
const words = computed(() => wordsReq.data.value?.words ?? [])
const classes = computed(() =>
  (userDetail.value?.classes ?? []).map((item) => ({
    id: item.class_id,
    name: item.class_name,
    meta: item.grade_level ? `年级：${item.grade_level}` : '暂无年级信息',
  }))
)

const displayName = computed(() => userDetail.value?.username || `学生 ${session.value?.user_id ?? ''}`.trim())
const handle = computed(() => `@${userDetail.value?.stu_id ?? session.value?.user_id ?? 'guest'}`)
const currentClass = computed(() => {
  const currentClassId = auth.session.value?.class_context?.class_id
  return userDetail.value?.classes.find((item) => item.class_id === currentClassId)?.class_name
    ?? auth.session.value?.class_context?.class_name
    ?? '未选择班级'
})
const avatarSrc = computed(() => userDetail.value?.avatar_url || avatarUrl)
const schoolName = computed(() => userDetail.value?.school?.school_name ?? '暂无学校信息')
const genderLabel = computed(() => {
  if (userDetail.value?.gender === true) return '男'
  if (userDetail.value?.gender === false) return '女'
  return '未填写'
})

const formatDate = (value: string | null | undefined) => {
  if (!value) return '暂无记录'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const statCards = computed(() => [
  { label: '完成条目', value: archive.value?.total_entries ?? 0, icon: CheckCircle2 },
  {
    label: '平均分',
    value: archive.value && archive.value.average_score >= 0 ? archive.value.average_score.toFixed(1) : '--',
    icon: Layers3,
  },
  {
    label: '最高分',
    value: archive.value && archive.value.max_score >= 0 ? archive.value.max_score.toFixed(1) : '--',
    icon: GraduationCap,
  },
])

const loadAll = async () => {
  await Promise.all([
    userReq.run(() => getUserDetail()),
    archiveReq.run(() => getStudentArchiveStatistics()),
    wordsReq.run(() => getStudentHistoryWords()),
  ])
}

const hasError = computed(() => userReq.error.value || archiveReq.error.value || wordsReq.error.value)
const isLoading = computed(() => userReq.loading.value || archiveReq.loading.value || wordsReq.loading.value)

onMounted(() => {
  void loadAll()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex items-center justify-between gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">个人中心</h2>
        <p class="text-sm font-bold text-gray-400">查看身份信息、班级归属与评测概览。</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
        @click="router.push('/')"
      >
        返回主页
      </button>
    </div>

    <ErrorState
      v-if="hasError && !isLoading"
      message="无法获取个人中心数据，请检查登录状态或稍后重试。"
      :busy="isLoading"
      @retry="loadAll"
    />

    <div v-else class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <!-- Left Sidebar -->
      <aside class="xl:col-span-4 flex flex-col gap-5">
        <!-- User Profile Card -->
        <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row xl:flex-col gap-5">
            <SkeletonBlock v-if="userReq.loading.value" class="w-32 h-32 rounded-full" />
            <img
              v-else
              :src="avatarSrc"
              alt="Avatar"
              class="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-blue-50"
            />
            <div class="flex flex-col gap-3">
              <div v-if="userReq.loading.value" class="flex flex-col gap-3">
                <SkeletonBlock class="h-8 w-44" />
                <SkeletonBlock class="h-5 w-28" />
              </div>
              <div v-else>
                <h3 class="text-2xl font-black text-gray-900 leading-tight">{{ displayName }}</h3>
                <p class="text-base font-bold text-gray-400">{{ handle }}</p>
              </div>
              <span class="w-fit rounded-full bg-[#EAF0DD] px-4 py-1.5 text-xs font-black text-[#70C125]">
                Student
              </span>
            </div>
          </div>

          <div class="h-px bg-gray-100"></div>

          <div class="flex flex-col gap-3 text-sm font-bold text-gray-600">
            <div class="flex items-center gap-3">
              <Hash class="w-4 h-4 text-gray-400" />
              <span>ID {{ userDetail?.user_id ?? session?.user_id ?? '--' }}</span>
            </div>
            <div class="flex items-center gap-3">
              <Hash class="w-4 h-4 text-gray-400" />
              <span>学号 {{ userDetail?.stu_id ?? '--' }}</span>
            </div>
            <div class="flex items-center gap-3">
              <GraduationCap class="w-4 h-4 text-gray-400" />
              <span>{{ currentClass }}</span>
            </div>
            <div class="flex items-center gap-3">
              <CalendarDays class="w-4 h-4 text-gray-400" />
              <span>加入于 {{ formatDate(userDetail?.created_at) }}</span>
            </div>
          </div>
        </section>

        <!-- Profile Details -->
        <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <h3 class="text-lg font-black text-gray-900">资料</h3>

          <template v-if="userReq.loading.value">
            <SkeletonBlock class="h-12 w-full" />
            <SkeletonBlock class="h-12 w-full" />
            <SkeletonBlock class="h-12 w-full" />
          </template>

          <div v-else class="flex flex-col gap-3">
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400">学校</span>
              <span class="text-sm font-black text-gray-900">{{ schoolName }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
                <span class="text-xs font-black text-gray-400">性别</span>
                <span class="text-sm font-black text-gray-900">{{ genderLabel }}</span>
              </div>
              <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
                <span class="text-xs font-black text-gray-400">账号状态</span>
                <span class="text-sm font-black text-gray-900">{{ userDetail?.is_active === true ? '已启用' : userDetail?.is_active === false ? '已停用' : '状态未知' }}</span>
              </div>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400">邮箱</span>
              <span class="text-sm font-black text-gray-900 break-all">{{ userDetail?.email ?? '未填写' }}</span>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400">手机号</span>
              <span class="text-sm font-black text-gray-900">{{ userDetail?.phone ?? '未填写' }}</span>
            </div>
          </div>
        </section>

        <!-- Classes -->
        <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-lg font-black text-gray-900">班级</h3>
            <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-500">{{ classes.length }}</span>
          </div>

          <template v-if="userReq.loading.value">
            <SkeletonBlock class="h-16 w-full" />
            <SkeletonBlock class="h-16 w-full" />
          </template>

          <EmptyState
            v-else-if="!classes.length"
            title="暂无班级"
            description="你还未加入任何班级。"
          />

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="item in classes"
              :key="item.id"
              class="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4 flex flex-col gap-1"
            >
              <span class="text-sm font-black text-gray-900">{{ item.name }}</span>
              <span class="text-xs font-bold text-gray-400">{{ item.meta }}</span>
            </div>
          </div>
        </section>
      </aside>

      <!-- Right Content -->
      <section class="xl:col-span-8 flex flex-col gap-6">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <template v-if="archiveReq.loading.value">
            <SkeletonBlock v-for="n in 3" :key="n" class="h-28 w-full" />
          </template>

          <article
            v-for="item in statCards"
            v-else
            :key="item.label"
            class="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-4"
          >
            <div class="w-10 h-10 rounded-2xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center">
              <component :is="item.icon" class="w-5 h-5 text-[#70C125]" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest">{{ item.label }}</span>
              <strong class="text-3xl font-black text-gray-900">{{ item.value }}</strong>
            </div>
          </article>
        </div>

        <!-- History Words -->
        <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <History class="w-5 h-5 text-gray-400" />
              <h3 class="text-lg font-black text-gray-900">历史单词</h3>
            </div>
            <span class="rounded-full bg-[#EAF0DD] px-4 py-1.5 text-xs font-black text-[#70C125]">{{ words.length }} 个</span>
          </div>

          <template v-if="wordsReq.loading.value">
            <SkeletonBlock class="h-10 w-full" />
            <SkeletonBlock class="h-10 w-3/4" />
          </template>

          <EmptyState
            v-else-if="!words.length"
            title="暂无历史单词"
            description="完成评测后，单词将出现在这里。"
          />

          <div v-else class="flex flex-wrap gap-3">
            <span
              v-for="word in words.slice(0, 24)"
              :key="word"
              class="rounded-2xl border border-gray-100 bg-[#F8F9FA] px-4 py-2 text-sm font-black text-gray-700"
            >
              {{ word }}
            </span>
          </div>
        </section>

        <!-- Activity Overview -->
        <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-lg font-black text-gray-900">活跃概览</h3>
            <span class="text-xs font-black text-gray-400">评测活动</span>
          </div>

          <div class="grid grid-cols-7 gap-2 max-w-[420px]">
            <div
              v-for="cell in Array.from({ length: 35 }, (_, i) => i)"
              :key="cell"
              class="aspect-square rounded-md border border-white"
              :class="archive?.total_entries ? 'bg-[#DCEFCC]' : 'bg-gray-100'"
            ></div>
          </div>

          <div class="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>少</span>
            <span class="w-3 h-3 rounded-sm bg-gray-100"></span>
            <span class="w-3 h-3 rounded-sm bg-[#DCEFCC]"></span>
            <span class="w-3 h-3 rounded-sm bg-[#BEE994]"></span>
            <span class="w-3 h-3 rounded-sm bg-[#8FD64B]"></span>
            <span class="w-3 h-3 rounded-sm bg-[#70C125]"></span>
            <span>多</span>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
