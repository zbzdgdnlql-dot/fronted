<script setup lang="ts">
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Library,
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-vue-next'

const languages = ['法语', '德语', '日语', '俄语', '西班牙语']

// 首屏右侧速览：数字均来自平台真实能力定义
const heroStats = [
  { value: '5', label: '支持语种', desc: '日语 · 德语 · 法语 · 西班牙语 · 俄语' },
  { value: '4', label: '评分维度', desc: '发音 · 节奏 · 流利 · 完整' },
  { value: '3', label: '反馈粒度', desc: '句子 · 单词 · 音素' },
  { value: '70', label: '薄弱预警线', desc: '音素得分低于 70 分重点练习' },
]

const featureTones = [
  'bg-[#EAF0DD] text-[#70C125]',
  'bg-blue-50 text-blue-600',
  'bg-pink-50 text-pink-500',
]

const features = [
  {
    title: '自由评测',
    desc: '输入任意文本，系统智能分句后逐句录音，即时返回该句得分与单词明细。',
    icon: Mic,
  },
  {
    title: '任务练习',
    desc: '教师按班级布置作业或练习任务；学生在开放时间与最大提交次数内完成。',
    icon: BookOpen,
  },
  {
    title: '班级上下文',
    desc: '学生可在所属班级之间切换，每个班级的任务、次数与历史记录互相独立。',
    icon: Layers3,
  },
  {
    title: '薄弱环节分析',
    desc: '提供逐句评分与音素薄弱环节，低于 70 分的音素会被单独标出并给出练习建议。',
    icon: AlertCircle,
  },
  {
    title: '教师逐句批改',
    desc: '教师可播放学生录音、对照机器评分逐句写评语，并提交总体评价供学生回看。',
    icon: CheckCircle2,
  },
  {
    title: '校本练习库',
    desc: '练习可保存为校本练习，按「同校公开 / 仅自己可见」控制范围，便于同校复用。',
    icon: Library,
  },
]

const steps = [
  {
    title: '布置任务',
    desc: '教师选择班级、填写朗读内容，设定开始与截止时间、最大提交次数后发布。',
  },
  {
    title: '逐句练习',
    desc: '学生在任务窗口内逐句录音，可重录、重试；录音需在 Chrome 或 Edge 中授权麦克风权限。',
  },
  {
    title: '即时评测',
    desc: '句子级返回发音、节奏、流利、完整四维得分，并可下钻查看单词级与音素级明细。',
  },
  {
    title: '反馈沉淀',
    desc: '提交结果写入学习档案与历史记录；教师批改后，学生可回看逐句评语与总体评价。',
  },
]

const roles = [
  {
    name: '学生端',
    icon: GraduationCap,
    points: ['自由评测与智能分句', '班级任务练习与记录', '薄弱环节与音素分析', '学习档案与个人中心'],
  },
  {
    name: '教师端',
    icon: Users,
    points: ['概览与内容管理', '布置作业与练习任务', '作业批改与班级分析', '班级管理与校本练习库'],
  },
  {
    name: '管理端',
    icon: ShieldCheck,
    points: ['平台总览与近期动态', '班级管理', '教师与班级分配', '学生管理'],
  },
]

const credits = [
  { title: '指导教师', names: ['王静', '毕笑', '乔颖', '贺致远', '班捷', '袁陈杰'] },
  { title: '平台开发', names: ['都兴烁', '谭智元', '魏泽祺'] },
  { title: '美术设计', names: ['邵珺婷'] },
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

        <div class="lg:col-span-5 bg-[#F8F9FA] border-t lg:border-t-0 lg:border-l border-gray-100 p-7 md:p-10 flex flex-col justify-center gap-5">
          <div class="flex flex-col gap-1">
            <h3 class="text-lg font-black text-gray-900">平台速览</h3>
            <p class="text-sm font-bold text-gray-500">关于评测能力与使用场景的一组数字。</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="item in heroStats"
              :key="item.label"
              class="rounded-2xl bg-white border border-gray-100 p-4 flex flex-col gap-1"
            >
              <div class="text-2xl font-black text-[#70C125]">{{ item.value }}</div>
              <div class="text-xs font-black text-gray-800">{{ item.label }}</div>
              <div class="text-[11px] font-bold text-gray-400 leading-relaxed">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-5">
      <div class="flex flex-col gap-1">
        <h3 class="text-2xl font-black text-gray-900 tracking-tight">平台特点</h3>
        <p class="text-sm font-bold text-gray-500">从自由练习到课堂任务，覆盖发音训练的主要环节。</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <article
          v-for="(item, index) in features"
          :key="item.title"
          class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5"
        >
          <div
            class="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center"
            :class="featureTones[index % 3]"
          >
            <component :is="item.icon" class="w-5 h-5" />
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="text-lg font-black text-gray-900">{{ item.title }}</h4>
            <p class="text-sm font-bold text-gray-500 leading-relaxed">{{ item.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="bg-white border border-gray-100 rounded-[24px] p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div class="flex items-center gap-3">
        <GraduationCap class="w-5 h-5 text-[#70C125]" />
        <div class="flex flex-col gap-1">
          <h3 class="text-lg font-black text-gray-900">教学闭环</h3>
          <p class="text-sm font-bold text-gray-500">教师布置 → 学生练习 → 即时评测 → 反馈沉淀。</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-5 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-sm font-black text-[#70C125] shrink-0">
              {{ index + 1 }}
            </span>
            <span class="text-base font-black text-gray-900">{{ step.title }}</span>
          </div>
          <p class="text-sm font-bold text-gray-500 leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <Users class="w-5 h-5 text-[#70C125]" />
        <div class="flex flex-col gap-1">
          <h3 class="text-lg font-black text-gray-900">三端角色分工</h3>
          <p class="text-sm font-bold text-gray-500">同一套评测能力，按学生、教师与管理员划分使用范围。</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article
          v-for="role in roles"
          :key="role.name"
          class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5"
        >
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-[#EAF0DD] flex items-center justify-center">
              <component :is="role.icon" class="w-5 h-5 text-[#70C125]" />
            </div>
            <h4 class="text-lg font-black text-gray-900">{{ role.name }}</h4>
          </div>

          <div class="flex flex-col gap-3">
            <div
              v-for="point in role.points"
              :key="point"
              class="flex items-start gap-3 text-sm font-bold text-gray-600 leading-relaxed"
            >
              <CheckCircle2 class="w-4 h-4 mt-0.5 text-[#70C125] shrink-0" />
              <span>{{ point }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="bg-white border border-gray-100 rounded-[24px] p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div class="flex items-center gap-3">
        <Sparkles class="w-5 h-5 text-[#70C125]" />
        <div class="flex flex-col gap-1">
          <h3 class="text-lg font-black text-gray-900">特别鸣谢</h3>
          <p class="text-sm font-bold text-gray-500">感谢以下老师与同学对本平台的支持与付出。</p>
        </div>
        <span class="ml-auto shrink-0 text-[11px] font-bold text-gray-400">按照姓氏笔画排序</span>
      </div>

      <div class="flex flex-col gap-5">
        <div
          v-for="group in credits"
          :key="group.title"
          class="flex flex-col items-center gap-3"
        >
          <h4 class="text-sm font-black text-[#70C125] tracking-wider">{{ group.title }}</h4>
          <ul class="flex flex-wrap items-center justify-center gap-2">
            <li
              v-for="name in group.names"
              :key="name"
              class="rounded-full border border-gray-100 bg-[#F8F9FA] px-4 py-1.5 text-sm font-black text-gray-700"
            >
              {{ name }}
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>
