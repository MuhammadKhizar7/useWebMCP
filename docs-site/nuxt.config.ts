export default defineNuxtConfig({
  extends: ['docus'],

  compatibilityDate: '2026-09-04',

  site: {
    name: 'WebMCP Tools for Vue and Nuxt',
    description: 'A small, framework-neutral core for registering WebMCP tools in Vue and Nuxt applications.',
  },

  appConfig: {
    seo: {
      title: 'WebMCP Tools for Vue and Nuxt',
      description: 'A small, framework-neutral core for registering WebMCP tools in Vue and Nuxt applications.',
    },
    github: false,
  },

  nitro: {
    preset: 'static',
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    prerender: {
      crawlLinks: true,
    },
  },
})
