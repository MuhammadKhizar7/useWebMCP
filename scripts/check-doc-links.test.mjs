import { describe, expect, it } from 'vitest'
import { checkDocumentation, requiredExternalCatalogLinks, requiredPages } from './check-doc-links.mjs'

describe('documentation verification fixtures', () => {
  it('requires both example documentation pages in the checker', async () => {
    const result = await checkDocumentation()

    expect(requiredPages).toContain('vue/examples/coffee-shop.md')
    expect(requiredPages).toContain('examples/external/upstream-demos.md')
    expect(requiredExternalCatalogLinks).toContain('/vue/examples/coffee-shop')
    expect(requiredExternalCatalogLinks).toContain('https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/coffee-shop')
    expect(result.requiredPages).toBe(requiredPages.length)
  })
})
