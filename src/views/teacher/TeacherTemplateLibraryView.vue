<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, FilePlus, Library, Send } from 'lucide-vue-next'
import { getTeacherTemplates, type TeacherTemplateItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const router = useRouter()

const templatesReq = useAsync<TeacherTemplateItem[]>()
const templates = computed(() => templatesReq.data.value ?? [])

const expandedIds = ref<string[]>([])

const load = async () => {
  await templatesReq.run(async () => (await getTeacherTemplates()).data)
}

const toggleDetail = (templateId: string) => {
  expandedIds.value = expandedIds.value.includes(templateId)
    ? expandedIds.value.filter((id) => id !== templateId)
    : [...expandedIds.value, templateId]
}

const isExpanded = (templateId: string) => expandedIds.value.includes(templateId)

const visibilityLabel = (item: TeacherTemplateItem) =>
  item.visibility === 'school' ? '同校公开' : '仅自己可见'

const visibilityClass = (item: TeacherTemplateItem) =>
  item.visibility === 'school' ? 'bg-[#FFF9E6] text-[#CA8A04]' : 'bg-[#F3F4F6] text-[#9CA3AF]'

const assignTemplate = (templateId: string) => {
  router.push({ path: '/teacher/assignments/create', query: { templateId } })
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-6 flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center shrink-0">
          <Library class="w-5 h-5" />
        </span>
        <div class="flex flex-col">
          <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">模板库</h2>
          <p class="text-sm font-bold text-[#9CA3AF] mt-0.5">保存、浏览、复用你的朗读练习内容</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="inline-flex items-center gap-1 bg-[#F1F5F9] rounded-2xl p-1">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-black text-[#6B7280] hover:text-[#1F2937] transition-colors"
          @click="router.push('/teacher/content')"
        >
          内容管理
        </button>
        <span class="px-4 py-2 rounded-xl text-sm font-black bg-white text-[#5E9E1A] shadow-sm">
          模板库
        </span>
      </div>

      <div class="relative">
        <button
          type="button"
          disabled
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F3F4F6] text-[#9CA3AF] text-sm font-black cursor-not-allowed"
        >
          <FilePlus class="w-4 h-4" />
          新建模板
        </button>
        <span class="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-[#E5E7EB] text-[9px] font-black text-[#6B7280]">
          即将上线
        </span>
      </div>
    </div>

    <ErrorState
      v-if="templatesReq.error.value"
      title="加载失败"
      message="无法获取模板列表，请稍后重试。"
      :busy="templatesReq.loading.value"
      @retry="load"
    />

    <template v-else-if="templatesReq.loading.value">
      <div class="flex flex-col gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-32 w-full" />
      </div>
    </template>

    <EmptyState
      v-else-if="!templates.length"
      title="暂无模板"
      description="模板是内容仓库，可从模板一键布置为作业。前往内容管理创建你的第一个朗读内容。"
      action-label="前往内容管理"
      @action="router.push('/teacher/content')"
    />

    <div v-else class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">
          共 {{ templates.length }} 个模板
        </span>
        <span class="text-xs font-bold text-[#9CA3AF]">模板是内容仓库，可从模板一键布置为作业</span>
      </div>

      <article
        v-for="item in templates"
        :key="item.template_id"
        class="bg-white rounded-2xl border-2 border-[#F1F5F9] p-5 hover:border-[#70C125]/30 hover:shadow-[0px_4px_20px_rgba(0,0,0,0.04)] transition-all"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex-1 min-w-[240px] flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-black text-[#1F2937]">{{ item.title }}</h3>
              <span class="px-2.5 py-1 rounded-full text-xs font-black bg-[#F0F9FF] text-[#1D4ED8]">
                共 {{ item.sentence_count }} 句
              </span>
              <span
                v-if="item.phonemes.length"
                class="px-2.5 py-1 rounded-full text-xs font-black bg-[#F4FAEE] text-[#4D7C0F]"
              >
                音素 {{ item.phonemes.join(' ') }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-xs font-black" :class="visibilityClass(item)">
                {{ visibilityLabel(item) }}
              </span>
            </div>
            <p class="text-sm font-bold text-[#6B7280] leading-relaxed">{{ item.preview }}</p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 border-[#E2E8F0] text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
              @click="toggleDetail(item.template_id)"
            >
              查看
              <ChevronDown
                class="w-4 h-4 transition-transform"
                :class="isExpanded(item.template_id) ? 'rotate-180' : ''"
              />
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
              @click="assignTemplate(item.template_id)"
            >
              <Send class="w-4 h-4" />
              布置
            </button>
          </div>
        </div>

        <div v-if="isExpanded(item.template_id)" class="mt-4 pt-4 border-t border-[#F1F5F9]">
          <span
            v-if="item.segments.length"
            class="inline-block mb-3 px-3 py-1 rounded-full bg-[#1CB0F6] text-white text-xs font-black"
          >
            正文分段
          </span>
          <ol class="flex flex-col gap-2">
            <li
              v-for="(segment, index) in item.segments"
              :key="index"
              class="flex items-start gap-3 text-sm font-bold text-[#6B7280] leading-relaxed"
            >
              <span class="w-6 h-6 rounded-md bg-[#F4FAEE] text-[#4D7C0F] text-xs font-black flex items-center justify-center shrink-0">
                {{ index + 1 }}
              </span>
              <span>{{ segment }}</span>
            </li>
          </ol>
        </div>
      </article>
    </div>
  </div>
</template>
