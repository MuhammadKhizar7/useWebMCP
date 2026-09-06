import assert from 'node:assert/strict'

const core = await import('webmcp-tool-core')
const vue = await import('vue-webmcp-tool')

assert.equal(typeof core.createToolController, 'function')
assert.equal(typeof vue.useWebMCP, 'function')

console.log('Entrypoint smoke checks passed: core and Vue')
