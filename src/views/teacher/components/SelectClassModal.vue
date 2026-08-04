<script setup lang="ts">
import { X, Check } from 'lucide-vue-next'

type ClassItem = {
  id: string
  name: string
  studentsCountText?: string
  tone: 'green' | 'blue'
}

defineProps<{
  open: boolean
  selectedId?: string
  classes: ClassItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', id: string): void
}>()

const select = (id: string) => {
  emit('select', id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        class="absolute inset-0 bg-black/20"
        aria-label="Close"
        @click="emit('close')"
      />

      <div class="relative w-full max-w-[480px] bg-white rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div class="flex items-center justify-between p-6">
          <h3 class="text-xl font-semibold text-[#191D15]">请选择班级</h3>
          <button
            type="button"
            class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50"
            @click="emit('close')"
          >
            <X class="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div class="px-6 pb-6 flex flex-col gap-4">
          <button
            v-for="item in classes"
            :key="item.id"
            type="button"
            class="w-full border rounded-2xl p-6 flex items-center gap-6 text-left hover:bg-gray-50 transition-colors"
            :class="[
              item.id === selectedId
                ? item.tone === 'green'
                  ? 'border-[rgba(77,124,15,0.4)]'
                  : 'border-[rgba(53,107,0,0.4)]'
                : 'border-gray-100',
            ]"
            @click="select(item.id)"
          >
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              :class="item.tone === 'green' ? 'bg-[#ECFCCB]' : 'bg-[rgba(142,212,255,0.2)]'"
            >
              <Check
                v-if="item.id === selectedId"
                class="w-5 h-5"
                :class="item.tone === 'green' ? 'text-[#4D7C0F]' : 'text-[#01658B]'"
              />
            </div>

            <div class="flex-1 flex flex-col gap-1">
              <div class="text-lg font-medium text-[#191D15]">{{ item.name }}</div>
              <div v-if="item.studentsCountText" class="text-sm font-medium text-[#727A69]">{{ item.studentsCountText }}</div>
            </div>

            <div class="w-10 h-10 rounded-full flex items-center justify-center">
              <Check
                v-if="item.id === selectedId"
                class="w-5 h-5"
                :class="item.tone === 'green' ? 'text-[#356B00]' : 'text-[#01658B]'"
              />
            </div>
          </button>
          <!-- TODO: 若需展示班级更多信息（年级/描述/人数），扩展 ClassItem 并从 teacher/classes 映射。 -->
        </div>
      </div>
    </div>
  </Teleport>
</template>
