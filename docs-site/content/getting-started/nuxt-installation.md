---
title: Install for Nuxt
description: Add WebMCP tools to a Nuxt application with auto-imports.
navigation:
  title: Install for Nuxt
  order: 2
---

# Install for Nuxt

Add WebMCP tools to a Nuxt application. The Nuxt module registers `useWebMCP`
as an auto-import so you can use it in any component without explicit imports.

::steps

### Install the packages

```sh [Terminal]
pnpm add nuxt-webmcp-tool
```

The module depends on `use-vue-webmcp-tool` and `webmcp-tool-core` which are
installed automatically.

### Add the module to `nuxt.config`

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-webmcp-tool'],
})
```

### Add a WebMCP tool from any component

`useWebMCP` is auto-imported by the module. No import statement is needed.

```vue [app.vue]
<script setup lang="ts">
const { supported, registered, error } = useWebMCP({
  name: 'get-greeting',
  description: 'Return a greeting for a named person.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
  execute: (args) => {
    if (!args || typeof args !== 'object' || !('name' in args) || typeof args.name !== 'string') {
      throw new TypeError('name must be a string')
    }
    return `Hello, ${args.name}.`
  },
})
</script>

<template>
  <p v-if="!supported">WebMCP is unavailable. The app still works normally.</p>
  <p v-else-if="registered">The greeting tool is registered.</p>
  <p v-else-if="error">The greeting tool could not be registered.</p>
</template>
```

::

::tip
WebMCP is progressive enhancement. The Nuxt module does not affect server-side
rendering — `useWebMCP` defers browser interaction to `onMounted`, so the
composable is safe in SSR and universal rendering modes.
::
