<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CalendarDays, CheckCircle2, Construction, GraduationCap, Hash, Layers3, Loader2, Save } from 'lucide-vue-next'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'
import {
  editUserInfo,
  getStudentArchiveStatistics,
  getUserDetail,
  type EditUserInfoPayload,
  type StudentArchiveStatistics,
  type UserDetail,
} from '../../api/endpoints'
import { isApiError } from '../../api/errors'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import { useAuth } from '../../stores/auth'
import router from '../../router'

const auth = useAuth()
const toast = useToast()
const userReq = useAsync<Awaited<ReturnType<typeof getUserDetail>>>()
const archiveReq = useAsync<Awaited<ReturnType<typeof getStudentArchiveStatistics>>>()

const session = computed(() => auth.session.value)
const userDetail = computed<UserDetail | undefined>(() => userReq.data.value?.data)
const archive = computed<StudentArchiveStatistics | undefined>(() => archiveReq.data.value?.statistics)
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
const schoolName = computed(() => userDetail.value?.school?.school_name ?? '暂无学校信息')
const isActiveLabel = computed(() => {
  if (userDetail.value?.is_active === true) return '已启用'
  if (userDetail.value?.is_active === false) return '已停用'
  return '状态未知'
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

// 资料表单：默认留空，由用户自行填写后保存
const form = reactive({
  gender: '' as '' | 'true' | 'false',
  email: '',
  phone: '',
})
const saving = ref(false)

/** 服务端数据变化时同步表单，未填写的字段保持空白 */
const syncForm = () => {
  const detail = userDetail.value
  form.gender = detail?.gender === true ? 'true' : detail?.gender === false ? 'false' : ''
  form.email = detail?.email ?? ''
  form.phone = detail?.phone ?? ''
}

const saveForm = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const payload: EditUserInfoPayload = {
      email: form.email.trim(),
      phone: form.phone.trim(),
    }
    if (form.gender !== '') payload.gender = form.gender === 'true'

    await editUserInfo(payload)

    try {
      const res = await getUserDetail()
      userReq.data.value = res
    } catch {
      // 详情刷新失败时保留当前界面，保存结果仍有效
    }
    syncForm()
    toast.push('资料已保存', 'success')
  } catch (e) {
    toast.push(isApiError(e) ? e.message : '保存失败，请稍后重试', 'error')
  } finally {
    saving.value = false
  }
}

const loadAll = async () => {
  await Promise.all([
    userReq.run(() => getUserDetail()),
    archiveReq.run(() => getStudentArchiveStatistics()),
  ])
  syncForm()
}

const hasError = computed(() => userReq.error.value || archiveReq.error.value)
const isLoading = computed(() => userReq.loading.value || archiveReq.loading.value)

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

          <form v-else class="flex flex-col gap-3" @submit.prevent="saveForm">
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400">学校</span>
              <span class="text-sm font-black text-gray-900">{{ schoolName }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
                <span class="text-xs font-black text-gray-400">性别</span>
                <select
                  v-model="form.gender"
                  class="bg-transparent text-sm font-black text-gray-900 outline-none"
                >
                  <option value="">未填写</option>
                  <option value="true">男</option>
                  <option value="false">女</option>
                </select>
              </label>
              <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
                <span class="text-xs font-black text-gray-400">账号状态</span>
                <span class="text-sm font-black text-gray-900">{{ isActiveLabel }}</span>
              </div>
            </div>
            <label class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400">邮箱</span>
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="请输入邮箱"
                class="bg-transparent text-sm font-black text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-bold"
              />
            </label>
            <label class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-1">
              <span class="text-xs font-black text-gray-400">手机号</span>
              <input
                v-model="form.phone"
                type="tel"
                autocomplete="tel"
                placeholder="请输入手机号"
                class="bg-transparent text-sm font-black text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-bold"
              />
            </label>

            <button
              type="submit"
              :disabled="saving || userReq.loading.value"
              class="mt-1 inline-flex items-center justify-center gap-2 bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              保存
            </button>
          </form>
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

        <!-- Activity Overview -->
        <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-lg font-black text-gray-900">活跃概览</h3>
            <span class="px-2 py-1 rounded-full bg-[#E5E7EB] text-[10px] font-black text-[#6B7280]">
              开发中
            </span>
          </div>

          <div class="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FA] py-10 flex flex-col items-center justify-center gap-2">
            <Construction class="w-6 h-6 text-gray-300" />
            <span class="text-sm font-black text-gray-400">该功能开发中，敬请期待</span>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
