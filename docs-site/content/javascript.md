---
title: JavaScript Support
description: Use WebMCP Tools from plain JavaScript or Vue.
navigation:
  title: JavaScript Support
  order: 1
---

# JavaScript Support

The packages run in JavaScript. The published packages are ESM, so you can use
them from a JavaScript application with a bundler such as Vite, Rollup, or
webpack. TypeScript declarations are included for projects that want static
type checking, but TypeScript is not required at runtime.

::note{icon="i-lucide-code-2"}
**ESM only.** The packages ship as ES modules. Use them with a bundler (Vite,
Rollup, webpack) or directly served ESM modules. No UMD/IIFE bundle or
`window.WebMCP` global is provided.
::

## Use the core from plain JavaScript

Use `webmcp-tool-core` when you do not need a framework adapter. Omit the
environment argument in a browser application so the package can detect the
real `document.modelContext` capability after you start the controller.

```js [src/webmcp-tools.js]
import { createToolController } from 'webmcp-tool-core'

const controller = createToolController({
  name: 'get-store-hours',
  description: 'Return today's store hours.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  annotations: { readOnlyHint: true },
  execute: () => ({
    day: 'Monday',
    opens: '07:00',
    closes: '18:00',
  }),
})

controller.start()
```

Callbacks can use one argument or receive the abort signal as the second
argument. Validate arguments inside the callback; a schema helps discovery but
does not protect your application by itself.

::warning{icon="i-lucide-shield-alert"}
**Always validate input.** `inputSchema` describes the input to the model — it
is not runtime validation. Check types, ranges, and authorization inside
`execute` before reading data or changing state.
::

```js
const searchController = createToolController({
  name: 'search-products',
  description: 'Search the product catalog.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  execute: async (args, { signal }) => {
    if (!args || typeof args !== 'object' || typeof args.query !== 'string') {
      throw new TypeError('query must be a string')
    }

    const response = await fetch(`/api/products?q=${encodeURIComponent(args.query)}`, { signal })
    if (!response.ok) throw new Error('Product search failed')
    return response.json()
  },
})

searchController.start()
```

## Use JavaScript with Vue

Vue still requires Vue itself, but the component can use a normal JavaScript
`<script setup>` block. The composable supplies reactive status refs and handles
mount and unmount cleanup.

```vue [src/components/HoursTool.vue]
<script setup>
import { useWebMCP } from 'vue-webmcp-tool'

const { supported, registered } = useWebMCP({
  name: 'get-store-hours',
  description: 'Return today's store hours.',
  execute: () => ({ day: 'Monday', opens: '07:00', closes: '18:00' }),
})
</script>

<template>
  <p v-if="registered">Store hours are available to the agent.</p>
  <p v-else-if="!supported">The app works normally without WebMCP.</p>
</template>
```

::tip{icon="i-lucide-lightbulb"}
**No TypeScript required.** The composable works with plain JavaScript. TypeScript
declarations are included for type checking, but not required at runtime.
::

## Browser and module limits

WebMCP is optional. If the browser does not expose `document.modelContext`, the
controller remains unregistered and your application should continue normally.
Do not add a fake `modelContext` to production code.

::important{icon="i-lucide-info"}
**Progressive enhancement.** `supported: false` is a normal state, not an error.
Your app should work without WebMCP. The capability is detected at runtime, not
by browser version.
::

These packages provide ESM, not a classic browser script distribution:

- Supported: JavaScript through Vite, Rollup, webpack, or another ESM bundler.
- Supported: a directly served ESM module when you provide valid module URLs
  and dependencies.
- Not provided: a UMD or IIFE bundle, a `window.WebMCP` global, or a plain
  `<script src="...">` integration.

For Vue, JavaScript removes the TypeScript requirement but does not remove the
framework requirement. For direct framework-neutral usage, use the core package.
