<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, Plus, Search, Filter, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getTeacherClassContents, getTeacherClasses, type TeacherClassItem, type TeacherTaskItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

type PracticeType = '句子练习' | '单词练习' | '综合作业'

type PracticeItem = {
  id: string
  title: string
  type: PracticeType
  attemptsLimit?: number
  createdAt: string
}

const router = useRouter()

const classesReq = useAsync<TeacherClassItem[]>()
const contentsReq = useAsync<TeacherTaskItem[]>()

const selectedClassId = ref<string | null>(null)

const filters = ref({
  title: '',
  type: '所有类型' as '所有类型' | PracticeType,
})

const classes = computed(() => classesReq.data.value ?? [])

const practices = computed<PracticeItem[]>(() => {
  const list = contentsReq.data.value ?? []
  return list.map((c) => ({
    id: String(c.task_id),
    title: c.title ?? `任务 ${c.task_id}`,
    type: c.task_type === 'practice' ? '句子练习' : '综合作业',
    attemptsLimit: c.max_attempt ?? undefined,
    createdAt: c.available_from ?? '--',
  }))
})

const filteredPractices = computed(() => {
  const title = filters.value.title.trim().toLowerCase()
  const type = filters.value.type
  return practices.value.filter((p) => {
    const okTitle = !title || p.title.toLowerCase().includes(title)
    const okType = type === '所有类型' || p.type === type
    return okTitle && okType
  })
})

const loadClasses = async () => {
  await classesReq.run(async () => getTeacherClasses())
  if (!selectedClassId.value && classes.value.length) selectedClassId.value = classes.value[0].class_id
}

const loadContents = async () => {
  if (!selectedClassId.value) return
  await contentsReq.run(async () => getTeacherClassContents(selectedClassId.value!))
}

onMounted(async () => {
  await loadClasses()
  await loadContents()
})

const openCreate = () => {
  router.push({ path: '/teacher/assignments/create', query: selectedClassId.value ? { classId: selectedClassId.value } : {} })
}

const openSubmissions = (practiceId: string) => {
  router.push({ path: '/teacher/submissions', query: { taskId: practiceId, classId: selectedClassId.value ?? undefined } })
}
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex items-start justify-between gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">练习管理</h2>
        <p class="text-sm font-bold text-gray-400">管理和创建您的法语学习练习任务</p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
        @click="router.push('/teacher/overview')"
      >
        <ChevronLeft class="w-4 h-4" />
        教师版
      </button>
    </div>

    <ErrorState
      v-if="classesReq.error.value"
      title="加载失败"
      message="无法获取班级列表，请稍后重试。"
      :busy="classesReq.loading.value"
      @retry="loadClasses"
    />

    <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <Filter class="w-5 h-5 text-gray-700" />
          </div>
          <h3 class="text-lg font-black text-gray-900">筛选</h3>
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
    </section>
  </main>
</template>
