<script setup lang="ts">
defineProps<{ message: string | null }>()
</script>

<template><Transition name="toast"><p v-if="message" class="toast-message" role="status" aria-live="polite">{{ message }}</p></Transition></template>
