<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2">
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-8 w-16" />
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
        <USkeleton class="h-4 w-32" />
        <USkeleton class="h-40 w-full" />
      </div>
    </div>
  </div>
</template>
