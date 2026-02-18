<script setup lang="ts">
definePageMeta({
  layout: false,
})
</script>

<template>
  <ClientOnly>
    <AuthLoginPanel />
  </ClientOnly>
</template>
