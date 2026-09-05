import { defaultEnvironment } from './environment.js'
import { ToolRegistrationError, ToolTimeoutError } from './errors.js'
import { getToolIdentity, hasSameToolIdentity, type ToolIdentity } from './identity.js'
import { errorResult, normalizeError, normalizeResult } from './normalize.js'
import type {
  ModelContextLike,
  WebMCPEnvironment,
  WebMCPTool,
  WebMCPToolOptions,
} from './types.js'

const RETRY_INTERVAL = 100
const DISCOVERY_TIMEOUT = 3000

export type ToolControllerOptions<TArgs = unknown, TResult = unknown> = WebMCPTool<TArgs, TResult> & WebMCPToolOptions & {
  enabled?: boolean
}

export interface ToolControllerSnapshot {
  readonly supported: boolean
  readonly registered: boolean
  readonly error: Error | null
}

export interface ToolController<TArgs = unknown, TResult = unknown> {
  readonly snapshot: ToolControllerSnapshot
  start(): void
  update(options: ToolControllerOptions<TArgs, TResult>): void
  stop(): void
  subscribe(listener: (snapshot: ToolControllerSnapshot) => void): () => void
}

function sameSnapshot(left: ToolControllerSnapshot, right: ToolControllerSnapshot): boolean {
  return left.supported === right.supported &&
    left.registered === right.registered &&
    left.error === right.error
}

export function createToolController<TArgs = unknown, TResult = unknown>(
  initialOptions: ToolControllerOptions<TArgs, TResult>,
  environment: WebMCPEnvironment = defaultEnvironment,
): ToolController<TArgs, TResult> {
  let options = initialOptions
  let identity: ToolIdentity = getToolIdentity(options)
  let snapshot: ToolControllerSnapshot = { supported: false, registered: false, error: null }
  let started = false
  let attempt = 0
  let retryTimer: ReturnType<typeof setInterval> | undefined
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined
  let registrationController: AbortController | undefined
  let registeredContext: ModelContextLike | undefined
  let unsubscribeCapability: (() => void) | undefined
  const listeners = new Set<(snapshot: ToolControllerSnapshot) => void>()

  function notify(next: ToolControllerSnapshot): void {
    if (sameSnapshot(snapshot, next)) return
    snapshot = next
    listeners.forEach((listener) => listener(snapshot))
  }

  function clearDiscoveryTimers(): void {
    if (retryTimer !== undefined) clearInterval(retryTimer)
    if (timeoutTimer !== undefined) clearTimeout(timeoutTimer)
    retryTimer = undefined
    timeoutTimer = undefined
  }

  function unsubscribeCapabilityListener(): void {
    const unsubscribe = unsubscribeCapability
    unsubscribeCapability = undefined
    try {
      unsubscribe?.()
    } catch {
      // Capability cleanup must not change the controller's state.
    }
  }

  function subscribeCapabilityListener(token: number): void {
    try {
      unsubscribeCapability = environment.onCapabilityChange?.(() => discover(token))
    } catch {
      unsubscribeCapability = undefined
    }
  }

  function cleanupRegistration(name = identity.name): void {
    const context = registeredContext
    registeredContext = undefined
    if (registrationController) registrationController.abort()
    registrationController = undefined
    if (context?.unregisterTool) {
      try {
        const result = context.unregisterTool(name)
        if (result && typeof result.then === 'function') void Promise.resolve(result).catch(() => undefined)
      } catch {
        // Cleanup must not change the controller's deterministic state.
      }
    }
  }

  function wrapper(): WebMCPTool<TArgs, unknown> {
    const discoverable: WebMCPTool<TArgs, unknown> = {
      name: options.name,
      description: options.description,
      execute: async (args: TArgs, context) => {
        try {
          const result = await options.execute(args, context)
          const formatted = options.formatOutput
            ? await options.formatOutput(result as TResult, args)
            : result
          return normalizeResult(formatted)
        } catch (value) {
          const error = normalizeError(value)
          try {
            options.onError?.(error)
          } catch {
            // Error reporting must not change the normalized tool result.
          }
          return errorResult(value)
        }
      },
    }
    if (options.inputSchema !== undefined) discoverable.inputSchema = options.inputSchema
    if (options.annotations !== undefined) discoverable.annotations = options.annotations
    return discoverable
  }

  async function register(context: ModelContextLike, token: number): Promise<void> {
    if (!started || token !== attempt || options.enabled === false) return
    let controllerForAttempt: AbortController | undefined
    try {
      controllerForAttempt = environment.createAbortController()
      registrationController = controllerForAttempt
      const registration = { ...(options.registration ?? {}), signal: controllerForAttempt.signal }
      await context.registerTool(wrapper() as WebMCPTool, registration)
      if (!started || token !== attempt || controllerForAttempt.signal.aborted) return
      registeredContext = context
      notify({ supported: true, registered: true, error: null })
    } catch (value) {
      if (!started || token !== attempt || controllerForAttempt?.signal.aborted) return
      registrationController = undefined
      controllerForAttempt?.abort()
      const registrationError = new ToolRegistrationError(options.name, value)
      notify({ supported: true, registered: false, error: registrationError })
    }
  }

  function discover(token: number): boolean {
    if (!started || token !== attempt) return false
    if (registrationController || registeredContext) return true
    const context = environment.getModelContext()
    if (!context) return false
    clearDiscoveryTimers()
    notify({ supported: true, registered: false, error: null })
    void register(context, token)
    return true
  }

  function beginDiscovery(token: number): void {
    if (discover(token)) return
    retryTimer = setInterval(() => { discover(token) }, RETRY_INTERVAL)
    timeoutTimer = setTimeout(() => {
      if (!started || token !== attempt || environment.getModelContext() !== undefined) return
      clearDiscoveryTimers()
      notify({ supported: false, registered: false, error: new ToolTimeoutError(options.name) })
    }, DISCOVERY_TIMEOUT)
  }

  function start(): void {
    if (started) return
    started = true
    attempt += 1
    const token = attempt
    subscribeCapabilityListener(token)
    beginDiscovery(token)
  }

  function update(nextOptions: ToolControllerOptions<TArgs, TResult>): void {
    const wasEnabled = options.enabled !== false
    const nextEnabled = nextOptions.enabled !== false
    const previousIdentity = identity
    const nextIdentity = getToolIdentity(nextOptions)
    const identityChanged = !hasSameToolIdentity(identity, nextIdentity)
    options = nextOptions
    identity = nextIdentity
    if (!started) return
    if (wasEnabled !== nextEnabled) {
      if (nextEnabled) {
        started = false
        start()
      } else {
        attempt += 1
        unsubscribeCapabilityListener()
        clearDiscoveryTimers()
        cleanupRegistration()
        notify({ supported: snapshot.supported, registered: false, error: null })
      }
      return
    }
    if (identityChanged && (snapshot.registered || registrationController !== undefined || snapshot.error !== null)) {
      attempt += 1
      unsubscribeCapabilityListener()
      subscribeCapabilityListener(attempt)
      cleanupRegistration(previousIdentity.name)
      notify({ supported: snapshot.supported, registered: false, error: null })
      const context = environment.getModelContext()
      if (context) void register(context, attempt)
      else beginDiscovery(attempt)
    }
  }

  function stop(): void {
    if (!started) return
    started = false
    attempt += 1
    unsubscribeCapabilityListener()
    clearDiscoveryTimers()
    cleanupRegistration()
    notify({ supported: snapshot.supported, registered: false, error: null })
  }

  return {
    get snapshot() { return snapshot },
    start,
    update,
    stop,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export { DISCOVERY_TIMEOUT, RETRY_INTERVAL }
