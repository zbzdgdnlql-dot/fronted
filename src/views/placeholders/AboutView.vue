<script setup lang="ts">
import { BookOpen, CheckCircle2, FileClock, GraduationCap, Languages, Mic, ShieldCheck, Sparkles } from 'lucide-vue-next'
import heroImage from '../../assets/figma/hero-image.png'

const languages = ['法语', '德语', '日语', '俄语', '西班牙语']

const statCards = [
  { label: '训练方式', value: '逐句朗读' },
  { label: '反馈维度', value: '发音 / 节奏 / 流畅' },
  { label: '学习沉淀', value: '任务记录与档案' },
  { label: '班级场景', value: '教师布置 · 学生练习' },
]

const features = [
  {
    title: '句子级发音评测',
    desc: '围绕教师布置的朗读任务，逐句完成录音、评测和记录保存。',
    icon: Mic,
  },
  {
    title: '班级任务管理',
    desc: '学生可以在不同班级之间切换，只查看当前班级下的任务和历史记录。',
    icon: BookOpen,
  },
  {
    title: '学习档案沉淀',
    desc: '评测次数、平均分、最高分和历史单词会汇总到个人档案中，便于复盘。',
    icon: FileClock,
  },
]

const steps = [
  '登录并选择当前班级',
  '进入任务详情并开始测试',
  '逐句录音并查看评测结果',
  '提交测试后回到任务记录复盘',
]

const notes = [
  '当前学生端优先服务本机联调，接口默认连接本地后端环回地址。',
  '录音评测依赖浏览器麦克风权限，请在 Chrome 或 Edge 中授权使用。',
  '平台展示的评分和句子明细来自后端评测接口与数据库记录。',
]
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <section class="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
        <div class="lg:col-span-7 p-7 md:p-10 flex flex-col justify-between gap-8">
          <div class="flex flex-col gap-5 max-w-3xl">
            <div class="w-14 h-14 rounded-2xl bg-[#EAF0DD] flex items-center justify-center">
              <Sparkles class="w-7 h-7 text-[#70C125]" />
            </div>
            <div class="flex flex-col gap-3">
              <h2 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                AI多语种发音评测平台
              </h2>
              <p class="text-base font-bold text-gray-500 leading-relaxed">
                面向课堂练习和自主训练的朗读评测系统，把多语种发音训练拆解为可完成、可反馈、可追踪的学习过程。
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              v-for="language in languages"
              :key="language"
              class="rounded-full border border-gray-100 bg-[#F8F9FA] px-4 py-2 text-xs font-black text-gray-700"
            >
              {{ language }}
            </span>
          </div>
        </div>

        <div class="lg:col-span-5 bg-[#F8F9FA] border-t lg:border-t-0 lg:border-l border-gray-100 p-7 md:p-10 flex flex-col justify-center gap-6">
          <div class="rounded-[24px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-5">
            <img :src="heroImage" alt="Audio waveform" class="w-full max-w-[360px] h-24 object-contain" />
            <div class="w-full grid grid-cols-3 gap-3">
              <div class="rounded-2xl bg-[#EAF0DD] p-4 text-center">
                <div class="text-2xl font-black text-[#70C125]">91</div>
                <div class="text-xs font-black text-gray-500">最高分</div>
              </div>
              <div class="rounded-2xl bg-blue-50 p-4 text-center">
                <div class="text-2xl font-black text-blue-600">4</div>
                <div class="text-xs font-black text-gray-500">步骤</div>
              </div>
              <div class="rounded-2xl bg-pink-50 p-4 text-center">
                <div class="text-2xl font-black text-pink-500">5</div>
                <div class="text-xs font-black text-gray-500">语种</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="item in statCards"
        :key="item.label"
        class="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm"
      >
        <div class="text-xs font-black text-gray-400 mb-2">{{ item.label }}</div>
        <div class="text-lg font-black text-gray-900">{{ item.value }}</div>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <article
        v-for="(item, index) in features"
        :key="item.title"
        class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5"
      >
        <div
          class="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center"
          :class="index === 0 ? 'bg-[#EAF0DD]' : index === 1 ? 'bg-blue-50' : 'bg-pink-50'"
        >
          <component
            :is="item.icon"
            class="w-5 h-5"
            :class="index === 0 ? 'text-[#70C125]' : index === 1 ? 'text-blue-600' : 'text-pink-500'"
          />
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-black text-gray-900">{{ item.title }}</h3>
          <p class="text-sm font-bold text-gray-500 leading-relaxed">{{ item.desc }}</p>
        </div>
      </article>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div class="xl:col-span-7 bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <GraduationCap class="w-5 h-5 text-[#70C125]" />
          <h3 class="text-lg font-black text-gray-900">学生使用流程</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="(step, index) in steps"
            :key="step"
            class="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4 flex items-center gap-4"
          >
            <span class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-sm font-black text-[#70C125] shrink-0">
              {{ index + 1 }}
            </span>
            <span class="text-sm font-black text-gray-800">{{ step }}</span>
          </div>
        </div>
      </div>

      <div class="xl:col-span-5 bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <ShieldCheck class="w-5 h-5 text-[#70C125]" />
          <h3 class="text-lg font-black text-gray-900">说明</h3>
        </div>

        <div class="flex flex-col gap-3">
          <div
            v-for="note in notes"
            :key="note"
            class="flex items-start gap-3 text-sm font-bold text-gray-600 leading-relaxed"
          >
            <CheckCircle2 class="w-4 h-4 mt-0.5 text-[#70C125] shrink-0" />
            <span>{{ note }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center">
          <Languages class="w-6 h-6 text-[#70C125]" />
        </div>
        <div>
          <h3 class="text-lg font-black text-gray-900">为多语种课堂设计</h3>
          <p class="text-sm font-bold text-gray-500">同一套学生端流程，可承载不同语种的发音训练任务。</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="language in languages"
          :key="`bottom-${language}`"
          class="rounded-full bg-[#F8F9FA] border border-gray-100 px-3 py-1.5 text-xs font-black text-gray-600"
        >
          {{ language }}
        </span>
      </div>
    </section>
  </main>
</template>
