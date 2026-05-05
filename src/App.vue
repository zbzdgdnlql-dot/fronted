<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import ToastHost from './components/ToastHost.vue'

const route = useRoute()
const showHeader = computed(() => route.meta?.layout !== 'bare')
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] text-gray-800 font-sans flex flex-col">
    <ToastHost />

    <Header v-if="showHeader" />

    <router-view></router-view>
  </div>
</template>
