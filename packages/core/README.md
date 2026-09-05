# webmcp-tool-core

[![npm version](https://img.shields.io/npm/v/webmcp-tool-core)](https://www.npmjs.com/package/webmcp-tool-core)

Framework-neutral lifecycle for browser WebMCP tools. Handles detection, registration, retry, abort cleanup, and result normalization for `document.modelContext`.

## Install

```sh
npm install webmcp-tool-core
```

## Usage

```ts
import { createToolController } from 'webmcp-tool-core'

const controller = createToolController({
  name: 'lookup-order',
  description: 'Look up an order by its public identifier.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  execute: async (args, { signal }) => {
    const response = await fetch(`/api/orders/${args.id}`, { signal })
    return response.json()
  },
})

controller.start()
// ...
controller.stop()
```

## Docs

See the [full documentation](https://github.com/MuhammadKhizar7/useWebMCP#readme) for reactive options, error handling, and the Vue composable.

## License

MIT
