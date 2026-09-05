export default defineNuxtConfig({
  extends: ['docus'],

  compatibilityDate: '2026-09-04',

  site: {
    name: 'WebMCP Tools for Vue',
    description: 'A small, framework-neutral core and Vue composable for registering WebMCP tools in browser applications.',
  },

  appConfig: {
    seo: {
      title: 'WebMCP Tools for Vue',
      description: 'A small, framework-neutral core and Vue composable for registering WebMCP tools in browser applications.',
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
