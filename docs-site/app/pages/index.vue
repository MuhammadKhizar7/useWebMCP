<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'WebMCP Tools for Vue',
  meta: [
    { name: 'description', content: 'Give your Vue app AI-agent friendly tools. A small, framework-neutral core and Vue composable for registering WebMCP tools in browser applications.' },
  ],
})

const codeSnippet = `<span class="text-primary-400">import</span> <span class="text-cyan-400">{ useWebMCP }</span> <span class="text-muted">from</span> <span class="text-amber-400">'vue-webmcp-tool'</span>

<span class="text-primary-400">const</span> <span class="text-cyan-400">{ supported }</span> <span class="text-muted">=</span> <span class="text-emerald-400">useWebMCP</span><span class="text-muted">({</span>
  <span class="text-cyan-400">name</span><span class="text-muted">:</span> <span class="text-amber-400">'add-to-cart'</span><span class="text-muted">,</span>
  <span class="text-cyan-400">description</span><span class="text-muted">:</span> <span class="text-amber-400">'Add an item to the shopping cart'</span><span class="text-muted">,</span>
  <span class="text-cyan-400">inputSchema</span><span class="text-muted">: {</span>
    <span class="text-cyan-400">itemId</span><span class="text-muted">: {</span> <span class="text-cyan-400">type</span><span class="text-muted">:</span> <span class="text-amber-400">'string'</span> <span class="text-muted">},</span>
    <span class="text-cyan-400">quantity</span><span class="text-muted">: {</span> <span class="text-cyan-400">type</span><span class="text-muted">:</span> <span class="text-amber-400">'number'</span><span class="text-muted">,</span> <span class="text-cyan-400">default</span><span class="text-muted">:</span> <span class="text-purple-400">1</span> <span class="text-muted">}</span>
  <span class="text-muted">},</span>
  <span class="text-cyan-400">execute</span><span class="text-muted">:</span> <span class="text-primary-400">async</span> <span class="text-muted">(args) =&gt; {</span>
    <span class="text-primary-400">return</span> <span class="text-muted">{</span> <span class="text-cyan-400">content</span><span class="text-muted">: [{</span> <span class="text-cyan-400">type</span><span class="text-muted">:</span> <span class="text-amber-400">'text'</span><span class="text-muted">,</span> <span class="text-cyan-400">text</span><span class="text-muted">:</span> <span class="text-amber-400">'Added!'</span> <span class="text-muted">}] }</span>
  <span class="text-muted">}</span>
<span class="text-muted">})</span>`

const features = [
  {
    icon: 'i-lucide-zap',
    title: 'Progressive Enhancement',
    description: 'WebMCP is optional. Your app works normally in any browser — tools only activate when the capability is present.',
  },
  {
    icon: 'i-lucide-shield',
    title: 'SSR Safe',
    description: 'Server-side rendering just works. The composable starts in onMounted, never touching browser APIs during SSR.',
  },
  {
    icon: 'i-lucide-refresh-cw',
    title: 'Reactive by Default',
    description: 'Change callbacks or input schemas and the tool updates automatically. Metadata changes trigger re-registration.',
  },
  {
    icon: 'i-lucide-braces',
    title: 'Type Safe',
    description: 'Full TypeScript support with strict schemas. Validate arguments inside your execute callback.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Register a tool',
    description: 'Call useWebMCP with a name, description, input schema, and execute callback.',
    icon: 'i-lucide-code-2',
  },
  {
    step: '02',
    title: 'Agent discovers it',
    description: 'When a WebMCP-capable browser visits your app, AI agents see your tool in the model context.',
    icon: 'i-lucide-scan-search',
  },
  {
    step: '03',
    title: 'Agent executes',
    description: 'The agent calls your tool with validated arguments. You handle the logic and return a result.',
    icon: 'i-lucide-play',
  },
]
</script>

<template>
  <div class="blueprint-grid min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="hero-glow absolute inset-0 pointer-events-none" />
      <UContainer class="relative py-24 lg:py-32">
        <div class="max-w-4xl mx-auto text-center">
          <UBadge color="primary" variant="subtle" class="mb-6">
            <UIcon name="i-lucide-radio" class="size-3 mr-1.5" />
            Browser-Native AI Protocol
          </UBadge>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight mb-6">
            <span class="text-default">WebMCP for</span>
            <br />
            <span class="gradient-text">Vue</span>
          </h1>

          <p class="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10">
            Give your Vue app AI-agent friendly tools.
            A small, framework-neutral core and Vue composable for registering WebMCP tools
            in browser applications.
          </p>

          <div class="flex flex-wrap justify-center gap-4 mb-16">
            <UButton
              to="/getting-started/vue-installation"
              icon="i-lucide-rocket"
              size="lg"
              label="Get Started"
            />
            <UButton
              to="/getting-started/how-webmcp-works"
              color="neutral"
              variant="outline"
              size="lg"
              label="How it Works"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>

          <!-- Code Preview -->
          <div class="max-w-2xl mx-auto">
            <div class="rounded-xl border border-default bg-default overflow-hidden shadow-2xl">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-default bg-elevated/50">
                <div class="flex gap-1.5">
                  <span class="size-3 rounded-full bg-red-500/80" />
                  <span class="size-3 rounded-full bg-yellow-500/80" />
                  <span class="size-3 rounded-full bg-green-500/80" />
                </div>
                <span class="text-xs text-muted font-mono ml-2">useMyTool.vue</span>
              </div>
              <div class="p-4 text-left overflow-x-auto">
                <pre class="font-mono text-sm leading-relaxed" v-html="codeSnippet" /></div>
            </div>
            <p class="text-xs text-muted mt-3 font-mono">
              Register a tool in 20 lines. The browser handles discovery.
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Grid -->
    <section class="py-24 border-t border-default">
      <UContainer>
        <div class="text-center mb-16">
          <UBadge color="primary" variant="subtle" class="mb-4">Core Capabilities</UBadge>
          <h2 class="text-3xl font-mono font-bold mb-4">Built for the protocol</h2>
          <p class="text-muted max-w-xl mx-auto">
            Every design decision serves one goal: make your tools available to AI agents
            without changing how your app works.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card p-6 rounded-xl border border-default bg-elevated/30"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="size-10 flex items-center justify-center rounded-lg bg-primary/10">
                <UIcon :name="feature.icon" class="size-5 text-primary" />
              </div>
              <h3 class="font-mono font-semibold">{{ feature.title }}</h3>
            </div>
            <p class="text-sm text-muted leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- How It Works -->
    <section class="py-24 border-t border-default bg-elevated/20">
      <UContainer>
        <div class="text-center mb-16">
          <UBadge color="primary" variant="subtle" class="mb-4">How It Works</UBadge>
          <h2 class="text-3xl font-mono font-bold mb-4">Three steps to agent-ready</h2>
          <p class="text-muted max-w-xl mx-auto">
            From registration to execution in three clear steps.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            v-for="(item, index) in steps"
            :key="item.step"
            class="relative text-center"
          >
            <!-- Connector line (desktop only) -->
            <div
              v-if="index < steps.length - 1"
              class="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent"
            />

            <div class="size-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <UIcon :name="item.icon" class="size-7 text-primary" />
            </div>
            <div class="font-mono text-xs text-primary mb-2 tracking-widest">STEP {{ item.step }}</div>
            <h3 class="font-mono font-semibold text-lg mb-2">{{ item.title }}</h3>
            <p class="text-sm text-muted leading-relaxed max-w-xs mx-auto">{{ item.description }}</p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Package Showcase -->
    <section class="py-24 border-t border-default">
      <UContainer>
        <div class="text-center mb-16">
          <UBadge color="primary" variant="subtle" class="mb-4">Packages</UBadge>
          <h2 class="text-3xl font-mono font-bold mb-4">Three packages, one system</h2>
          <p class="text-muted max-w-xl mx-auto">
            Pick the layer that matches your needs. The core is framework-neutral.
            The Vue composable adds reactivity. The Nuxt module adds auto-imports.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div class="p-6 rounded-xl border border-default bg-elevated/30 text-center">
            <div class="font-mono text-primary text-sm mb-2">webmcp-tool-core</div>
            <h3 class="font-mono font-semibold text-lg mb-2">Core</h3>
            <p class="text-sm text-muted mb-4">Framework-neutral lifecycle, detection, normalization, and abort cleanup.</p>
            <code class="text-xs text-muted bg-default px-3 py-1.5 rounded-lg border border-default font-mono">
              npm i webmcp-tool-core
            </code>
          </div>

          <div class="p-6 rounded-xl border border-primary/30 bg-primary/5 text-center relative">
            <UBadge color="primary" class="absolute -top-3 left-1/2 -translate-x-1/2">Popular</UBadge>
            <div class="font-mono text-primary text-sm mb-2">vue-webmcp-tool</div>
            <h3 class="font-mono font-semibold text-lg mb-2">Vue 3</h3>
            <p class="text-sm text-muted mb-4">Composable API with reactive options and automatic lifecycle management.</p>
            <code class="text-xs text-muted bg-default px-3 py-1.5 rounded-lg border border-default font-mono">
              npm i vue-webmcp-tool
            </code>
          </div>

          <div class="p-6 rounded-xl border border-default bg-elevated/30 text-center">
            <div class="font-mono text-primary text-sm mb-2">nuxt-webmcp-tool</div>
            <h3 class="font-mono font-semibold text-lg mb-2">Nuxt</h3>
            <p class="text-sm text-muted mb-4">Module with auto-imports. Install the module and useWebMCP is available everywhere.</p>
            <code class="text-xs text-muted bg-default px-3 py-1.5 rounded-lg border border-default font-mono">
              npm i nuxt-webmcp-tool
            </code>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- CTA -->
    <section class="py-24 border-t border-default">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-3xl font-mono font-bold mb-4">Ready to go?</h2>
          <p class="text-muted mb-8">
            Install the package, register your first tool, and see it work in minutes.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <UButton
              to="/getting-started/vue-installation"
              icon="i-lucide-rocket"
              size="lg"
              label="Vue Installation Guide"
            />
            <UButton
              to="/getting-started/nuxt-installation"
              color="neutral"
              variant="outline"
              size="lg"
              icon="i-lucide-layers"
              label="Nuxt Installation Guide"
            />
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
