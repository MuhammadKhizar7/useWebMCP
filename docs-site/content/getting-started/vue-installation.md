---
title: Install for Vue
description: Install WebMCP Tools for Vue and add your first optional tool.
navigation:
  title: Install for Vue
  order: 1
---

# Install for Vue

Add WebMCP tools to an existing Vue 3 application. The Vue adapter includes the
framework-neutral core, but installing both packages makes the package boundary
clear when you inspect your dependencies.

::steps

### Install the packages

```sh [Terminal]
pnpm add webmcp-tool-core use-vue-webmcp-tool
```

### Confirm Vue is available

`use-vue-webmcp-tool` is a Vue 3 adapter. Your application must already
provide Vue 3 and mount a normal Vue application.

```ts [src/main.ts]
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

### Add a WebMCP tool from a mounted component

Import `useWebMCP` from the Vue package. Do not read `document` during
module evaluation or component setup. The default package environment reads
`document.modelContext` when the composable starts after mount.

```vue [src/App.vue]
<script setup lang="ts">
import { useWebMCP } from 'use-vue-webmcp-tool'

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
WebMCP is progressive enhancement. Capability detection is authoritative; the
packages do not detect browser versions and an unavailable `document.modelContext`
does not make the Vue application fail.
::
