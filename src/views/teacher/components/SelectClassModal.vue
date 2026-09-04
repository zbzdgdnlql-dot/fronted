<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  X,
  ScanSearch,
  CircleCheckBig,
  ArrowUpRight,
  ChevronRight,
  BookOpen,
  Mic,
  Headphones,
  ArrowRight,
  ChartColumn,
} from 'lucide-vue-next'
import { getTeacherClasses, type TeacherClassItem } from '../../../api/endpoints'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', classId: string): void
}>()

const classes = ref<TeacherClassItem[]>([])
const selectedId = ref<string>('')
const loading = ref(false)

const categoryIcons = [BookOpen, Mic, Headphones, BookOpen]

const categoryOf = (index: number) => categoryIcons[index % categoryIcons.length]

// 无后端时的兜底班级数据，保证纯前端预览可选中并跳转
const MOCK_CLASSES: TeacherClassItem[] = [
  { class_id: 'mock-class-001', class_name: '法语 A 班', description: '零基础入门，掌握基础发音与日常用语', student_count: 28, task_count: 12, grade_level: 'A1' },
  { class_id: 'mock-class-002', class_name: '法语 B 班', description: '初级进阶，强化语法与听说能力', student_count: 24, task_count: 10, grade_level: 'A2' },
  { class_id: 'mock-class-003', class_name: '法语 C 班', description: '中级强化，提升读写与表达水平', student_count: 20, task_count: 8, grade_level: 'B1' },
]

const load = async () => {
  loading.value = true
  try {
    const list = await getTeacherClasses()
    classes.value = Array.isArray(list) ? list : []
  } catch {
    classes.value = []
  }
  if (!classes.value.length) classes.value = MOCK_CLASSES
  if (classes.value.length && !selectedId.value) selectedId.value = classes.value[0].class_id
  loading.value = false
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (!classes.value.length) void load()
      else if (classes.value.length && !selectedId.value) selectedId.value = classes.value[0].class_id
    }
  },
)

const selectClass = (id: string) => {
  selectedId.value = id
}

const confirm = () => {
  if (selectedId.value) emit('select', selectedId.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-8">
      <button
        type="button"
        class="absolute inset-0 z-10 bg-[rgba(36,50,56,0.42)] backdrop-blur-[2px]"
        aria-label="关闭弹窗"
        @click="emit('close')"
      />

      <section
        class="pointer-events-auto relative z-20 w-full max-w-[680px] rounded-[24px] border border-[#E5E7EB] bg-white shadow-[0_24px_64px_rgba(36,50,56,0.16)]"
      >
        <div class="flex items-start justify-between border-b border-[#E5E7EB] px-8 py-7">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 rounded-full border border-[#D2F2A8] bg-[#EBF9E6] px-3 py-1 text-xs font-semibold text-[#398403]">
              <ChartColumn class="h-3.5 w-3.5" />
              <span>数据统计入口</span>
            </div>
            <div>
              <h2 class="text-2xl font-extrabold tracking-[-0.03em] text-[#243238]">选择班级</h2>
              <p class="mt-2 max-w-[480px] text-sm leading-6 text-[#6B7280]">
                选择需要查看的目标班级，进入统计页后可继续分析出勤、作业和课堂表现。
              </p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] shadow-[0_1px_2px_rgba(36,50,56,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#D2F2A8] hover:text-[#398403]"
            aria-label="关闭弹窗"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-8 py-7">
          <div class="mb-5 flex items-center justify-between rounded-[18px] border border-[#E5E7EB] bg-[#F3F4F6] px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EBF9E6] text-[#398403]">
                <ScanSearch class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-bold text-[#243238]">已选班级</p>
                <p class="text-xs text-[#6B7280]">当前会进入该班级的数据统计详情页</p>
              </div>
            </div>
            <span class="rounded-full border border-[#D2F2A8] bg-[#EBF9E6] px-3 py-1 text-xs font-semibold text-[#398403]">1 个已选</span>
          </div>

          <div v-if="loading" class="py-12 text-center text-sm font-semibold text-[#6B7280]">正在加载班级...</div>

          <div v-else-if="!classes.length" class="py-12 text-center text-sm font-semibold text-[#6B7280]">
            暂无可用班级
          </div>

          <div v-else class="grid grid-cols-2 gap-4">
            <button
              v-for="(item, index) in classes"
              :key="item.class_id"
              type="button"
              class="group flex min-h-[152px] flex-col items-start justify-between rounded-[22px] border p-5 text-left transition duration-200 hover:-translate-y-0.5"
              :class="
                item.class_id === selectedId
                  ? 'border-[#B8E97A] bg-[linear-gradient(180deg,#ffffff_0%,#f6fde9_100%)] ring-2 ring-[rgba(88,204,2,0.16)]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D2F2A8] hover:bg-[#F4FDE8]'
              "
              @click="selectClass(item.class_id)"
            >
              <div class="flex w-full items-start justify-between">
                <div>
                  <div
                    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      item.class_id === selectedId
                        ? 'bg-[#EBF9E6] text-[#398403]'
                        : 'border border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]'
                    "
                  >
                    <CircleCheckBig v-if="item.class_id === selectedId" class="h-3.5 w-3.5" />
                    <component :is="categoryOf(index)" v-else class="h-3.5 w-3.5" />
                    <span>{{ item.class_id === selectedId ? '当前选择' : item.grade_level || '班级' }}</span>
                  </div>
                  <h3 class="mt-4 text-lg font-extrabold text-[#243238]">{{ item.class_name }}</h3>
                </div>
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full"
                  :class="
                    item.class_id === selectedId
                      ? 'bg-[#58CC02] text-white'
                      : 'border border-[#E5E7EB] bg-white text-[#6B7280]'
                  "
                >
                  <ArrowUpRight v-if="item.class_id === selectedId" class="h-4 w-4" />
                  <ChevronRight v-else class="h-4 w-4" />
                </div>
              </div>
              <div class="space-y-2">
                <p class="text-sm leading-6 text-[#6B7280]">{{ item.description || '暂无班级描述' }}</p>
                <div class="flex items-center gap-4 text-xs font-semibold text-[#398403]">
                  <span>{{ item.student_count }} 名学生</span>
                  <span>{{ item.task_count }} 项任务</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-8 py-6">
          <button
            type="button"
            class="flex h-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-sm font-bold text-[#243238] shadow-[0_1px_2px_rgba(36,50,56,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#D2F2A8] hover:bg-[#EBF9E6]"
            @click="emit('close')"
          >
            取消
          </button>
          <button
            type="button"
            class="flex h-12 items-center gap-2 rounded-full bg-[#58CC02] px-6 text-sm font-bold text-white shadow-[0_1px_2px_rgba(36,50,56,0.04)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#46A302] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!selectedId"
            @click="confirm"
          >
            <span>进入统计</span>
            <ArrowRight class="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
