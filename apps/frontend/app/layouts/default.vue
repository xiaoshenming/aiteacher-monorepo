<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <NuxtLoadingIndicator color="var(--color-teal-500)" />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
