<script setup>
import { ref, shallowRef, effectScope, onMounted, onBeforeUnmount } from 'vue'
import { EXPERIMENTS } from './experiments'
import { resetRun, events, pausedState, setPaused, clearLog } from './composables/useEventLog'
import ExperimentPanel from './components/ExperimentPanel.vue'
import StateInspector from './components/StateInspector.vue'
import EventLog from './components/EventLog.vue'
import EventDetails from './components/EventDetails.vue'
import DependencyGraph from './components/DependencyGraph.vue'
import ComponentMonitor from './components/ComponentMonitor.vue'
import ExplanationPanel from './components/ExplanationPanel.vue'
import LearnedPanel from './components/LearnedPanel.vue'

const idx = ref(0)
const runKey = ref(0)
const current = shallowRef()
let scope

/** (Re)build an experiment inside its own effect scope so old watchers are stopped on switch/reset. */
function load(i) {
  idx.value = i
  scope?.stop()
  resetRun()
  scope = effectScope(true)
  current.value = scope.run(EXPERIMENTS[i].build)
  runKey.value++
}
load(0)

// Keyboard shortcuts (ignored while typing in a field).
function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.target.matches?.('input, textarea, select')) { if (e.key === 'Escape') e.target.blur(); return }
  const k = e.key.toLowerCase()
  if (/^[1-9]$/.test(k)) load(+k - 1)
  else if (k === 'r') load(idx.value)
  else if (k === 'p') setPaused(!pausedState.value)
  else if (k === 'c') clearLog()
  else if (k === '/') { e.preventDefault(); document.querySelector('.search input')?.focus() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- Layout: header / [experiments | graph, monitor, state | log, details] / explanation / learned -->
  <div class="app" v-if="current">
    <header>
      <h1><span class="logo">◆</span> Vue Reactivity <b>Runtime Visualizer</b></h1>
      <span class="live"><i /> live instrumentation</span>
      <span class="stats"><span class="stat">{{ events.length }} events</span><span v-if="pausedState" class="stat warn">⏸ paused</span></span>
      <span class="keys dim"><kbd>1-9</kbd>experiment <kbd>R</kbd>reset <kbd>/</kbd>search <kbd>P</kbd>pause <kbd>C</kbd>clear</span>
    </header>

    <aside class="col">
      <ExperimentPanel :list="EXPERIMENTS" :idx="idx" :exp="current" :run-key="runKey" @select="load" @reset="load(idx)" />
    </aside>
    <main class="col">
      <Transition name="swap" mode="out-in"><DependencyGraph :key="runKey" :nodes="current.nodes" /></Transition>
      <Transition name="swap" mode="out-in"><ComponentMonitor :key="runKey" :nodes="current.nodes" /></Transition>
      <Transition name="swap" mode="out-in"><StateInspector :key="runKey" :exp="current" /></Transition>
    </main>
    <section class="col"><EventLog /><EventDetails /></section>

    <Transition name="swap" mode="out-in"><ExplanationPanel :key="runKey" :exp="current" class="wide" /></Transition>
    <LearnedPanel class="wide" />
  </div>
</template>

<style>
:root { color-scheme: dark; --bg: #0b1016; --panel: rgba(22, 31, 41, .88); --line: #263444; --fg: #e2eaf3; --dim: #8a9db1; --ease: cubic-bezier(.22, 1, .36, 1); }
* { box-sizing: border-box; }
body { margin: 0; color: var(--fg); font: 13.5px/1.5 Inter, system-ui, sans-serif; min-height: 100vh;
  background: radial-gradient(1100px 560px at 8% -10%, #1d3b6130, transparent), radial-gradient(900px 500px at 100% 0, #4c1d9530, transparent), var(--bg) fixed; }
.app { display: grid; grid-template-columns: 250px minmax(0, 1fr) minmax(340px, .95fr); gap: 12px; padding: 14px; max-width: 1700px; margin: 0 auto; align-items: start; }
.col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.wide, header { grid-column: 1 / -1; }

header { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 9px 16px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; backdrop-filter: blur(8px); animation: rise .6s var(--ease) both; }
h1 { font-size: 17px; margin: 0; font-weight: 600; letter-spacing: -.01em; }
h1 .logo { color: #60a5fa; display: inline-block; animation: spin 8s linear infinite; }
h1 b { background: linear-gradient(90deg, #60a5fa, #c084fc, #fb923c, #60a5fa); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shift 6s linear infinite; }
.stats { display: inline-flex; gap: 8px; margin-left: auto; }
.stat { padding: 1px 9px; border-radius: 999px; font-size: 11.5px; background: #60a5fa1f; border: 1px solid #60a5fa55; color: #93c5fd; }
.stat.warn { background: #fb923c22; border-color: #fb923c66; color: #fdba74; animation: flash 1s ease-out; }
kbd { font: 10.5px ui-monospace, monospace; padding: 0 5px; border-radius: 5px; background: #ffffff12; border: 1px solid #ffffff22; border-bottom-width: 2px; color: var(--fg); margin: 0 4px 0 8px; }
.live { display: inline-flex; align-items: center; gap: 7px; color: var(--dim); font-size: 12px; }
.live i { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: ping 1.8s infinite; }
.dim { color: var(--dim); font-size: 12px; }

.card { background: var(--panel); backdrop-filter: blur(8px); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px;
  box-shadow: 0 6px 24px #0006; transition: border-color .25s, box-shadow .25s; animation: rise .55s var(--ease) both; }
.card:hover { border-color: #3b536b; box-shadow: 0 10px 32px #0008; }
.card h2 { font-size: 10.5px; letter-spacing: .09em; text-transform: uppercase; color: var(--dim); margin: 0 0 8px; font-weight: 600; }

button { background: #213040; color: var(--fg); border: 1px solid var(--line); border-radius: 7px; padding: 4px 10px; cursor: pointer; font: inherit; font-size: 12.5px;
  transition: background .2s, transform .15s var(--ease), box-shadow .2s, border-color .2s, opacity .2s; }
button:hover { background: #2b4157; transform: translateY(-1px); box-shadow: 0 4px 12px #0005; }
button:active { transform: scale(.96); }
button:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 12px/1.5 ui-monospace, monospace; }
::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-thumb { background: #33465a; border-radius: 8px; }

.swap-enter-active, .swap-leave-active { transition: opacity .2s ease, transform .2s var(--ease); }
.swap-enter-from { opacity: 0; transform: translateY(10px); } .swap-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s var(--ease); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }

@keyframes rise { from { opacity: 0; transform: translateY(14px); } }
@keyframes shift { to { background-position: 200% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ping { 0% { box-shadow: 0 0 0 0 #4ade8099; } 100% { box-shadow: 0 0 0 9px transparent; } }
@keyframes flash { from { background: #60a5fa55; color: #fff; } }
@keyframes pop { from { opacity: 0; transform: scale(.8); } }
@media (max-width: 1100px) { .app { grid-template-columns: 1fr; } .stats { margin-left: 0; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
