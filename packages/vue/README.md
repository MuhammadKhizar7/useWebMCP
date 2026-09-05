# use-vue-webmcp-tool

Vue 3 composable for browser WebMCP tools. Wraps `webmcp-tool-core` with reactive options, auto-start on mount, and cleanup on unmount.

## Install

```sh
npm install use-vue-webmcp-tool
```

Requires Vue 3.5+ as a peer dependency.

## Usage

```vue
<script setup>
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
    const response = await fetch(`/api/products?q=${args.query}`, { signal })
    return response.json()
  },
})
</script>

<template>
  <p v-if="!supported">WebMCP not available</p>
  <p v-else-if="registered">Agent tools ready</p>
</template>
```

## Docs

See the [full documentation](https://github.com/MuhammadKhizar7/useWebMCP#readme) for core API, error handling, and the coffee-shop demo.

## License

MIT
