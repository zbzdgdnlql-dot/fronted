<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import ToastHost from './components/ToastHost.vue'

const route = useRoute()
const isBare = computed(() => route.meta?.layout === 'bare')
const isTeacher = computed(() => route.path.startsWith('/teacher'))
const showHeader = computed(() => !isBare.value && !isTeacher.value)
const showFooter = computed(() => !isBare.value && !isTeacher.value)
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] text-gray-800 font-sans flex flex-col">
    <ToastHost />

    <Header v-if="showHeader" />

    <router-view />

    <Footer v-if="showFooter" />
  </div>
</template>
