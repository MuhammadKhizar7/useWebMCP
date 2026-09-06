---
title: Register One Tool with useWebMCP (Nuxt)
description: Add one reactive WebMCP tool to a Nuxt component with auto-imports.
navigation:
  title: Register One Tool
  order: 1
---

# Register One Tool with `useWebMCP` (Nuxt)

In Nuxt applications, `useWebMCP` is auto-imported by the `nuxt-webmcp-tool`
module. Use it in any component without an import statement.

## Usage

```vue [components/OrderTool.vue]
<script setup lang="ts">
const { supported, registered, error } = useWebMCP({
  name: 'lookup-order',
  description: 'Look up an order by its public identifier.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  execute: async (args, { signal }) => {
    if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
      throw new TypeError('id must be a string')
    }
    const response = await fetch(`/api/orders/${encodeURIComponent(args.id)}`, { signal })
    if (!response.ok) throw new Error('Order lookup failed')
    return response.json()
  },
})
</script>

<template>
  <p v-if="!supported">WebMCP is unavailable.</p>
  <p v-else-if="registered">Order lookup is available to the model.</p>
  <p v-else-if="error">Registration error: {{ error.message }}</p>
</template>
```

::note{icon="i-lucide-magic-wand"}
**Auto-imported.** `useWebMCP` is available in any component without an import
statement. The Nuxt module registers it at build time.
::

## How it works under the hood

The Nuxt module calls `addImports` at build time to register `useWebMCP` (and
its types) as auto-imports. At runtime, the auto-imported composable is the
same `useWebMCP` from `vue-webmcp-tool` — no wrapper, no extra overhead.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-webmcp-tool'],
})
```

::tip{icon="i-lucide-zap"}
**Zero overhead.** The auto-import is a build-time convenience. At runtime,
the composable is identical to importing from `vue-webmcp-tool` directly.
::

## Explicit import (optional)

If you prefer explicit imports over auto-imports, you can import directly from
the underlying package:

```vue
<script setup lang="ts">
import { useWebMCP } from 'vue-webmcp-tool'

const { supported, registered, error } = useWebMCP({
  name: 'my-tool',
  description: 'A tool.',
  execute: () => 'ok',
})
</script>
```

Both approaches are equivalent. The auto-import is a convenience, not a
requirement.

## SSR safety

`useWebMCP` is SSR-safe by design. The controller starts in `onMounted` and
stops in `onUnmounted`, so no browser APIs are accessed during server-side
rendering. You can safely use it in universal (SSR) mode.

::important{icon="i-lucide-server"}
**SSR-safe.** The composable defers browser interaction to `onMounted`, so
no browser APIs are accessed during server-side rendering. Safe in universal
(SSR) and client-only modes.
::

## Lifecycle

::steps{icon="i-lucide-list-ordered"}

### Module setup

The Nuxt module registers `useWebMCP` as an auto-import at build time.

### Component mount

When a component using `useWebMCP` mounts, the controller starts discovery.

### Active

The tool is registered and available to agents. Callbacks are kept current.

### Component unmount

The composable stops and cleans up the controller. The tool is removed.

::

::warning{icon="i-lucide-shield-alert"}
**Validate input.** `inputSchema` documents the input but does not validate it.
Validate the actual argument at the start of every callback, and perform
authorization there too.
::
