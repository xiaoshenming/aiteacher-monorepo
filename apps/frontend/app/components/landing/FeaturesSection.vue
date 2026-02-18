<script setup lang="ts">
defineProps<{
  features: Array<{ icon: string, title: string, description: string }>
  visibleCards: number[]
}>()
</script>

<template>
  <section id="features" class="border-t border-default">
    <UContainer>
      <div class="py-24 sm:py-32">
        <div class="mx-auto max-w-2xl text-center mb-16">
          <UBadge label="核心功能" variant="subtle" color="primary" class="mb-4" />
          <h2 class="text-3xl font-bold tracking-tight sm:text-5xl">
            全方位 AI 赋能
          </h2>
          <p class="mt-4 text-lg text-muted">
            覆盖教学全流程，让每一个环节都更智能
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <UCard
            v-for="(feature, index) in features"
            :key="feature.title"
            variant="subtle"
            :class="[
              'transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1',
              visibleCards.includes(index)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8',
            ]"
          >
            <div class="flex flex-col gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <UIcon :name="feature.icon" class="h-6 w-6 text-primary" />
              </div>
              <h3 class="text-lg font-semibold">{{ feature.title }}</h3>
              <p class="text-sm text-muted leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </section>
</template>
