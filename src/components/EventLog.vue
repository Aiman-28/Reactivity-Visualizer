<script setup>
import { ref, computed } from 'vue'
import { events, pausedState, setPaused, clearLog, selected } from '../composables/useEventLog'
import { EVENT_TYPES, TYPE_COLOR } from '../types/events'

const hidden = ref(new Set())
const query = ref('')
// Newest first; capped at 120 rows so list animations stay smooth.
// A row is shown when its type chip is on AND it matches the search text (type, source or message).
const matches = e => {
  const q = query.value.trim().toLowerCase()
  return !q || `${e.type} ${e.source} ${e.msg}`.toLowerCase().includes(q)
}
const shown = computed(() => events.value.filter(e => !hidden.value.has(e.type) && matches(e)).slice(-120).reverse())
// Replace the Set instead of mutating it, so the change is always seen by computed/template.
const toggle = t => {
  const next = new Set(hidden.value)
  next.has(t) ? next.delete(t) : next.add(t)
  hidden.value = next
}
const time = t => new Date(t).toLocaleTimeString('en-GB') + '.' + String(t % 1000).padStart(3, '0')
</script>

<template>
  <div class="card">
    <h2>Runtime event log <span class="count">{{ events.length }} captured</span></h2>
    <div class="search">
      <input v-model="query" type="search" placeholder="Search events by type, source or message…" aria-label="Search events" />
      <button v-if="query" class="clear" @click="query = ''" aria-label="Clear search">✕</button>
    </div>
    <div class="bar">
      <button @click="clearLog()">🗑 Clear</button>
      <button :class="{ on: pausedState }" @click="setPaused(!pausedState)">{{ pausedState ? '▶ Resume capture' : '⏸ Pause capture' }}</button>
    </div>
    <div class="bar">
      <button v-for="t in EVENT_TYPES" :key="t" class="chip" :class="{ off: hidden.has(t) }" :style="{ '--c': TYPE_COLOR[t] }" @click="toggle(t)">{{ t }}</button>
    </div>
    <TransitionGroup name="log" tag="div" class="rows">
      <div v-for="e in shown" :key="e.id" class="row" :class="{ sel: selected?.kind === 'event' && selected.event.id === e.id }" @click="selected = { kind: 'event', event: e }">
        <span class="dim">{{ time(e.t) }}</span>
        <b :style="{ color: TYPE_COLOR[e.type] }">{{ e.type }}</b>
        <span>{{ e.source }}</span> <span class="dim msg">{{ e.msg }}</span>
      </div>
    </TransitionGroup>
    <div v-if="!shown.length" class="dim empty">{{ events.length ? 'No events match your search or filters.' : 'No events yet. Run an action.' }}</div>
  </div>
</template>

<style scoped>
.count { float: right; text-transform: none; letter-spacing: 0; font-weight: 400; }
.bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.bar button { padding: 1px 9px; font-size: 11px; }
.bar button.on { background: #7a3b12; border-color: #fb923c; }
.chip { border-radius: 999px; background: color-mix(in srgb, var(--c) 18%, transparent); border-color: color-mix(in srgb, var(--c) 55%, transparent); color: var(--c); }
.chip.off { opacity: .35; text-decoration: line-through; }
.rows { height: 300px; overflow: auto; font: 12px/1.7 ui-monospace, monospace; }
.row { display: flex; gap: 8px; padding: 0 6px; border-radius: 4px; cursor: pointer; white-space: nowrap; transition: background .15s; }
.row:hover, .row.sel { background: #223448; }
.msg { overflow: hidden; text-overflow: ellipsis; }
.empty { padding: 20px; text-align: center; }
.log-enter-active { transition: opacity .35s var(--ease), transform .35s var(--ease); animation: flash .9s ease-out; }
.log-enter-from { opacity: 0; transform: translateX(-16px); }
.log-move { transition: transform .3s var(--ease); }
.search { position: relative; margin-bottom: 8px; }
.search input { width: 100%; padding: 5px 30px 5px 10px; font-size: 12.5px; border-radius: 8px; border: 1px solid var(--line); background: #0b1118; color: var(--fg); font: inherit; transition: border-color .2s, box-shadow .2s; }
.search input:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px #60a5fa33; }
.search .clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); padding: 0 8px; background: transparent; border: 0; box-shadow: none; }
.search .clear:hover { transform: translateY(-50%); background: #ffffff14; }
</style>
