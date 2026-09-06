# Contributing

Thanks for your interest in contributing to useVueWebMCP.

## Prerequisites

- Node.js 18+
- pnpm (this project uses pnpm workspaces)

## Repository Layout

```
useVueWebMCP/
  packages/
    core/       webmcp-tool-core — framework-neutral lifecycle
    vue/        vue-webmcp-tool — Vue 3 composable
    nuxt/       nuxt-webmcp-tool — Nuxt module
  docs-site/    Docus documentation site
  examples/
    coffee-shop/  Demo application
  scripts/      Build and validation scripts
```

## Getting Started

```sh
pnpm install
pnpm build
```

## Common Tasks

| Task | Command |
|------|---------|
| Build packages | `pnpm build` |
| Build Nuxt module | `pnpm nuxt:build` |
| Run tests | `pnpm test` |
| Run tests in watch mode | `pnpm test:watch` |
| Validate docs links | `pnpm test:docs` |
| Validate package entrypoints | `pnpm test:entrypoints` |
| Run type checker | `pnpm typecheck` |
| Dev server (docs) | `pnpm docs:dev` |
| Dev server (demo) | `pnpm example:coffee-shop:dev` |

## Testing

The project uses [Vitest](https://vitest.dev/) with globals enabled.

```sh
pnpm test              # run all tests once
pnpm test:watch        # run tests in watch mode
pnpm test:compatibility  # SSR safety and compatibility tests
```

Tests live alongside their packages:
- `packages/core/tests/` — controller lifecycle, normalization, environment
- `packages/vue/tests/` — composable lifecycle, SSR safety
- `packages/nuxt/test/` — module integration tests

## Documentation

The docs site uses [Docus](https://docus.dev/) and lives in `docs-site/`.

Content files use numeric prefixes for ordering:

```
content/
  01.getting-started/
    01.how-webmcp-works.md
    02.vue-installation.md
    ...
  02.vue/
    01.use-webmcp.md
    ...
```

To add a new page, prefix the filename with the next number in the sequence
(e.g. `06.my-new-page.md`). The prefix is stripped from the URL —
`05.api/02.core.md` is served at `/api/core`.

API reference pages in `05.api/` are auto-generated from source code:

```sh
cd docs-site && node scripts/generate-api-docs.mjs
```

This reads TypeScript source from `packages/core/src/` and `packages/vue/src/`
and writes markdown to `content/05.api/`.

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature or capability
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `chore:` — build, tooling, or maintenance

Examples:

```
feat(nuxt): add auto-import for UseWebMCPState type
docs: fix API reference for ModelContextLike
fix: handle null return from unregisterTool
```

## Release

Releases are managed manually. The `release` script builds all packages
and publishes them to npm:

```sh
pnpm release
```

This runs `tsc -b` for core and vue, `@nuxt/module-builder` for nuxt,
then publishes each package in dependency order.

## Project Structure Notes

- **TypeScript strict mode** is enabled across all packages with additional
  strict flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Zero runtime dependencies** in `webmcp-tool-core` and `vue-webmcp-tool`.
- The `nuxt` package depends on `@nuxt/kit` (peer) and `vue-webmcp-tool`
  (workspace).
- All packages ship ESM only (no UMD/IIFE bundles).
