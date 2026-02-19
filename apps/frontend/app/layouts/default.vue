<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-3 focus:bg-white focus:text-primary-600 dark:focus:bg-gray-900 dark:focus:text-primary-400">跳转到主要内容</a>
    <AppHeader />
    <NuxtLoadingIndicator color="var(--color-primary-500)" />
    <main id="main-content" class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
