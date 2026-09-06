# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-09-06

### Added

- `webmcp-tool-core` — framework-neutral WebMCP tool lifecycle, detection,
  result normalization, abort cleanup, and callback freshness.
- `vue-webmcp-tool` — Vue 3 `useWebMCP` composable with SSR safety and
  reactive metadata.
- `nuxt-webmcp-tool` — Nuxt module that auto-imports `useWebMCP` and its
  types. Requires Nuxt 4.0 or later.
- Coffee shop demo application (`examples/coffee-shop`).
- Documentation site built with Docus.
