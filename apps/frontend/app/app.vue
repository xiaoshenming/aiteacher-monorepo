<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <PwaUpdatePrompt />
    </ClientOnly>
  </UApp>
</template>
