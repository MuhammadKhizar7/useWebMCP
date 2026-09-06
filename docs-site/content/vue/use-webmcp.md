---
title: Register One Tool with useWebMCP
description: Add one reactive WebMCP tool to a Vue component.
navigation:
  title: Register One Tool
  order: 1
---

# Register One Tool with `useWebMCP`

Use `useWebMCP` when one Vue component owns one tool. The composable starts after
the component mounts, keeps reactive callbacks current, and cleans up when the
component unmounts.

## Usage

```vue [src/components/OrderTool.vue]
<script setup lang="ts">
import { useWebMCP } from 'vue-webmcp-tool'

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

## Exact signature and return value

```ts
import type { MaybeRefOrGetter } from 'vue'
import type {
  UseWebMCPConfig,
  UseWebMCPOptions,
  UseWebMCPState,
} from 'vue-webmcp-tool'

function useWebMCP<TArgs = unknown, TResult = unknown>(
  options: MaybeRefOrGetter<UseWebMCPOptions<TArgs, TResult>>,
  config?: UseWebMCPConfig,
): UseWebMCPState

```

`options` can be a plain object, a Vue ref, or a getter. The optional config is
for environment injection; omit it for the real browser environment. The
returned refs update with controller snapshots and are not booleans or a
promise.

## Fresh callbacks and metadata

Updating only `execute`, `formatOutput`, or `onError` does not re-register the
tool. The browser wrapper calls the latest callback, which keeps reactive state
fresh without replacing discoverable metadata. Changing `name`, `description`,
`inputSchema`, or `annotations` does re-register the tool. Schema and annotation
objects with equal JSON serialization retain the existing registration.

Unmounting stops and cleans up this composable's controller. Each component should
choose unique tool names for the tools it owns.

::note
`inputSchema` documents the input but does not validate it. Validate the actual
argument at the start of every callback, and perform authorization there too.
::
