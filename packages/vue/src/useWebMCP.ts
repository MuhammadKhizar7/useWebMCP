import {
  onMounted,
  onUnmounted,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import {
  createToolController,
  defaultEnvironment,
  type ToolController,
} from 'webmcp-tool-core'
import type {
  UseWebMCPConfig,
  UseWebMCPOptions,
  UseWebMCPState,
} from './types.js'

export function useWebMCP<TArgs = unknown, TResult = unknown>(
  options: MaybeRefOrGetter<UseWebMCPOptions<TArgs, TResult>>,
  config: UseWebMCPConfig = {},
): UseWebMCPState {
  const controller: ToolController<TArgs, TResult> = createToolController(
    { ...toValue(options) },
    config.environment ?? defaultEnvironment,
  )
  const supported = shallowRef(controller.snapshot.supported)
  const registered = shallowRef(controller.snapshot.registered)
  const error = shallowRef<Error | null>(controller.snapshot.error)

  const unsubscribe = controller.subscribe((snapshot) => {
    supported.value = snapshot.supported
    registered.value = snapshot.registered
    error.value = snapshot.error
  })

  watch(
    () => toValue(options),
    (nextOptions) => controller.update({ ...nextOptions }),
    { deep: true },
  )

  onMounted(() => controller.start())
  onUnmounted(() => {
    controller.stop()
    unsubscribe()
  })

  return { supported, registered, error }
}
