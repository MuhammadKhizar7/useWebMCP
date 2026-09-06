---
title: Build Your First Vue Tool
description: Build a small Vue tool that enhances an application when WebMCP is available.
navigation:
  title: Build Your First Vue Tool
  order: 2
---

# Build Your First Vue Tool

This example adds a store-hours tool to a normal Vue page. WebMCP is an optional
enhancement: the page still works when the browser does not provide it.

## A complete component

Copy this component into a Vue 3 application. The application remains usable
when the browser does not expose WebMCP.

```vue [src/App.vue]
<script setup lang="ts">
import { useWebMCP } from 'vue-webmcp-tool'

const { supported, registered, error } = useWebMCP({
  name: 'get-store-hours',
  description: 'Return the store opening hours for today.',
  annotations: { readOnlyHint: true },
  execute: () => ({
    day: 'Monday',
    opens: '07:00',
    closes: '18:00',
  }),
})
</script>

<template>
  <main>
    <h1>Store hours</h1>
    <p>Monday: 07:00 to 18:00</p>
    <p v-if="!supported">WebMCP is not available in this browser.</p>
    <p v-else-if="registered">An agent can discover the store-hours tool.</p>
    <p v-else-if="error">The tool registration failed: {{ error.message }}</p>
  </main>
</template>
```

The callback returns an ordinary object. The controller normalizes that object
to a WebMCP text content response before exposing it to the browser runtime.

## Test the tool

1. Start the Vue application with its usual development command.
2. Open it in a Chrome environment that exposes `document.modelContext` and
   satisfies the current WebMCP origin and feature requirements.
3. Confirm that `registered.value` becomes `true` after mount.
4. In a browser without the capability, confirm that the page still renders and
   `supported.value` remains `false` unless discovery times out.

::note
Do not create a fake `modelContext` in application code or documentation
examples. The package's default browser environment is the capability boundary.
::
