<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const textContent = ref('')

const clearText = () => {
  textContent.value = ''
}

const speeds = ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x', '2.0x']
const selectedSpeed = ref('1.0x')
const showSpeedDropdown = ref(false)

const toggleDropdown = () => {
  showSpeedDropdown.value = !showSpeedDropdown.value
}

const selectSpeed = (speed: string) => {
  selectedSpeed.value = speed
  showSpeedDropdown.value = false
}

const goRecording = () => {
  router.push('/evaluate/recording')
}

const goResult = () => {
  router.push('/evaluate/result')
}

// Close dropdown when clicking outside
const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.speed-dropdown-container')) {
    showSpeedDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Top Box: Textarea Area -->
    <div class="bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-black text-gray-900">法语评测文本</h2>
        <button 
          @click="clearText"
          class="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
        >
          清空内容
        </button>
      </div>

      <!-- Textarea -->
      <div class="bg-[#F8F9FA] rounded-2xl border-2 border-transparent focus-within:border-blue-100 p-4 flex-1 mb-4">
        <textarea 
          v-model="textContent"
          class="w-full h-full bg-transparent resize-none outline-none text-[#1B254B] font-medium leading-relaxed placeholder-gray-400"
          placeholder="请输入法语文本..."
        ></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#70C125]"
            disabled
          >
            <img src="../../assets/figma/icon-import.svg" class="w-5 h-5 invert brightness-0" alt="" />
            导入文本
          </button>
          
          <button
            type="button"
            class="bg-[#FFC107] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#e6ad06] border-b-4 border-[#D9A406] active:border-b-0 active:translate-y-1 transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#FFC107]"
            disabled
          >
            <img src="../../assets/figma/icon-split.svg" class="w-5 h-5 invert brightness-0" alt="" />
            智能分句
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="bg-[#3B82F6] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#2563eb] border-b-4 border-[#2563EB] active:border-b-0 active:translate-y-1 transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#3B82F6]"
            disabled
          >
            <img src="../../assets/figma/icon-play.svg" class="w-5 h-5 invert brightness-0" alt="" />
            播放示例音频
          </button>
          
          <!-- Speed Control Dropdown -->
          <div class="relative speed-dropdown-container">
            <div 
              @click="toggleDropdown"
              class="border-2 border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white"
            >
              <span class="text-blue-500 font-extrabold text-sm w-8 text-center">{{ selectedSpeed }}</span>
              <img src="../../assets/figma/icon-audio.svg" class="w-5 h-5 transition-transform duration-200" :class="showSpeedDropdown ? 'rotate-180' : ''" alt="" />
            </div>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div 
                v-if="showSpeedDropdown"
                class="absolute bottom-full mb-2 right-0 bg-white border border-gray-100 rounded-xl shadow-lg py-2 w-32 z-20"
              >
                <div 
                  v-for="speed in speeds" 
                  :key="speed"
                  @click="selectSpeed(speed)"
                  class="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                  :class="selectedSpeed === speed ? 'bg-blue-50/50' : ''"
                >
                  <span class="text-sm font-bold" :class="selectedSpeed === speed ? 'text-blue-500' : 'text-gray-700'">
                    {{ speed }}
                  </span>
                  <div v-if="selectedSpeed === speed" class="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Box: Recording Area -->
    <div class="bg-white rounded-[32px] border-2 border-gray-100 shadow-sm overflow-hidden h-[340px] flex flex-col items-center justify-center relative mt-6 shrink-0 gap-6 py-8">
      
      <!-- Waveform Image -->
      <img src="../../assets/figma/hero-image.png" alt="Waveform" class="h-16 w-auto object-contain" />

      <!-- Device Ready Pill -->
      <div class="bg-[#F8F9FA] border border-gray-100 shadow-sm rounded-full px-5 py-2.5 flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-[#70C125]"></div>
        <span class="text-gray-900 font-bold text-sm">设备已就绪</span>
      </div>

      <!-- Recording Action Buttons -->
      <div class="flex items-center gap-6 w-full max-w-[480px] px-6">
        <button
          type="button"
          class="flex-1 bg-[#70C125] text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#63ad20] border-b-[6px] border-[#5E9E1A] active:border-b-0 active:translate-y-1.5 transition-all"
          @click="goRecording"
        >
          <img src="../../assets/figma/icon-start.svg" class="w-6 h-6 invert brightness-0" alt="" />
          <span class="font-black text-sm">开始录音</span>
        </button>
        
        <button
          type="button"
          class="flex-1 bg-[#FF80B5] text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#e673a3] border-b-[6px] border-[#D16A95] active:border-b-0 active:translate-y-1.5 transition-all"
          @click="goResult"
        >
          <img src="../../assets/figma/icon-stop.svg" class="w-6 h-6 invert brightness-0" alt="" />
          <span class="font-black text-sm">结束录音</span>
        </button>
      </div>
    </div>
  </div>
</template>
