<script setup>
import { computed, ref } from 'vue'
import { selected, edgeList, counts, fmt } from '../composables/useEventLog'
import { TYPE_HELP, TYPE_COLOR } from '../types/events'

const ev = computed(() => (selected.value?.kind === 'event' ? selected.value.event : null))
const nodeId = computed(() => (selected.value?.kind === 'node' ? selected.value.id : null))
const key = computed(() => (ev.value ? 'e' + ev.value.id : nodeId.value ? 'n' + nodeId.value : 'none'))
const deps = computed(() => edgeList.value.filter(e => e.endsWith('>' + nodeId.value)).map(e => e.split('>')[0]))
const dependents = computed(() => edgeList.value.filter(e => e.startsWith(nodeId.value + '>')).map(e => e.split('>')[1]))

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(ev.value, null, 2))
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch { /* clipboard unavailable */ }
}
</script>

<template>
  <div class="card">
    <h2>Event details</h2>
    <Transition name="fade" mode="out-in">
      <div :key="key">
        <template v-if="ev">
          <p><span class="badge" :style="{ '--c': TYPE_COLOR[ev.type] }">{{ ev.type }}</span> from <b>{{ ev.source }}</b></p>
          <p class="dim">{{ new Date(ev.t).toISOString() }}</p>
          <p>{{ ev.msg }}</p>
          <p class="dim">{{ TYPE_HELP[ev.type] }}</p>
          <pre class="payload">{{ fmt(ev.payload) }}</pre>
          <button class="copy" @click="copy">{{ copied ? '✓ Copied' : 'Copy event as JSON' }}</button>
        </template>
        <template v-else-if="nodeId">
          <p><b>{{ nodeId }}</b></p>
          <p>Depends on: <span class="dim">{{ deps.join(', ') || 'nothing tracked' }}</span></p>
          <p>Depended on by: <span class="dim">{{ dependents.join(', ') || 'nothing tracked' }}</span></p>
          <p>Executions / renders: <b>{{ counts[nodeId] ?? 0 }}</b></p>
        </template>
        <p v-else class="dim">Click a log row or a graph node to inspect it.</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
p { margin: 0 0 6px; }
.badge { display: inline-block; padding: 1px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--c); background: color-mix(in srgb, var(--c) 18%, transparent); border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); }
.payload { background: #0b1118; border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; max-height: 140px; overflow: auto; }
.copy { margin-top: 8px; font-size: 12px; padding: 3px 10px; }
</style>
