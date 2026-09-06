---
title: WebMCP Security
description: Secure WebMCP tools with validation, annotations, and authorization.
navigation:
  title: Security
  order: 1
---

# WebMCP Security

A discovered tool is an application entry point. Treat every model-provided
argument as untrusted input, and treat every tool as a request that still needs
the application's normal authorization checks.

::warning{icon="i-lucide-shield-alert"}
**Never trust input from the model.** Every `execute` callback must validate its
arguments and perform authorization checks before reading data or changing state.
`inputSchema` describes the input to the model — it is not runtime validation.
::

## Validate at runtime

Check types, ranges, allowed identifiers, and authorization inside `execute`
before reading data or changing state.

```vue [src/components/DeleteDraftTool.vue]
<script setup lang="ts">
import { useWebMCP } from 'vue-webmcp-tool'

const { supported, registered, error } = useWebMCP({
  name: 'delete-draft',
  description: 'Delete a draft owned by the current user.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  registration: {
    exposedTo: ['https://app.example.com'],
  },
  execute: async (args, { signal }) => {
    if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string' || args.id.length === 0) {
      throw new TypeError('id must be a non-empty string')
    }

    const response = await fetch(`/api/drafts/${encodeURIComponent(args.id)}`, {
      method: 'DELETE',
      signal,
    })
    if (response.status === 403) throw new Error('You are not authorized to delete this draft')
    if (!response.ok) throw new Error('Draft deletion failed')
    return { deleted: args.id }
  },
})
</script>

<template>
  <p v-if="!supported">WebMCP is unavailable.</p>
  <p v-else-if="registered">Delete-draft is available to the model.</p>
  <p v-else-if="error">Registration error: {{ error.message }}</p>
</template>
```

## Control tool exposure

Use `exposedTo` to restrict which origins can discover your tool. This contains
trusted caller origins, not an agent role or a generic label.

::important{icon="i-lucide-lock"}
**Use exact HTTPS origins.** List the specific origins authorized to discover
the tool, such as `https://app.example.com`. Do not use wildcards, `assistant`,
or development-only origins. The browser/runtime must enforce these restrictions
for the annotation to provide security value.
::

## Describe risk accurately

Use annotations to communicate tool behavior to the model and runtime:

- `readOnlyHint: true` — tool does not change state
- `untrustedContentHint: true` — returned data is from external sources
- `destructiveHint: true` — tool performs destructive operations
- `idempotentHint: true` — repeated calls have the same effect
- `openWorldHint: false` — tool only accesses known, trusted resources

::note
These annotations describe behavior and trust. They do not replace authorization,
input validation, CSRF protection, or rate limiting.
::

## Keep outputs concise

- Do not expose secrets, tokens, private records, or privileged operations
- Prefer narrow tools with explicit allowed actions over generic endpoints
- Avoid returning sensitive details in error messages
- The controller normalizes return values to text content and thrown values to
  error content — be aware of what information leaks through errors

## Server-side authorization

The callback runs in the page context. A server endpoint must authenticate and
authorize the request independently; client-side checks are not a security
boundary.

::tip{icon="i-lucide-server"}
Always validate authorization server-side. The `execute` callback can check
permissions, but your API endpoints must enforce them independently.
::
