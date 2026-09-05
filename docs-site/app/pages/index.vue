<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'WebMCP Tools for Vue and Nuxt',
})
</script>

<template>
  <UPageHero
    headline="WebMCP Tools for Vue and Nuxt"
    title="Give your Vue app useful tools"
    description="A small, framework-neutral core for registering WebMCP tools in Vue and Nuxt applications. Your app keeps working normally when WebMCP is unavailable."
    :links="[
      { label: 'Install for Vue', to: '/getting-started/vue-installation', icon: 'i-lucide-rocket' },
      { label: 'See the coffee shop demo', color: 'neutral', variant: 'subtle', icon: 'i-lucide-coffee', to: '/vue/examples/coffee-shop' },
    ]"
  />

  <UPageSection
    id="features"
    headline="Why WebMCP?"
    title="Start with the job your app already does"
    description="Add a clear, validated tool to an existing flow. WebMCP stays optional, so people can use the app with or without a compatible browser."
    :features="[
      { title: 'Works with Vue and Nuxt', description: 'Use a Vue composable for component-owned tools or the Nuxt module for client-safe application tools.', icon: 'i-lucide-layers' },
      { title: 'Optional by design', description: 'The browser capability is detected at runtime. Your regular UI remains the source of truth.', icon: 'i-lucide-sparkles' },
      { title: 'Validate every request', description: 'Describe inputs for discovery, then validate arguments and authorization inside the callback.', icon: 'i-lucide-shield-check' },
      { title: 'Keep tools in scope', description: 'Tie a tool to a component, route, or whole app so it is available exactly where it makes sense.', icon: 'i-lucide-scan-search' },
      { title: 'Use JavaScript or TypeScript', description: 'The core ships as ESM. Use plain JavaScript with a bundler, or add Vue and Nuxt adapters when needed.', icon: 'i-lucide-code-2' },
      { title: 'Small public surface', description: 'Use the core controller directly or choose the Vue and Nuxt APIs that fit your application.', icon: 'i-lucide-puzzle' },
    ]"
  />

  <UPageSection
    headline="A simple first step"
    title="Install, add one tool, then try the real flow"
    description="Choose the path that matches your app. Each guide starts from a user-facing task instead of an abstract API."
  >
    <div class="grid sm:grid-cols-3 gap-6 mt-8">
      <div class="flex flex-col gap-3 p-6 rounded-xl bg-elevated/50 ring ring-default">
        <div class="flex items-center gap-2 text-primary font-mono text-sm">
          <span class="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
          Choose your path
        </div>
        <NuxtLink class="text-sm text-muted hover:text-primary" to="/getting-started/vue-installation">Vue installation guide →</NuxtLink>
      </div>
      <div class="flex flex-col gap-3 p-6 rounded-xl bg-elevated/50 ring ring-default">
        <div class="flex items-center gap-2 text-primary font-mono text-sm">
          <span class="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
          Build one tool
        </div>
        <NuxtLink class="text-sm text-muted hover:text-primary" to="/getting-started/vue-first-tool">Your first Vue tool →</NuxtLink>
      </div>
      <div class="flex flex-col gap-3 p-6 rounded-xl bg-elevated/50 ring ring-default">
        <div class="flex items-center gap-2 text-primary font-mono text-sm">
          <span class="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
          Explore a real app
        </div>
        <NuxtLink class="text-sm text-muted hover:text-primary" to="/vue/examples/coffee-shop">Coffee shop demo →</NuxtLink>
      </div>
    </div>
  </UPageSection>

  <UPageCTA
    title="Pick the guide that matches your next step"
    description="Learn the Vue path first, then add Nuxt, JavaScript, security, or direct core integration as your project needs it."
    :links="[
      { label: 'Read the docs', to: '/getting-started/vue-installation', icon: 'i-lucide-book-open' },
      { label: 'JavaScript support', color: 'neutral', variant: 'subtle', trailingIcon: 'i-lucide-arrow-right', to: '/javascript' },
    ]"
  />
</template>
