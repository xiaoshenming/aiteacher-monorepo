// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@tresjs/nuxt',
    '@nuxt/ui-pro',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@vueuse/nuxt',
    'nuxt-echarts',
    '@nuxtjs/mdc',
    '@nuxt/eslint',
  ],

  mdc: {
    headings: {
      anchorLinks: false,
    },
    highlight: {
      shikiEngine: 'javascript',
      langs: [
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'c',
        'html',
        'css',
        'json',
        'bash',
        'sql',
        'markdown',
        'vue',
        'jsx',
        'tsx',
      ],
    },
  },

  compatibilityDate: '2025-06-09',

  devServer: {
    port: 10003,
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:10001/api/',
      apiCloud: 'http://localhost:10002/api/',
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
