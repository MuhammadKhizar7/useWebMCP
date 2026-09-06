import {
  addImports,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'

export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-webmcp-tool',
    configKey: 'webmcpTool',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addImports({
      name: 'useWebMCP',
      from: resolver.resolve('./runtime/composables/useWebMCP'),
    })

    addImports([
      {
        name: 'UseWebMCPConfig',
        from: resolver.resolve('./runtime/composables/useWebMCP'),
        type: true,
      },
      {
        name: 'UseWebMCPOptions',
        from: resolver.resolve('./runtime/composables/useWebMCP'),
        type: true,
      },
      {
        name: 'UseWebMCPState',
        from: resolver.resolve('./runtime/composables/useWebMCP'),
        type: true,
      },
    ])
  },
})
