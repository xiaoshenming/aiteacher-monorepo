// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@tresjs/nuxt',
    '@nuxt/ui-pro',
    '@nuxt/devtools',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@vueuse/nuxt',
    'nuxt-echarts',
    '@nuxt/eslint',
  ],

  compatibilityDate: '2025-03-06',

  experimental: {
    appManifest: false,
  },

  devServer: {
    port: 10003,
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:10001/api/',
      apiCloud: 'http://localhost:5001/api/',
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width',
      title: 'AI教学助手',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      htmlAttrs: {
        lang: 'zh-CN',
      },
    },
  },

  fonts: {
    provider: 'bunny',
  },

  tres: {
    devtools: true,
  },

  echarts: {
    charts: ['BarChart', 'LineChart', 'PieChart'],
    components: ['DatasetComponent', 'GridComponent', 'TooltipComponent', 'LegendComponent'],
  },
})
