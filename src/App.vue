<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import ToastHost from './components/ToastHost.vue'

const route = useRoute()
const isBare = computed(() => route.meta?.layout === 'bare')
const isDashboard = computed(() => route.path.startsWith('/teacher') || route.path.startsWith('/admin'))
const showHeader = computed(() => !isBare.value && !isDashboard.value)
// 首页为单屏测评页：通过 meta.hideFooter 隐藏页脚，释放纵向空间
const showFooter = computed(() => !isBare.value && !isDashboard.value && !route.meta?.hideFooter)
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] text-gray-800 font-sans flex flex-col">
    <ToastHost />

    <Header v-if="showHeader" />

    <router-view />

    <Footer v-if="showFooter" />
  </div>
</template>
