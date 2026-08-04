<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Plus, Search, Trash2, UserPlus, BarChart3 } from 'lucide-vue-next'
import { useAsync } from '../../composables/useAsync'
import {
  getClassManage,
  addStudentToClass,
  removeStudentFromClass,
  type ClassManageResponse,
} from '../../api/endpoints'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const classId = computed(() => route.params.classId as string)
const searchQuery = ref('')
const addStudentId = ref('')

const classReq = useAsync<ClassManageResponse | null>()
const addingReq = useAsync<unknown>()
const removingReq = useAsync<unknown>()

const classData = computed(() => classReq.data.value)
const members = computed(() => classData.value?.members ?? [])
const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return members.value
  const q = searchQuery.value.toLowerCase()
  return members.value.filter(m =>
    m.username.toLowerCase().includes(q) ||
    (m.stu_id && m.stu_id.toLowerCase().includes(q))
  )
})

const load = async () => {
  await classReq.run(() => getClassManage(classId.value))
}

const handleAddStudent = async () => {
  if (!addStudentId.value.trim()) return
  await addingReq.run(() => addStudentToClass(classId.value, addStudentId.value.trim()))
  if (!addingReq.error.value) {
    toast.push('学生已添加', 'success')
    addStudentId.value = ''
    void load()
  }
}

const handleRemoveStudent = async (userId: number) => {
  await removingReq.run(() => removeStudentFromClass(classId.value, userId))
  if (!removingReq.error.value) {
    toast.push('学生已移除', 'success')
    void load()
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <nav class="flex items-center gap-2 text-sm font-bold text-gray-400">
      <button
        type="button"
        class="hover:text-gray-600 transition-colors"
        @click="router.push('/teacher/classes')"
      >
        班级管理
      </button>
      <span>/</span>
      <span class="text-gray-800">{{ classData?.class_name || '加载中...' }}</span>
    </nav>

    <ErrorState
      v-if="classReq.error.value"
      title="加载失败"
      message="无法获取班级信息，请稍后重试。"
      :busy="classReq.loading.value"
      @retry="load"
    />

    <template v-if="classReq.loading.value">
      <SkeletonBlock class="h-12 w-64" />
      <SkeletonBlock class="h-80 w-full" />
    </template>

    <template v-else-if="classData">
      <div class="flex items-center justify-between gap-6 flex-wrap">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">{{ classData.class_name }}</h2>
          <p class="text-sm font-bold text-gray-400">{{ members.length }} 名学生</p>
        </div>
      </div>

      <!-- Add Student -->
      <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#F4FAEE] border border-[#EAF0DD] flex items-center justify-center">
            <UserPlus class="w-5 h-5 text-[#70C125]" />
          </div>
          <h3 class="text-lg font-black text-gray-900">添加学生</h3>
        </div>
        <div class="flex items-center gap-3">
          <input
            v-model="addStudentId"
            class="flex-1 bg-[#F8F9FA] border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#70C125] focus:bg-white transition-colors"
            placeholder="输入学生 ID 或用户名..."
            @keyup.enter="handleAddStudent"
          />
          <button
            type="button"
            class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="!addStudentId.trim() || addingReq.loading.value"
            @click="handleAddStudent"
          >
            <Plus class="w-5 h-5" />
            添加
          </button>
        </div>
        <p v-if="addingReq.error.value" class="text-sm font-bold text-red-500">{{ addingReq.error.value }}</p>
      </div>

      <!-- Member List -->
      <section class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h3 class="text-lg font-black text-gray-900">成员列表</h3>
          <div class="flex items-center gap-2 bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-2">
            <Search class="w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400 w-36"
              placeholder="搜索成员..."
            />
          </div>
        </div>

        <EmptyState
          v-if="!filteredMembers.length && !searchQuery"
          title="暂无成员"
          description="使用上方输入框添加学生到班级。"
        />

        <div v-else-if="!filteredMembers.length && searchQuery" class="px-6 py-8 text-sm font-bold text-gray-400 text-center">
          未找到匹配的成员
        </div>

        <template v-else>
          <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-[#F8F9FA] border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
            <div class="col-span-3">用户名</div>
            <div class="col-span-2">学号</div>
            <div class="col-span-2">用户类型</div>
            <div class="col-span-3">加入时间</div>
            <div class="col-span-2 text-right">操作</div>
          </div>

          <div
            v-for="member in filteredMembers"
            :key="member.user_id"
            class="grid grid-cols-12 gap-4 px-6 py-5 border-b border-gray-50 items-center hover:bg-[#F8F9FA] transition-colors"
          >
            <div class="col-span-3 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-blue-600">
                {{ member.username.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-black text-gray-900">{{ member.username }}</span>
            </div>
            <div class="col-span-2 text-sm font-bold text-gray-600">{{ member.stu_id || '--' }}</div>
            <div class="col-span-2">
              <span class="rounded-full bg-[#F4FAEE] px-3 py-1 text-xs font-black text-[#70C125]">
                {{ member.user_type || 'student' }}
              </span>
            </div>
            <div class="col-span-3 text-sm font-bold text-gray-400">{{ member.joined_at || '--' }}</div>
            <div class="col-span-2 text-right">
              <button
                type="button"
                class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-blue-600 text-sm font-black hover:bg-blue-50 transition-colors mr-1"
                @click="router.push(`/teacher/classes/${classId}/student/${member.user_id}`)"
              >
                <BarChart3 class="w-4 h-4" />
                表现
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-red-500 text-sm font-black hover:bg-red-50 transition-colors"
                @click="handleRemoveStudent(member.user_id)"
              >
                <Trash2 class="w-4 h-4" />
                移除
              </button>
            </div>
          </div>
        </template>
      </section>
    </template>
  </main>
</template>
