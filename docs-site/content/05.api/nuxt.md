---
title: nuxt-webmcp-tool API
navigation:
  title: nuxt-webmcp-tool
  order: 4
---

# nuxt-webmcp-tool API Reference

Nuxt module that auto-imports `useWebMCP` and its types from `vue-webmcp-tool`. No explicit import is needed.

## Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-webmcp-tool'],
})
```

The module registers `useWebMCP` as a global auto-import along with the following types:

| Export | Kind |
|--------|------|
| `useWebMCP` | Composable (function) |
| `UseWebMCPOptions` | Type |
| `UseWebMCPConfig` | Type |
| `UseWebMCPState` | Type |

## `useWebMCP`

Identical to the Vue version. See [vue-webmcp-tool API](/api/vue) for the full signature and options.

### Basic usage (Nuxt)

```vue
<script setup lang="ts">
const { supported, registered, error } = useWebMCP({
  name: 'greet',
  description: 'Greet a user',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
  execute: async (args) => {
    return `Hello, ${args.name}!`
  },
})
</script>
```

No `import` statement is required — the composable is available globally after installing the module.

## Types

### `UseWebMCPOptions`

Alias for `ToolControllerOptions` from `webmcp-tool-core`. See [core API](/api/core) for the full definition.

### `UseWebMCPConfig`

```ts
interface UseWebMCPConfig {
  retryMs?: number
  retryTimeout?: number
}
```

Optional runtime configuration for the discovery retry behavior.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `retryMs` | `number` | `100` | Milliseconds between retry attempts |
| `retryTimeout` | `number` | `3000` | Maximum total wait time for `document.modelContext` |

### `UseWebMCPState`

```ts
interface UseWebMCPState {
  supported: ShallowRef<boolean>
  registered: ShallowRef<boolean>
  error: ShallowRef<Error | null>
}
```

Reactive state returned by `useWebMCP`.

## Module metadata

| Field | Value |
|-------|-------|
| Module name | `nuxt-webmcp-tool` |
| Config key | `webmcpTool` |
| Nuxt compatibility | `>=4.0.0` |
