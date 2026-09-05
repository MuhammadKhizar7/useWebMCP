# WebMCP Tools for Vue

[![npm webmcp-tool-core](https://img.shields.io/npm/v/webmcp-tool-core)](https://www.npmjs.com/package/webmcp-tool-core)
[![npm use-vue-webmcp-tool](https://img.shields.io/npm/v/use-vue-webmcp-tool)](https://www.npmjs.com/package/use-vue-webmcp-tool)

A small Vue 3 composable for progressive enhancement with the browser's
`document.modelContext` WebMCP surface. Unsupported browsers keep working
normally and do not throw.

## Packages

- `webmcp-tool-core`: framework-neutral lifecycle, detection, normalization,
  abort cleanup, and callback freshness.
- `use-vue-webmcp-tool`: the Vue 3 `useWebMCP` composable.

## Install

```sh
pnpm add webmcp-tool-core use-vue-webmcp-tool
```

## Vue

```ts
import { useWebMCP } from 'use-vue-webmcp-tool'

const { supported, registered, error } = useWebMCP({
  name: 'search-products',
  description: 'Search the product catalog.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  execute: async (args, { signal }) => {
    if (!args || typeof args !== 'object' || typeof args.query !== 'string') {
      throw new TypeError('query is required')
    }
    const response = await fetch(`/api/products?q=${encodeURIComponent(args.query)}`, { signal })
    if (!response.ok) throw new Error('Product search failed')
    return response.json()
  },
})
```

`useWebMCP` starts after mount, watches reactive tool options, and stops on
unmount. The returned state is `{ supported, registered, error }`.

## Core

```ts
import { createToolController } from 'webmcp-tool-core'

const controller = createToolController({
  name: 'lookup-order',
  description: 'Look up an order by its public identifier.',
  execute: async (args, { signal }) => {
    if (!args || typeof args !== 'object' || typeof args.id !== 'string') {
      throw new TypeError('id must be a string')
    }
    const response = await fetch(`/api/orders/${encodeURIComponent(args.id)}`, { signal })
    if (!response.ok) throw new Error('Order lookup failed')
    return response.json()
  },
})

controller.start()
controller.stop()
```

The core accepts the current `execute(args, { signal })` form and the
one-argument form used by the original React reference. `inputSchema` is
descriptive; callbacks must validate their own input and authorization.

Successful values are normalized to WebMCP content responses. Thrown and
rejected values call the latest `onError` callback and become error content.
Metadata changes are compared by value, while callback changes stay fresh
without forcing a new browser registration.

## Browser Capability

Detection is based only on `document.modelContext`; this package does not
guess support from browser versions. Registration uses
`registerTool(tool, { signal })` and aborts on component cleanup. Optional
browser methods are feature-detected.

## Documentation And Demo

- Run the docs with `pnpm docs:dev`.
- Run the demo with `pnpm example:coffee-shop:dev`.
- Build everything with `pnpm docs:build` and `pnpm example:coffee-shop:build`.
- Read the [Vue coffee-shop guide](docs-site/content/vue/examples/coffee-shop.md).
- See the [upstream demo catalog](docs-site/content/examples/external/upstream-demos.md)
  for browser and framework references. This repository ships no React,
  Angular, or Nuxt adapter.

## Security

Treat every exposed tool as an agent-facing API. Validate arguments and
authorization inside the callback, keep outputs concise, mark untrusted data
with `untrustedContentHint`, and never expose secrets or privileged operations
merely because a browser agent can call a tool.
