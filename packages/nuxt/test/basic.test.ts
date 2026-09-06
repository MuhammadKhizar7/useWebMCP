import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('nuxt-webmcp-tool module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the index page with useWebMCP auto-imported', async () => {
    const html = await $fetch('/')
    expect(html).toContain('data-testid="supported"')
    expect(html).toContain('data-testid="registered"')
  })
})
