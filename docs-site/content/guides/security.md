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

## Validate at runtime

`inputSchema` describes the input to the model. It is not runtime validation.
Check types, ranges, allowed identifiers, and authorization inside `execute`
before reading data or changing state.

```vue [src/components/DeleteDraftTool.vue]
<script setup lang="ts">
import { useWebMCP } from 'use-vue-webmcp-tool'

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

`exposedTo` contains trusted caller origins, not an agent role or a generic
label. Use the exact HTTPS origins that are authorized to discover the tool,
such as `https://app.example.com`; list a separate explicit origin only when it
is intentionally trusted. Do not use a wildcard, `assistant`, or an origin that
is only trusted because it is convenient for development. The browser/runtime
must enforce these origin restrictions for the annotation to provide security
value.

The callback runs in the page context. A server endpoint must authenticate and
authorize the request independently; client-side checks are not a security
boundary.

## Describe risk accurately

Use `readOnlyHint: true` for tools that do not change state. Mark returned data
as untrusted with `untrustedContentHint: true` when appropriate, especially for
catalog, user-generated, or remote content. Treat `exposedTo` as a trust-boundary
decision when the target runtime supports that registration annotation. Supply
it at `registration: { exposedTo: [...] }`. These annotations describe behavior
and trust; they do not replace authorization,
input validation, CSRF protection, or rate limiting.

Keep names, descriptions, and outputs concise. Do not expose secrets, tokens,
private records, or privileged operations merely because an agent can call a
tool. Prefer narrow tools with explicit allowed actions over a generic endpoint.

The controller normalizes ordinary return values to text content and converts
thrown or rejected values to error content. Avoid returning sensitive details in
those errors.
