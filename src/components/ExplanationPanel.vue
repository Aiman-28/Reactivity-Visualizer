<script setup>
import { computed } from 'vue'
import { events } from '../composables/useEventLog'

const props = defineProps({ exp: Object })
const unit = { computed: 'getter', watcher: 'callback', component: 'render' }
const targets = computed(() => props.exp.nodes.filter(n => n.type !== 'reactive'))

// Derived from the real event log: what changed in the latest action, and which nodes actually ran afterwards.
const result = computed(() => {
  const list = events.value
  let last = -1
  for (let i = list.length - 1; i >= 0; i--) if (list[i].type === 'STATE_CHANGE') { last = i; break }
  if (last < 0) return null
  const t0 = list[last].t
  let start = last
  while (start > 0 && list[start - 1].type === 'STATE_CHANGE' && list[start - 1].t >= t0 - 20) start--
  const batch = list.slice(start)
  const changed = [...new Set(batch.filter(e => e.type === 'STATE_CHANGE').map(e => e.source))]
  const ranIds = new Set(batch.filter(e => ['WATCH', 'WATCH_EFFECT', 'RENDER'].includes(e.type) || (e.type === 'COMPUTED' && e.msg === 'executed')).map(e => e.source))
  return {
    changed,
    ran: targets.value.filter(n => ranIds.has(n.id)),
    idle: targets.value.filter(n => !ranIds.has(n.id))
  }
})
</script>

<template>
  <div class="card">
    <h2>Explanation</h2>
    <div class="split">
    <p class="text">{{ exp.explain }}</p>
    <div class="result">
      <h3>Result of the last action</h3>
      <template v-if="result">
        <p><b>Changed:</b> <span v-for="c in result.changed" :key="c" class="tag chg">{{ c }}</span></p>
        <p><b>Ran:</b>
          <span v-for="n in result.ran" :key="n.id" class="tag run">{{ n.label }} <i>{{ unit[n.type] }}</i></span>
          <span v-if="!result.ran.length" class="dim">nothing yet (watchers and renders run a moment later)</span>
        </p>
        <p><b>Did not run:</b>
          <span v-for="n in result.idle" :key="n.id" class="tag off">{{ n.label }}</span>
          <span v-if="!result.idle.length" class="dim">none</span>
        </p>
      </template>
      <p v-else class="dim">Run an action to see what changed and which nodes ran.</p>
    </div>
    </div>
  </div>
</template>

<style scoped>
.split { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; align-items: start; }
.text { margin: 0; line-height: 1.6; font-size: 13.5px; }
@media (max-width: 900px) { .split { grid-template-columns: 1fr; } }
h3 { font-size: 12px; margin: 0 0 8px; color: var(--dim); font-weight: 600; }
.result { border-left: 1px solid #ffffff14; padding-left: 20px; }
@media (max-width: 900px) { .result { border-left: 0; padding-left: 0; } }
.result p { margin: 0 0 8px; }
.tag { display: inline-block; margin: 2px 4px 2px 0; padding: 0 9px; border-radius: 999px; font-size: 12px; white-space: nowrap; animation: pop .35s var(--ease) both; }
.tag i { font-style: normal; opacity: .7; }
.chg { background: #60a5fa22; color: #93c5fd; border: 1px solid #60a5fa66; }
.run { background: #4ade8022; color: #86efac; border: 1px solid #4ade8066; }
.off { background: #94a3b81a; color: #94a3b8; border: 1px solid #94a3b855; }
</style>
