---
title: Troubleshooting
description: Diagnose WebMCP registration, timeout, and lifecycle issues.
navigation:
  title: Troubleshooting
  order: 3
---

# Troubleshooting

Start by checking the reactive state returned by `useWebMCP`, or the snapshot
returned by a core controller. The states distinguish ordinary absence from a
registration failure.

## `supported` is false

This is expected when the runtime does not expose `document.modelContext`. Keep
the application path working without WebMCP. Do not add browser-version checks
or create a fake `modelContext` to make the state appear supported.

If `error` is a `ToolTimeoutError`, discovery completed its retry window without
finding a context. Check the actual browser, origin, and feature-availability
requirements for the target environment. The application does not need to fail
because this capability is absent.

## `error` is a registration error

The browser context was found, but `registerTool` rejected the registration.
Inspect `error.message` and the underlying browser/runtime diagnostics. Check
that the name is unique, metadata is valid for the runtime, and the callback
does not depend on server-only code.

Tool names must be unique within the underlying model context. If registration is
rejected, make sure another mounted component has not already registered the same
name.

## A tool remains active after navigation

Tools registered by `useWebMCP` belong to the component that created them. Confirm
that the owning component actually unmounts during navigation. The composable
stops and cleans up its controller on unmount; `stop` and disposal are idempotent.

## Results look different from the callback return value

The browser wrapper normalizes results. Existing `{ content: [...] }` text
responses retain their identity; `null` and `undefined` become empty content;
strings and JSON-serializable values become text content. Thrown or rejected
values become error content with `isError: true`, and the latest `onError`
callback receives the normalized `Error`.
