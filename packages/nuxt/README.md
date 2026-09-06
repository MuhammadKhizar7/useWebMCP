# nuxt-webmcp-tool

[![npm version](https://img.shields.io/npm/v/nuxt-webmcp-tool)](https://www.npmjs.com/package/nuxt-webmcp-tool)

Nuxt module for registering WebMCP tools in browser applications. Auto-imports the `useWebMCP` composable from [vue-webmcp-tool](../vue).

## Install

```bash
npm install nuxt-webmcp-tool
```

## Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-webmcp-tool'],
})
```

## Usage

`useWebMCP` is auto-imported — no import needed:

```vue
<script setup lang="ts">
const { supported, registered, error } = useWebMCP({
  name: 'greet',
  description: 'Say hello',
  inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
  execute: async (args) => ({ content: [{ type: 'text', text: `Hello ${args.name}` }] }),
})
</script>
```

## Learn more

- [Documentation](https://github.com/MuhammadKhizar7/useWebMCP#readme)
- [Vue composable API](../vue/README.md)
