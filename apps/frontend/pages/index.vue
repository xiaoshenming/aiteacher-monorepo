<script setup lang="ts">
import { BasicShadowMap, NoToneMapping, SRGBColorSpace } from "three";
import { BloomPmndrs } from '@tresjs/post-processing'

const colorMode = useColorMode()

// 根据主题动态设置背景色
const gl = computed(() => ({
  clearColor: colorMode.value === 'dark' ? '#18181B' : '#ffffff',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}))

const bloomParams = reactive({
  luminanceThreshold: 0.2,
  luminanceSmoothing: 0.3,
  mipmapBlur: true,
  intensity: 0.5,
});

</script>
<template>
  <div class="h-screen">
    <TresCanvas v-bind="gl">
      <TresPerspectiveCamera
        :position="[-5.3, 8.3, 10.6]"
        :look-at="[0, 0, 0]"
      />
      <OrbitControls />

      <EffectComposer :depth-buffer="true">
        <BloomPmndrs v-bind="bloomParams" />
      </EffectComposer>

      <Suspense>
        <NuxtStones />
      </Suspense>
    </TresCanvas>
  </div>
</template>
