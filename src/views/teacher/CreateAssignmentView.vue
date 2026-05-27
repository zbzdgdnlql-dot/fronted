<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherClasses, publishTeacherTask, segmentTeacherContent, type TeacherClassItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const toast = useToast()
const classesReq = useAsync<TeacherClassItem[]>()
const saveReq = useAsync<{ success: boolean }>()

const title = ref('')
const contentText = ref('')
const maxSubmissions = ref(3)
const selectedMode = ref('sentence')
const taskType = ref<'homework' | 'practice'>('homework')
const segmentedSentences = ref<string[]>([])
const classes = ref<TeacherClassItem[]>([])
const selectedClassIds = ref<string[]>([])
const notes = ref('')
const availableFrom = ref(new Date().toISOString().slice(0, 16))
const availableUntil = ref(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16))

const modes = [
  { id: 'sentence', label: '单句模式', desc: '逐句拆分，逐句练习发音' },
  { id: 'paragraph', label: '段落模式', desc: '按段落组织，适合长篇练习' },
  { id: 'dialog', label: '对话模式', desc: '角色扮演，双人对话练习' },
]

const taskTypes = [
  { id: 'homework', label: '作业任务' },
  { id: 'practice', label: '练习任务' },
] as const

const onSegment = () => {
  if (!contentText.value.trim()) return
  void segment()
}

const selectedClasses = computed(() => classes.value.filter((item) => selectedClassIds.value.includes(item.class_id)))
const selectedStudentCount = computed(() => selectedClasses.value.reduce((sum, item) => sum + item.student_count, 0))
const hasClasses = computed(() => classes.value.length > 0)
const allClassesSelected = computed(() => hasClasses.value && selectedClassIds.value.length === classes.value.length)

const toggleAllClasses = () => {
  selectedClassIds.value = allClassesSelected.value ? [] : classes.value.map((item) => item.class_id)
}

const toIso = (value: string) => {
  if (!value) return null
  return new Date(value).toISOString()
}

const segment = async () => {
  const text = contentText.value.trim()
  if (!text) {
    segmentedSentences.value = []
    return
  }
  try {
    const res = await segmentTeacherContent(text)
    segmentedSentences.value = res.segments.length ? res.segments : [text]
  } catch {
    segmentedSentences.value = text.split(/[.!?。！？\n]+/).map((s) => s.trim()).filter(Boolean)
  }
}

const publish = async () => {
  if (!selectedClassIds.value.length) {
    toast.push('请至少选择一个班级', 'warning')
    return
  }
  if (!title.value.trim()) {
    toast.push('请输入练习标题', 'warning')
    return
  }
  if (!segmentedSentences.value.length) await segment()
  if (!segmentedSentences.value.length) {
    toast.push('请输入练习内容', 'warning')
    return
  }
  const from = toIso(availableFrom.value)
  const until = toIso(availableUntil.value)
  if (!from || !until) {
    toast.push('请选择开始和截止时间', 'warning')
    return
  }
  if (new Date(from).getTime() >= new Date(until).getTime()) {
    toast.push('截止时间需要晚于开始时间', 'warning')
    return
  }

  try {
    await saveReq.run(() => publishTeacherTask({
      classIds: selectedClassIds.value,
      title: title.value.trim(),
      segments: segmentedSentences.value,
      notes: notes.value.trim() || null,
      taskType: taskType.value,
      maxAttempt: maxSubmissions.value,
      availableFrom: from,
      availableUntil: until,
    }))
    toast.push('任务已发布', 'success')
    await router.push('/teacher/content')
  } catch {
    toast.push(saveReq.error.value ?? '发布失败，请稍后重试', 'error')
  }
}

const onSaveDraft = () => {
  toast.push('后端暂未提供草稿状态，当前请使用保存并发布', 'info')
}
const onPublish = () => {
  void publish()
}

const load = async () => {
  classes.value = await classesReq.run(() => getTeacherClasses())
  selectedClassIds.value = classes.value[0]?.class_id ? [classes.value[0].class_id] : []
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-8 flex gap-6">
    <div class="flex-1 flex flex-col gap-6">
      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-3 gap-0">
          <div
            v-for="mode in modes"
            :key="mode.id"
            :class="[
              'bg-white rounded-xl p-6 flex flex-col gap-2 cursor-pointer transition-colors border shadow-[0px_4px_20px_rgba(0,0,0,0.04)]',
              selectedMode === mode.id
                ? 'border-[#356B00] border-2'
                : 'border-[#F1F5F9] hover:border-[#58CC02]/20',
            ]"
            @click="selectedMode = mode.id"
          >
            <h3 class="text-sm font-black text-[#1F2937]">{{ mode.label }}</h3>
            <p class="text-xs font-bold text-[#9CA3AF]">{{ mode.desc }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <span class="text-sm font-black text-[#1F2937]">内容文本</span>
            <span class="text-xs font-bold text-[#9CA3AF]">输入多语种课文或对话内容</span>
          </div>
          <textarea
            v-model="contentText"
            class="w-full h-40 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
            placeholder="请输入发布内容文本..."
            @blur="onSegment"
          />
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-black text-[#1F2937]">分句结果</h3>
            <div class="flex items-center gap-2">
              <input
                v-model="title"
                type="text"
                placeholder="练习标题"
                class="flex-1 px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02]"
              />
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-[#9CA3AF]">最大提交次数</span>
                <input
                  v-model.number="maxSubmissions"
                  type="number"
                  min="1"
                  max="99"
                  class="w-16 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-center font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
                />
              </div>
            </div>
            <textarea
              v-model="notes"
              placeholder="任务备注（可选）"
              class="w-full h-20 rounded-lg border border-[#E2E8F0] p-3 text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
            />
            <div class="flex items-center gap-2">
              <button
                v-for="item in taskTypes"
                :key="item.id"
                type="button"
                :class="[
                  'px-4 py-2 rounded-lg border text-xs font-black transition-colors',
                  taskType === item.id
                    ? 'bg-[#356B00] border-[#356B00] text-white'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#58CC02]',
                ]"
                @click="taskType = item.id"
              >
                {{ item.label }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1">
                <span class="text-xs font-bold text-[#9CA3AF]">开始时间</span>
                <input
                  v-model="availableFrom"
                  type="datetime-local"
                  class="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
                />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-bold text-[#9CA3AF]">截止时间</span>
                <input
                  v-model="availableUntil"
                  type="datetime-local"
                  class="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
                />
              </label>
            </div>
          </div>

          <div v-if="segmentedSentences.length === 0" class="flex items-center justify-center py-8">
            <p class="text-sm font-bold text-[#9CA3AF]">输入文本后将自动分句</p>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(sentence, idx) in segmentedSentences"
              :key="idx"
              class="flex items-center gap-3 px-4 py-2 bg-[#F8FAFC] rounded-lg"
            >
              <span class="text-xs font-black text-[#9CA3AF] w-8 shrink-0">#{{ idx + 1 }}</span>
              <span class="text-sm font-bold text-[#1F2937]">{{ sentence }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-[320px] shrink-0 flex flex-col gap-5">
      <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-black text-[#1F2937]">班级信息</span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-black text-[#356B00] hover:bg-[#F2F5E8] disabled:text-[#CBD5E1] disabled:hover:bg-white transition-colors"
            :disabled="!hasClasses || classesReq.loading.value"
            @click="toggleAllClasses"
          >
            {{ allClassesSelected ? '取消全选' : '全选班级' }}
          </button>
        </div>
        <div v-if="classesReq.loading.value" class="text-xs font-bold text-[#9CA3AF]">班级加载中...</div>
        <div v-else class="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
          <label
            v-for="item in classes"
            :key="item.class_id"
            class="flex items-center gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2 cursor-pointer hover:border-[#58CC02]"
          >
            <input
              v-model="selectedClassIds"
              type="checkbox"
              :value="item.class_id"
              class="accent-[#356B00]"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-black text-[#1F2937]">{{ item.class_name }}</span>
              <span class="block text-xs font-bold text-[#9CA3AF]">{{ item.student_count }}名学生 · {{ item.task_count }}个任务</span>
            </span>
          </label>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#F2F5E8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#356B00" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div>
            <p class="text-sm font-black text-[#1F2937]">已选 {{ selectedClassIds.length }} 个班级</p>
            <p class="text-xs font-bold text-[#9CA3AF]">{{ selectedStudentCount }}名学生</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4">
        <h3 class="text-sm font-black text-[#1F2937]">句子概览</h3>
        <div v-if="segmentedSentences.length === 0" class="text-center py-4">
          <p class="text-xs font-bold text-[#9CA3AF]">暂无分句</p>
        </div>
        <div v-else class="flex flex-col gap-4">
          <div
            v-for="(sentence, idx) in segmentedSentences"
            :key="idx"
            class="flex items-start gap-2"
          >
            <span class="text-xs font-black text-[#356B00] bg-[#F2F5E8] rounded-full w-5 h-5 flex items-center justify-center shrink-0">{{ idx + 1 }}</span>
            <p class="text-xs text-[#64748B] leading-relaxed line-clamp-2">{{ sentence }}</p>
          </div>
        </div>
        <div v-if="segmentedSentences.length > 0" class="bg-[rgba(53,107,0,0.05)] rounded-xl border border-[rgba(53,107,0,0.1)] p-4 text-xs font-bold text-[#356B00]">
          {{ segmentedSentences.length }} 个句子 · {{ taskType === 'homework' ? '作业任务' : '练习任务' }}
        </div>
      </div>

      <button
        type="button"
        class="w-full bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] py-4 text-center text-sm font-bold text-[#334155] hover:bg-[#F8FAFC] transition-colors"
        @click="onSaveDraft"
      >
        保存为草稿
      </button>

      <button
        type="button"
        class="w-full bg-[#356B00] rounded-xl shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)] py-4 text-center text-sm font-bold text-white hover:bg-[#2E5E00] transition-colors"
        @click="onPublish"
        :disabled="saveReq.loading.value || classesReq.loading.value"
      >
        {{ saveReq.loading.value ? '发布中...' : '保存并发布' }}
      </button>
    </div>
  </div>
</template>
