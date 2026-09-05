interface DiscoverableToolMetadata {
  name: string
  description: string
  inputSchema?: unknown
  annotations?: unknown
}

export interface ToolIdentity {
  name: string
  description: string
  inputSchema: string | undefined
  annotations: string | undefined
}

const unserializableObjects = new WeakMap<object, number>()
let nextUnserializableObjectId = 1

function stringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value)
  } catch {
    if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
      const object = value as object
      let id = unserializableObjects.get(object)
      if (id === undefined) {
        id = nextUnserializableObjectId++
        unserializableObjects.set(object, id)
      }
      return `[unserializable metadata:${id}]`
    }
    return '[unserializable metadata]'
  }
}

export function getToolIdentity(tool: DiscoverableToolMetadata): ToolIdentity {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: stringify(tool.inputSchema),
    annotations: stringify(tool.annotations),
  }
}

export function hasSameToolIdentity(left: ToolIdentity, right: ToolIdentity): boolean {
  return left.name === right.name &&
    left.description === right.description &&
    left.inputSchema === right.inputSchema &&
    left.annotations === right.annotations
}
