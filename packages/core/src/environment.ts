import type { ModelContextLike, WebMCPEnvironment } from './types.js'

export function createBrowserEnvironment(): WebMCPEnvironment {
  return {
    getModelContext(): ModelContextLike | undefined {
      const documentWithModelContext = globalThis.document as
        | (Document & { modelContext?: ModelContextLike })
        | undefined

      return documentWithModelContext?.modelContext
    },
    createAbortController(): AbortController {
      return new AbortController()
    },
  }
}

export const defaultEnvironment = createBrowserEnvironment()
