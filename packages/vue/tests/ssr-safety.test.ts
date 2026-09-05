import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { useWebMCP } from '../src/useWebMCP'

describe('Vue SSR safety', () => {
  it('does not access the browser boundary or register during SSR setup', async () => {
    const registrations: unknown[] = []
    const environment = {
      getModelContext: () => {
        throw new Error('browser boundary accessed during SSR')
      },
      createAbortController: () => new AbortController(),
    }
    const app = createSSRApp(defineComponent({
      setup() {
        useWebMCP({ name: 'ssr', description: 'SSR', execute: () => 'ok' }, { environment })
        return () => h('div', registrations.length)
      },
    }))

    await expect(renderToString(app)).resolves.toContain('<div>0</div>')
    expect(registrations).toHaveLength(0)
  })
})
