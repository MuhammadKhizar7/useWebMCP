<script setup lang="ts">
const { supported, registered, error } = useWebMCP({
  name: 'test-tool',
  description: 'A test tool for E2E verification.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: () => 'ok',
})
</script>

<template>
  <div>
    <span data-testid="supported">{{ supported }}</span>
    <span data-testid="registered">{{ registered }}</span>
    <span data-testid="error">{{ error }}</span>
  </div>
</template>
