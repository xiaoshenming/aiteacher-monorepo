<template>
  <ResourceLibraryPanel />
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role-guard'],
  roles: ['2', '3', '4'],
})
</script>
