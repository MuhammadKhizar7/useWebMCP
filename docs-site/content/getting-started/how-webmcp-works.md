---
title: How WebMCP Works
description: Understand what users and browsers need for WebMCP tools to work.
navigation:
  title: How WebMCP Works
  order: 3
---

# How WebMCP Works

WebMCP lets a compatible browser expose useful actions and information from your
application to an agent. Your application remains a normal application first:
when the browser does not provide WebMCP, the page continues to work.

## What the browser provides

The default environment calls `globalThis.document?.modelContext` when a
controller starts. A context must provide `registerTool(tool, options?)`.
Optional `unregisterTool`, `getTools`, `executeTool`, and `toolchange` members
are feature-detected. The baseline cleanup mechanism is the registration
`AbortSignal`; explicit unregistration is used when the runtime provides it.

The library does not use browser-version detection. A browser or origin either
provides the runtime capability when discovery occurs, or it does not.

## What happens when it is unavailable

An unsupported browser is a normal state. A controller starts with
`{ supported: false, registered: false, error: null }`; if no capability appears
before the discovery timeout, `error` becomes a `ToolTimeoutError` while
`supported` remains `false`. This diagnostic does not mean the application is
unsupported or should stop rendering.

::tip
Keep the visible application path independent of WebMCP. Use `supported` and
`registered` for status or optional affordances, not as a prerequisite for core
application behavior.
::

## What a tool should do

`inputSchema` describes the tool to the model. It is not runtime validation.
Every `execute` callback must validate its arguments and authorization before it
performs work. Use concise descriptions and outputs, mark read-only tools with
`readOnlyHint`, and treat `untrustedContentHint` and `exposedTo` as trust-boundary
decisions.

The browser-facing wrapper includes discoverable metadata and `execute`. It does
not forward the library-only `formatOutput` or `onError` properties to WebMCP.
