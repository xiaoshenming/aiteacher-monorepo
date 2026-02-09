<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role-guard'],
})
</script>

<template>
  <NuxtPage />
</template>
