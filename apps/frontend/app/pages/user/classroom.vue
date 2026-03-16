<template>
  <ClassroomPanel />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role-guard'],
  roles: ['2', '3', '4'],
})
</script>
