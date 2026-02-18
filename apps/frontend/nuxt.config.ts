// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@tresjs/nuxt',
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@vueuse/nuxt',
    'nuxt-echarts',
    '@nuxtjs/mdc',
    '@nuxt/eslint',
    '@vite-pwa/nuxt',
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'AI教学助手',
      short_name: 'AI教学',
      description: '智慧教育平台 - AI辅助教学',
      theme_color: '#4f46e5',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /\.(?:js|css|woff2?)$/i,
          handler: 'CacheFirst',
          options: { cacheName: 'static-assets' },
        },
        {
          urlPattern: /^https?:\/\/localhost:\d+\/api\//i,
          handler: 'NetworkFirst',
          options: { cacheName: 'api-cache' },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: { maxEntries: 50 },
          },
        },
      ],
    },
  },

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

  routeRules: {
    '/dashboard': { ssr: false },
    '/user/**': { ssr: false },
    '/admin/**': { ssr: false },
    '/superadmin/**': { ssr: false },
    '/student/**': { ssr: false },
  },

  compatibilityDate: '2025-06-09',

  devServer: {
    port: 10003,
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:10001/api/',
      apiCloud: 'http://localhost:10002/api/',
      landpptBase: 'http://localhost:10006',
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
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
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
    charts: ['BarChart', 'LineChart', 'PieChart', 'RadarChart', 'GaugeChart'],
    components: ['DatasetComponent', 'GridComponent', 'TooltipComponent', 'LegendComponent'],
  },

  vite: {
    resolve: {
      dedupe: ['vue', '@vue/runtime-core', '@vue/runtime-dom', '@vue/server-renderer', '@vue/reactivity', '@vue/shared'],
    },
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
      ],
      exclude: [
        '@vue-office/docx',
        '@vue-office/excel',
        '@vue-office/pdf',
        '@vue-office/pptx',
      ],
    },
  },
})
