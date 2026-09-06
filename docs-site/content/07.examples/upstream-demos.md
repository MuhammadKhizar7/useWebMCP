---
title: External WebMCP Demo Catalog
description: Explore external WebMCP demos and reference implementations.
navigation:
  title: External Demo Catalog
  order: 2
---

# External WebMCP Demo Catalog

The upstream reference catalog is maintained in
[GoogleChromeLabs/webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools).
Its repository describes developer utilities and demos for exploring the
WebMCP API. The catalog and links below are references to that repository, not
components shipped by this Vue package.

The framework labels in the catalog describe individual upstream demos only.
This repository ships a Vue adapter and a Vue coffee-shop adaptation; it does
not ship React or Angular adapters. Follow each upstream demo's own setup and
documentation when evaluating it.

## Coffee-shop reference

The [upstream coffee-shop README](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/coffee-shop)
calls its demo **The Morning Ritual** and links to its
[hosted demo](https://googlechromelabs.github.io/webmcp-tools/demos/coffee-shop/).
It documents an imperative `document.modelContext.registerTool` implementation
with product search, order history, reorder, and machine-specification flows.

This repository's [Vue Coffee Shop Demo](/vue/examples/coffee-shop) is a separate Vue
and Vite implementation using `vue-webmcp-tool`. It is an adaptation of
the documented coffee-shop idea, not the upstream application or a claim of
feature parity. In particular, the local app uses Vue routes and local typed
fixtures, keeps persistent tools in the root component, and owns machine
specifications in the product-page component. The local tool behavior and routes
are authoritative for the local demo; consult the upstream README for the
upstream behavior.

## Upstream catalog

The upstream repository currently lists these demos. Names and descriptions
below summarize its repository README and may change upstream.

- [WebMCP explainer](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/explainer): a side-by-side explanation of pre-WebMCP scraping and declared tools.
- [Travel WebMCP Demo](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/react-flightsearch): an upstream React flight-search demo using imperative tools; it is not a React adapter in this repository.
- [Le Petit Bistro](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/french-bistro): a declarative restaurant-reservation example.
- [WebMCP zaMaker!](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/pizza-maker): an imperative pizza-building example.
- [Mystery Doors](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/doors): a multi-page declarative and imperative example.
- [WebMCP Maze](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/webmcp-maze): an imperative maze game.
- [CineFlow](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/ticket-booking): a movie-ticket booking flow.
- [Order Tracking](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/order-tracking): a declarative order-tracking and returns example.
- [L'Atelier Hotel Chain](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/hotel-chain): a hotel-booking example using both approaches.
- [WebMCP Sports](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/sport-shop-angular): an upstream Angular storefront using both approaches; it is not an Angular adapter in this repository.
- [The Morning Ritual](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/coffee-shop): the upstream coffee-shop reference described above.
- [UrbanEstates](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/real-estate-map): an imperative real-estate map example.
- [Luxe Leather](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/leather-bag): a declarative leather-bag storefront.
- [WebMCP Smart Home](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/smart-home): an imperative smart-home control dashboard.
- [WebMCP Page Agent](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/page-agent): a Gemini-powered meta-demo for controlling WebMCP-enabled sites.

The upstream README also links its
[Awesome WebMCP List](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/AWESOME_WEBMCP.md).
Use those upstream tools according to their own documentation and licensing.
