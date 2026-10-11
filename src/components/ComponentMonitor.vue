<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { counts, events, edgeList } from '../composables/useEventLog'
import { NODE_COLORS } from '../composables/useDependencyGraph'

const props = defineProps({ nodes: Array })
const rows = computed(() => props.nodes.filter(n => n.type !== 'reactive'))
const unit = { computed: 'getter runs', watcher: 'callback runs', component: 'renders' }

const recent = ref(new Set())   // ids whose counter incremented in the last 1.2 s
const lastRun = ref({})         // id -> timestamp of its latest counter increment
const settled = ref(true)       // true once 400 ms have passed since the latest STATE_CHANGE
const timers = {}
let settleTimer

// Timestamp of the most recent STATE_CHANGE event, and the sources changed in that same batch.
const lastChange = computed(() => {
  const list = events.value
  for (let i = list.length - 1; i >= 0; i--) if (list[i].type === 'STATE_CHANGE') return list[i].t
  return 0
})
const changedSources = computed(() => new Set(events.value.filter(e => e.type === 'STATE_CHANGE' && e.t >= lastChange.value - 20).map(e => e.source)))

// A counter increment means the node really ran (computed getter / watcher callback / component render).
watch(counts, (now, before) => {
  for (const n of rows.value) {
    if ((now[n.id] ?? 0) <= (before?.[n.id] ?? 0)) continue
    lastRun.value = { ...lastRun.value, [n.id]: Date.now() }
    recent.value = new Set(recent.value).add(n.id)
    clearTimeout(timers[n.id])
    timers[n.id] = setTimeout(() => { const s = new Set(recent.value); s.delete(n.id); recent.value = s }, 1200)
  }
})
watch(lastChange, () => {
  settled.value = false
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => (settled.value = true), 400)
})
onBeforeUnmount(() => { clearTimeout(settleTimer); Object.values(timers).forEach(clearTimeout) })

const updatedSince = id => lastChange.value > 0 && (lastRun.value[id] ?? 0) >= lastChange.value
const anyUpdated = computed(() => rows.value.some(r => updatedSince(r.id)))
// Skipped = the action finished, others re-ran, but this node did not.
const skipped = n => settled.value && anyUpdated.value && !updatedSince(n.id)
const depsOf = id => edgeList.value.filter(e => e.endsWith('>' + id)).map(e => e.split('>')[0]).filter(d => props.nodes.some(x => x.id === d))
const reason = n => {
  const deps = depsOf(n.id)
  if (!deps.length) return 'no tracked dependencies yet'
  if (!lastChange.value) return 'reads ' + deps.join(', ')
  const changed = d => changedSources.value.has(d) || updatedSince(d)
  return 'reads ' + deps.map(d => `${d} (${changed(d) ? 'changed' : 'unchanged'})`).join(', ')
}
</script>

<template>
  <div class="card">
    <h2>Component monitor and execution counters</h2>
    <div v-for="n in rows" :key="n.id" class="item">
      <div class="mrow">
        <span class="name"><i :style="{ background: NODE_COLORS[n.type] }" />{{ n.label }}</span>
        <div class="track"><div class="fill" :style="{ width: Math.min(100, (counts[n.id] ?? 0) * 10) + '%', background: NODE_COLORS[n.type] }" /></div>
        <span class="num"><b :key="counts[n.id] ?? 0">{{ counts[n.id] ?? 0 }}</b> <span class="dim">{{ unit[n.type] ?? 'runs' }}</span></span>
      </div>
      <div class="sub">
        <Transition name="fade" mode="out-in">
          <span v-if="recent.has(n.id)" key="u" class="pill upd">● updated</span>
          <span v-else-if="skipped(n)" key="s" class="pill skip">○ skipped</span>
          <span v-else key="i" class="pill idle">idle</span>
        </Transition>
        <span class="dim">{{ reason(n) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item { padding: 4px 0; border-bottom: 1px solid #ffffff0d; } .item:last-child { border-bottom: 0; }
.mrow { display: grid; grid-template-columns: 150px 1fr 130px; align-items: center; gap: 12px; }
.name { display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name i { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.track { height: 6px; background: #ffffff10; border-radius: 6px; overflow: hidden; }
.fill { height: 100%; border-radius: 6px; transition: width .5s var(--ease); }
.num b { display: inline-block; min-width: 1.5em; text-align: right; animation: bump .45s var(--ease); }
.sub { display: flex; align-items: flex-start; gap: 8px; margin-top: 3px; min-height: 22px; }
.pill { display: inline-block; flex: none; white-space: nowrap; line-height: 20px; padding: 0 9px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px solid transparent; }
.upd { color: #4ade80; background: #4ade8020; border-color: #4ade8066; animation: flash .9s ease-out; }
.skip { color: #94a3b8; background: #94a3b81c; border-color: #94a3b855; }
.idle { color: #64748b; border-color: #33465a; }
@keyframes bump { 40% { transform: scale(1.5); color: #facc15; } }
.sub .dim { min-width: 0; line-height: 20px; }
</style>
