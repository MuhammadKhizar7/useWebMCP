---
title: SSR and Browser Support
description: Understand SSR safety and runtime-dependent WebMCP support.
navigation:
  title: SSR and Browser Support
  order: 2
---

# SSR and Browser Support

WebMCP is a runtime capability, not a compile-time guarantee. The default
environment reads `globalThis.document?.modelContext` only when a controller
discovers a capability.

## SSR-safe usage

Import the composable normally in a Vue component. Do not read `document` in
module scope or setup code.

```vue [components/OptionalWebMCP.vue]
<script setup lang="ts">
import { useWebMCP } from 'use-vue-webmcp-tool'

const { supported, registered, error } = useWebMCP({
  name: 'get-status',
  description: 'Return the current application status.',
  annotations: { readOnlyHint: true },
  execute: () => ({ status: 'ready' }),
})
</script>

<template>
  <p v-if="!supported">WebMCP is unavailable. The application still works.</p>
  <p v-else-if="registered">The status tool is registered.</p>
  <p v-else-if="error">Registration diagnostic: {{ error.message }}</p>
</template>
```

The page must remain useful in the first state. `supported: false` with
`registered: false` and `error: null` is the ordinary initial unsupported state.
If discovery waits three seconds without finding a context, `error` contains a
`ToolTimeoutError` while `supported` remains false. That timeout is a diagnostic,
not a reason to fail rendering.

## Capability support

Capability availability depends on the browser build, origin, feature settings,
and the current WebMCP implementation. Use a Chrome environment that exposes
`document.modelContext` and satisfies the current WebMCP requirements in the
target environment. Capability detection is authoritative; this library does
not detect browser versions and does not promise support from a version number.

The required context method is `registerTool(tool, options?)`. The core
feature-detects optional `unregisterTool`, `getTools`, `executeTool`, and
`toolchange` methods. Abort-signal cleanup remains the baseline when explicit
unregistration is unavailable.
