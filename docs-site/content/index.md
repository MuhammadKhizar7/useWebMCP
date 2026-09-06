---
title: WebMCP Tools for Vue
description: A small, framework-neutral core and Vue composable for optional WebMCP tools.
navigation:
  title: Home
  order: 1
---

# WebMCP Tools for Vue

Add useful tools to Vue applications without making WebMCP a
requirement for your users.

The library keeps WebMCP optional: applications continue to work normally when
the capability is unavailable. Start with [How WebMCP Works](/getting-started/how-webmcp-works),
then [install for Vue](/getting-started/vue-installation) and build your first
tool.

## Documentation

### Vue

- [Install for Vue](/getting-started/vue-installation)
- [Build Your First Vue Tool](/getting-started/vue-first-tool)
- [Register One Tool](/vue/use-webmcp)
- [Vue Coffee Shop Demo](/vue/examples/coffee-shop)

### Nuxt

- [Install for Nuxt](/getting-started/nuxt-installation)
- [Register One Tool (Nuxt)](/nuxt/use-webmcp)

### Core & Guides

- [How WebMCP Works](/getting-started/how-webmcp-works)
- [Controller Reference](/core/controller-reference)
- [JavaScript Support](/getting-started/javascript)
- [External Demo Catalog](/examples/upstream-demos)
- [Security](/guides/security)
- [SSR & Browser Support](/guides/ssr-and-browser-support)
- [Troubleshooting](/guides/troubleshooting)

## Browser capability

WebMCP is detected at runtime through the browser capability surface. This
documentation site does not import WebMCP packages or access browser globals
during server-side rendering or static builds.
