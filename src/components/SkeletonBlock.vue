<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div class="animate-pulse rounded-2xl bg-gray-100" :class="$props.class"></div>
</template>

