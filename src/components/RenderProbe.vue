<script setup>
import { useRenderCounter } from '../composables/useRenderCounter'

// A probe component: its template reads get(), so Vue subscribes it to exactly those reactive values.
const props = defineProps({ name: String, get: Function })
useRenderCounter(props.name)
</script>

<template>
  <div class="probe">
    <b>{{ name }}</b>
    <!-- keyed by value: a change re-creates the span, replaying the flash animation -->
    <span class="val" :key="String(get())">{{ get() }}</span>
  </div>
</template>

<style scoped>
.probe { display: flex; justify-content: space-between; gap: 8px; border: 1px solid #a855f788; border-left: 3px solid #a855f7; border-radius: 8px; padding: 6px 10px; margin-top: 6px; background: #a855f712; animation: pop .4s var(--ease) both; }
.val { border-radius: 4px; padding: 0 4px; animation: flash .8s ease-out; }
</style>
