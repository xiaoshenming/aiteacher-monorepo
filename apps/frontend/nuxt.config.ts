// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@tresjs/nuxt', '@nuxt/ui-pro', '@nuxt/devtools'],
  compatibilityDate: '2025-03-06',

  devServer: {
    port: 6666,
  },

  css: ['~/assets/css/main.css'],

  fonts: {
    provider: 'bunny'
  },

  tres: {
    devtools: true,
  },
})
