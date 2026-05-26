<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, CheckCircle2, Upload, Mic, Image as ImageIcon, Info, Save } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import SelectClassModal from './components/SelectClassModal.vue'
import { createTeacherContent, getTeacherClasses, segmentTeacherContent, validateTeacherContent, type TeacherClassItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'

type Mode = '句子练习' | '单词练习' | '综合作业'
type Difficulty = '初级' | '中级' | '高级'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const classesReq = useAsync<TeacherClassItem[]>()
const publishReq = useAsync<void>()
const segmentReq = useAsync<Awaited<ReturnType<typeof segmentTeacherContent>>>()

const selectedMode = ref<Mode>('句子练习')
const title = ref('')
const difficulty = ref<Difficulty>('初级')
const dueDate = ref({ mm: '', dd: '', yyyy: '' })
const attemptsLimit = ref(1)
const textContent = ref('')
const focusedPhonemes = ref<string[]>([])

const showSelectClass = ref(false)
const selectedClassId = ref<string | undefined>(undefined)

const phonemes = computed(() => focusedPhonemes.value)

const autosaveText = computed(() => "自动保存未启用")

const togglePhoneme = (p: string) => {
  const idx = focusedPhonemes.value.indexOf(p)
  if (idx >= 0) focusedPhonemes.value.splice(idx, 1)
  else focusedPhonemes.value.push(p)
}

const openPublish = () => {
  showSelectClass.value = true
}

const classItems = computed(() => {
  const list = classesReq.data.value ?? []
  return list.map((c, idx) => ({
    id: c.class_id,
    name: c.class_name,
    studentsCountText: `${c.student_count} 名学生`,
    tone: (idx % 2 === 0 ? 'green' : 'blue') as 'green' | 'blue',
  }))
})

const loadClasses = async () => {
  await classesReq.run(async () => getTeacherClasses())
  if (!selectedClassId.value) {
    const fromQuery = route.query.classId as string | undefined
    selectedClassId.value = fromQuery ?? classesReq.data.value?.[0]?.class_id
  }
}

const doSegment = async () => {
  if (!textContent.value.trim()) {
    toast.push('请先输入文本', 'warning')
    return
  }
  try {
    const res = await segmentReq.run(async () => segmentTeacherContent(textContent.value))
    toast.push(`已分句：${res.segments.length} 句`, 'success')
  } catch {
    toast.push('分句失败，请稍后重试', 'error')
  }
}

const publish = async () => {
  if (!selectedClassId.value) {
    toast.push('请选择班级', 'warning')
    return
  }
  if (!title.value.trim() || !textContent.value.trim()) {
    toast.push('请填写标题与内容', 'warning')
    return
  }
  await publishReq.run(async () => {
    const v = await validateTeacherContent(textContent.value)
    if (!v.valid) throw new Error(v.message || '内容验证未通过')
    await createTeacherContent({
      classId: selectedClassId.value!,
      title: title.value.trim(),
      contentText: textContent.value,
      taskType: selectedMode.value === '综合作业' ? 'homework' : 'practice',
      maxSubmission: attemptsLimit.value,
      targetPhonemes: focusedPhonemes.value,
      availableUntil: dueDate.value.yyyy && dueDate.value.mm && dueDate.value.dd
        ? new Date(Number(dueDate.value.yyyy), Number(dueDate.value.mm) - 1, Number(dueDate.value.dd)).toISOString()
        : null,
    })
    toast.push('已创建并发布', 'success')
    await router.push('/teacher/content')
  })
}

onMounted(loadClasses)
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex items-start justify-between gap-6 flex-wrap">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">创建作业</h2>
        <p class="text-sm font-bold text-gray-400">作业设置</p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
        @click="router.push('/teacher/content')"
      >
        <ChevronLeft class="w-4 h-4" />
        返回内容管理
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <section class="xl:col-span-8 flex flex-col gap-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            class="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 text-left hover:bg-gray-50 transition-colors"
            @click="selectedMode = '句子练习'"
          >
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-black text-gray-900">句子练习</h3>
              <div v-if="selectedMode === '句子练习'" class="flex items-center gap-2 text-xs font-black text-[#70C125] bg-[#EAF0DD] px-3 py-1.5 rounded-full">
                <CheckCircle2 class="w-4 h-4" />
                已选择
              </div>
            </div>
            <p class="text-sm font-bold text-gray-400">专注语法结构和语境表达。</p>
          </button>

          <button
            type="button"
            class="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 text-left hover:bg-gray-50 transition-colors"
            @click="selectedMode = '单词练习'"
          >
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-black text-gray-900">单词练习</h3>
              <div v-if="selectedMode === '单词练习'" class="flex items-center gap-2 text-xs font-black text-[#70C125] bg-[#EAF0DD] px-3 py-1.5 rounded-full">
                <CheckCircle2 class="w-4 h-4" />
                已选择
              </div>
            </div>
            <p class="text-sm font-bold text-gray-400">强化词汇记忆和拼写准确度。</p>
          </button>

          <button
            type="button"
            class="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 text-left hover:bg-gray-50 transition-colors"
            @click="selectedMode = '综合作业'"
          >
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-black text-gray-900">综合作业</h3>
              <div v-if="selectedMode === '综合作业'" class="flex items-center gap-2 text-xs font-black text-[#70C125] bg-[#EAF0DD] px-3 py-1.5 rounded-full">
                <CheckCircle2 class="w-4 h-4" />
                已选择
              </div>
            </div>
            <p class="text-sm font-bold text-gray-400">多维度考核学生的语言掌握情况。</p>
          </button>
        </div>

        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <h3 class="text-lg font-black text-gray-900">作业设置</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest">作业标题</span>
              <input
                v-model="title"
                class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
                placeholder="作业标题"
              />
            </label>

            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest">难度选择</span>
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  class="px-4 py-2 rounded-full text-sm font-black border transition-colors"
                  :class="difficulty === '初级' ? 'bg-white border-[#70C125] text-[#70C125]' : 'bg-white border-gray-100 text-gray-500 hover:text-gray-700'"
                  @click="difficulty = '初级'"
                >
                  初级
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded-full text-sm font-black border transition-colors"
                  :class="difficulty === '中级' ? 'bg-white border-[#70C125] text-[#70C125]' : 'bg-white border-gray-100 text-gray-500 hover:text-gray-700'"
                  @click="difficulty = '中级'"
                >
                  中级
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded-full text-sm font-black border transition-colors"
                  :class="difficulty === '高级' ? 'bg-white border-[#70C125] text-[#70C125]' : 'bg-white border-gray-100 text-gray-500 hover:text-gray-700'"
                  @click="difficulty = '高级'"
                >
                  高级
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest">截止日期</span>
              <div class="flex items-center gap-2">
                <input v-model="dueDate.mm" class="w-16 bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-black text-gray-800 outline-none" placeholder="mm" />
                <span class="text-sm font-black text-gray-400">/</span>
                <input v-model="dueDate.dd" class="w-16 bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-black text-gray-800 outline-none" placeholder="dd" />
                <span class="text-sm font-black text-gray-400">/</span>
                <input v-model="dueDate.yyyy" class="w-24 bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-black text-gray-800 outline-none" placeholder="yyyy" />
              </div>
            </div>

            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest">提交次数限制</span>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="attemptsLimit"
                  type="number"
                  min="1"
                  class="w-24 bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-black text-gray-800 outline-none"
                />
                <div class="text-sm font-black text-gray-400">'1'</div>
              </div>
            </div>
          </div>

          <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest">/r/</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in phonemes"
                :key="p"
                type="button"
                class="px-4 py-2 rounded-full text-sm font-black border transition-colors"
                :class="focusedPhonemes.includes(p) ? 'bg-white border-[#70C125] text-[#70C125]' : 'bg-white border-gray-100 text-gray-500 hover:text-gray-700'"
                @click="togglePhoneme(p)"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <div class="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex flex-col gap-1">
                <h4 class="text-lg font-black text-gray-900">法语文本内容</h4>
                <div class="text-sm font-bold text-gray-400">{{ autosaveText }}</div>
              </div>

              <div class="flex items-center gap-3 flex-wrap">
                <button type="button" class="bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2 opacity-70 cursor-not-allowed" disabled>
                  <Upload class="w-4 h-4" />
                  导入文本
                </button>
                <button type="button" class="bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2 opacity-70 cursor-not-allowed" disabled>
                  <Mic class="w-4 h-4" />
                  添加音频录制
                </button>
                <button
                  type="button"
                  class="bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="segmentReq.loading.value"
                  @click="doSegment"
                >
                  <ImageIcon class="w-4 h-4" />
                  智能分句
                </button>
              </div>
            </div>

            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4">
              <textarea
                v-model="textContent"
                class="w-full min-h-[200px] bg-transparent outline-none resize-none text-sm font-medium text-gray-800 placeholder:text-gray-400"
                placeholder="在此输入内容..."
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 flex-wrap">
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Save class="w-4 h-4" />
              保存为草稿
            </button>
            <button
              type="button"
              class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="publishReq.loading.value || classesReq.loading.value"
              @click="openPublish"
            >
              {{ publishReq.loading.value ? '发布中...' : '保存并发布' }}
            </button>
          </div>
        </div>
      </section>

      <aside class="xl:col-span-4 flex flex-col gap-8">
        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Info class="w-5 h-5 text-gray-700" />
            </div>
            <h3 class="text-lg font-black text-gray-900">内容信息</h3>
          </div>

          <div class="flex flex-col gap-3">
            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
              <div class="text-sm font-black text-gray-500">创建时间：</div>
              <div class="text-sm font-extrabold text-gray-900">--</div>
            </div>
            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
              <div class="text-sm font-black text-gray-500">更新时间：</div>
              <div class="text-sm font-extrabold text-gray-900">--</div>
            </div>
            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
              <div class="text-sm font-black text-gray-500">内容ID：</div>
              <div class="text-sm font-extrabold text-gray-900">--</div>
            </div>
          </div>
          <!-- TODO: 创建成功后从后端响应中提取 content_id/created_at/updated_at 并展示（当前 POST 端点为重定向页面，需后端提供 JSON 或额外查询接口）。 -->
        </section>

        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <h3 class="text-lg font-black text-gray-900">创建提示</h3>
          <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4">
            <div class="text-sm font-black text-gray-700 mb-2">AI 辅助建议</div>
            <div class="text-sm font-bold text-gray-500">
              建议根据学生水平选择难度，并在文本中包含本周教学重点的语法结构。
            </div>
          </div>
        </section>
      </aside>
    </div>

    <SelectClassModal
      :open="showSelectClass"
      :selected-id="selectedClassId"
      :classes="classItems"
      @close="showSelectClass = false"
      @select="async (id) => { selectedClassId = id; showSelectClass = false; await publish(); }"
    />
  </main>
</template>
