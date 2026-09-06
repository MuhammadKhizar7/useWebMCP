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
import { useWebMCP } from 'vue-webmcp-tool'

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

::important{icon="i-lucide-server"}
**SSR safety.** The composable defers browser interaction to `onMounted`, so
no browser APIs are accessed during server-side rendering. You can safely use it
in universal (SSR) mode.
::

The page must remain useful in the first state. `supported: false` with
`registered: false` and `error: null` is the ordinary initial unsupported state.
If discovery waits three seconds without finding a context, `error` contains a
`ToolTimeoutError` while `supported` remains false. That timeout is a diagnostic,
not a reason to fail rendering.

## Capability support

Capability availability depends on the browser build, origin, feature settings,
and the current WebMCP implementation. Use a Chrome environment that exposes
`document.modelContext` and satisfies the current WebMCP requirements in the
target environment.

::note{icon="i-lucide-info"}
**Runtime detection.** Capability detection is authoritative; this library does
not detect browser versions and does not promise support from a version number.
A browser either provides the runtime capability when discovery occurs, or it
does not.
::

The required context method is `registerTool(tool, options?)`. The controller
also uses `unregisterTool` if available for cleanup; otherwise, the
registration `AbortSignal` is the baseline cleanup mechanism.

## Graceful degradation

::steps{icon="i-lucide-layers"}

### Detect capability

The controller checks for `document.modelContext` at startup. If not found,
it retries every 100ms for up to 3 seconds.

### Report state

Use `supported`, `registered`, and `error` to communicate capability status
to your UI. These are reactive refs in Vue.

### Provide fallbacks

Show appropriate UI based on the state. `supported: false` means WebMCP is
not available — your app should work normally without it.

### Handle timeout

If discovery times out, `error` becomes a `ToolTimeoutError`. This is a
diagnostic, not a failure. The app continues working.

::

::tip{icon="i-lucide-shield"}
**Never block rendering.** The visible application path should be independent
of WebMCP. Use `supported` and `registered` for status or optional affordances,
not as a prerequisite for core application behavior.
::
