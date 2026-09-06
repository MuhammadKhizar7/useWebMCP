export default defineNuxtConfig({
  modules: ['../src/module'],
  compatibilityDate: 'latest',
  app: {
    head: {
      script: [
        {
          src: '/webmcp-polyfill.js',
        },
      ],
    },
  },
})
