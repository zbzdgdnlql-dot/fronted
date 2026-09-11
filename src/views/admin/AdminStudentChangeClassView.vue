<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRightLeft, Info, School } from 'lucide-vue-next'
import {
  changeAdminStudentClass,
  getAdminClasses,
  getAdminStudentDetail,
  type AdminClassItem,
  type AdminStudentItem,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = computed(() => String(route.params.userId ?? ''))

const detailReq = useAsync<AdminStudentItem>()
const detail = computed(() => detailReq.data.value)

const classes = ref<AdminClassItem[]>([])
const submitting = ref(false)

const form = reactive({
  target_class_id: '',
  reason: '',
})

const inputClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition'

const targetOptions = computed(() =>
  classes.value.filter((item) => item.class_id !== (detail.value?.class_id ?? '')),
)

const goBack = () => router.push('/admin/students')

const load = async () => {
  form.target_class_id = ''
  form.reason = ''
  await detailReq.run(async () => (await getAdminStudentDetail(userId.value)).data)
}

const submit = async () => {
  if (!form.target_class_id) {
    toast.push('请选择目标班级', 'warning')
    return
  }

  submitting.value = true
  try {
    await changeAdminStudentClass({
      user_id: userId.value,
      target_class_id: form.target_class_id,
      reason: form.reason.trim() || undefined,
    })
    toast.push('学生班级已更改', 'success')
    goBack()
  } catch {
    toast.push('转班失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    classes.value = (await getAdminClasses()).data
  } catch {
    classes.value = []
  }
  await load()
})
</script>

<template>
  <main class="flex-1 w-full p-8">
    <div class="max-w-3xl mx-auto flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">更改学生班级</h2>
          <p class="text-sm font-bold text-gray-400">将学生转入新班级，保留学习档案与进度</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          返回学生列表
        </button>
      </div>

      <ErrorState
        v-if="detailReq.error.value"
        title="加载失败"
        message="无法获取学生信息，请稍后重试。"
        :busy="detailReq.loading.value"
        @retry="load"
      />

      <template v-else-if="detailReq.loading.value">
        <SkeletonBlock class="h-28 w-full" />
        <SkeletonBlock class="h-64 w-full" />
      </template>

      <template v-else>
        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center gap-4">
          <span class="w-14 h-14 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A] flex items-center justify-center text-xl font-black shrink-0">
            {{ (detail?.name ?? '—').charAt(0) }}
          </span>
          <div class="flex flex-col gap-1 min-w-[180px]">
            <span class="text-lg font-black text-gray-900">{{ detail?.name }}</span>
            <span class="text-xs font-bold text-gray-400">学号：{{ detail?.stu_id }}</span>
          </div>
          <span
            v-if="detail?.class_name"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4FAEE] text-[#5E9E1A] text-xs font-black"
          >
            <School class="w-3.5 h-3.5" />
            {{ detail.class_name }}
          </span>
        </section>

        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-6">
          <div>
            <span class="block mb-2 text-sm font-black text-gray-900">当前班级</span>
            <div class="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F1F5F9]">
              <span
                v-if="detail?.language"
                class="px-3 py-1 rounded-full bg-white text-[#6B7280] text-xs font-black"
              >
                {{ detail.language }}
              </span>
              <span class="text-sm font-bold text-[#6B7280]">{{ detail?.class_name ?? '暂未分配班级' }}</span>
            </div>
          </div>

          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">
              目标班级
              <span class="text-[#EF4444]">*</span>
            </label>
            <select v-model="form.target_class_id" :class="inputClass">
              <option value="">请选择目标班级</option>
              <option v-for="item in targetOptions" :key="item.class_id" :value="item.class_id">
                {{ item.class_name }}（{{ item.language }}）
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">变更原因</label>
            <textarea
              v-model="form.reason"
              rows="4"
              placeholder="如：「家长申请转班」「课程进度调整」"
              class="w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition resize-y"
            />
          </div>

          <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F7FEE7] border border-[#EAF0DD] text-[#4D7C0F]">
            <Info class="w-5 h-5 shrink-0" />
            <span class="text-sm font-bold">转班后学生原有进度记录会保留在新班级。</span>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-6 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
              @click="goBack"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              @click="submit"
            >
              <ArrowRightLeft class="w-5 h-5" />
              <span>{{ submitting ? '处理中…' : '确认转班' }}</span>
            </button>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>
