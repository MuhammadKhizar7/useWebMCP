---
title: Controller Reference
description: Use the framework-neutral controller when you need direct control.
navigation:
  title: Controller Reference
  order: 1
---

# Controller Reference

`createToolController` owns one tool registration. It can be used directly from
framework code or wrapped by the Vue composables.

## Create a controller

```ts [src/webmcp.ts]
import { createToolController } from 'webmcp-tool-core'

const controller = createToolController({
  name: 'lookup-order',
  description: 'Look up an order by its public identifier.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: async (args, { signal }) => {
    if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
      throw new TypeError('id must be a string')
    }
    const response = await fetch(`/api/orders/${encodeURIComponent(args.id)}`, { signal })
    if (!response.ok) throw new Error('Order lookup failed')
    return response.json()
  },
  onError: (error) => console.error(error),
})

controller.start()
console.log(controller.snapshot)
controller.stop()
```

`createToolController(initialOptions, environment?)` returns a
`ToolController<TArgs, TResult>`. The optional environment is an injection
point for tests or custom runtimes; normal browser usage should omit it so the
package uses its real `document.modelContext` environment.

## Exact controller API

```ts
import type {
  WebMCPEnvironment,
  WebMCPTool,
  WebMCPToolOptions,
} from 'webmcp-tool-core'

type ToolControllerOptions<TArgs = unknown, TResult = unknown> =
  WebMCPTool<TArgs, TResult> & WebMCPToolOptions & {
    enabled?: boolean
  }

interface ToolControllerSnapshot {
  readonly supported: boolean
  readonly registered: boolean
  readonly error: Error | null
}

interface ToolController<TArgs = unknown, TResult = unknown> {
  readonly snapshot: ToolControllerSnapshot
  start(): void
  update(options: ToolControllerOptions<TArgs, TResult>): void
  stop(): void
  subscribe(listener: (snapshot: ToolControllerSnapshot) => void): () => void
}

function createToolController<TArgs = unknown, TResult = unknown>(
  initialOptions: ToolControllerOptions<TArgs, TResult>,
  environment?: WebMCPEnvironment,
): ToolController<TArgs, TResult>
```

`start`, `update`, and `stop` return `void`. `subscribe` returns an unsubscribe
function. Calling `stop` and the returned unsubscribe function is safe more than
once. Each active registration has its own `AbortController`; stopping aborts
in-flight work and uses `unregisterTool` when available.

## Updates and identity

The controller keeps the current `execute`, `formatOutput`, and `onError`
references in its options. A callback can therefore close over current
application state without causing browser re-registration. The registered
wrapper calls the latest callback when the model invokes the tool.

The registration identity contains `name`, `description`, and the serialized
`inputSchema` and `annotations`. Equal serialized metadata does not replace the
browser registration. Changing any identity field stops the old registration
and registers the new metadata. Changing `enabled` to `false` stops registration
and clears `error`; changing it back to `true` starts discovery again.

## Results and errors

The wrapper normalizes callback results as follows:

- An existing `{ content: [...] }` text result keeps its object identity.
- `null` and `undefined` become `{ content: [] }`.
- Strings become one text content item.
- JSON-serializable other values become one text content item containing JSON.
- Unserializable values and thrown or rejected values become an error content
  response with `isError: true`.

Thrown values are converted to `Error` instances. The latest `onError` callback
receives that error, but an error thrown by `onError` does not replace the
normalized tool result. Registration failures appear in `snapshot.error` as an
`Error`, normally a `ToolRegistrationError`. Discovery timeout uses
`ToolTimeoutError`.
