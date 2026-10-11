<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import RenderProbe from './RenderProbe.vue'

const props = defineProps({ list: Array, idx: Number, exp: Object, runKey: Number })
defineEmits(['select', 'reset'])

const ran = ref(-1)     // index of the action that was just fired (button flash)
const auto = ref(false) // auto-run cycles through the actions
let timer, step = 0, flashTimer

function fire(i) {
  props.exp.actions[i].run()
  ran.value = i
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (ran.value = -1), 500)
}
function stop() { clearInterval(timer); timer = null; auto.value = false }
function toggleAuto() {
  if (auto.value) return stop()
  auto.value = true
  step = 0
  const tick = () => fire(step++ % props.exp.actions.length)
  tick()
  timer = setInterval(tick, 1400)
}
// Switching or resetting an experiment stops auto-run, because its state is rebuilt.
watch(() => props.runKey, stop)
onBeforeUnmount(() => { stop(); clearTimeout(flashTimer) })
</script>

<template>
  <div class="card">
    <h2>Experiments</h2>
    <nav class="nav">
      <button v-for="(e, i) in list" :key="e.title" class="nav-item" :class="{ on: i === idx }" @click="$emit('select', i)">
        <kbd>{{ i + 1 }}</kbd><span>{{ e.title.replace(/^\d+\.\s*/, '') }}</span>
      </button>
    </nav>

    <h2 class="gap">Run</h2>
    <TransitionGroup name="pop" tag="div" class="actions" appear>
      <button v-for="(a, i) in exp.actions" :key="runKey + a.label" class="act" :class="{ ran: ran === i, wide: a.hint }" :title="a.hint || a.label"
        :style="{ animationDelay: i * 40 + 'ms' }" @click="fire(i)">
        <span class="lbl">{{ a.label }}</span>
        <span v-if="a.hint" class="hint" :class="{ un: a.hint.includes('unrelated') }">{{ a.hint }}</span>
      </button>
    </TransitionGroup>
    <div class="tools">
      <button class="auto" :class="{ on: auto }" @click="toggleAuto">{{ auto ? '■ Stop auto-run' : '▶ Auto-run' }}</button>
      <button class="ghost" @click="$emit('reset')">↺ Reset</button>
    </div>

    <template v-if="exp.probes.length">
      <h2 class="gap">Live components</h2>
      <div :key="runKey"><RenderProbe v-for="p in exp.probes" :key="p.name" :name="p.name" :get="p.get" /></div>
    </template>
  </div>
</template>

<style scoped>
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item { display: flex; align-items: center; gap: 8px; text-align: left; font-size: 12.5px; padding: 4px 8px; background: transparent; border: 1px solid transparent; border-left: 3px solid transparent; border-radius: 7px; box-shadow: none; }
.nav-item kbd { margin: 0; min-width: 18px; text-align: center; opacity: .6; font-size: 10px; transition: opacity .2s, background .2s; }
.nav-item:hover { background: #1c2b3a; transform: translateX(3px); box-shadow: none; }
.nav-item:hover kbd { opacity: 1; }
.nav-item.on { background: linear-gradient(90deg, #1d3a5c, transparent); border-left-color: #60a5fa; color: #fff; }
.nav-item.on kbd { opacity: 1; background: #60a5fa33; border-color: #60a5fa88; }
.gap { margin-top: 12px !important; }

.actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
.act { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 28px; padding: 3px 9px; font-size: 12px; line-height: 1.2;
  background: linear-gradient(135deg, #2563eb, #7c3aed); border-color: transparent; color: #fff; position: relative; overflow: hidden; }
.act.wide { grid-column: 1 / -1; justify-content: space-between; }
.act:hover { filter: brightness(1.15); }
.act.ran::after { content: ''; position: absolute; inset: 0; background: #fff; opacity: 0; animation: tap .5s ease-out; }
.lbl { font-weight: 500; white-space: nowrap; }
.hint { font-size: 10px; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.hint.un { color: #fde68a; opacity: 1; }
.pop-enter-active { animation: pop .35s var(--ease) both; }
@keyframes tap { 0% { opacity: .45; } 100% { opacity: 0; } }

.tools { display: grid; grid-template-columns: 1fr auto; gap: 5px; margin-top: 8px; }
.tools button { font-size: 12px; padding: 4px 9px; }
.auto { background: #1b3350; border-color: #2f5a8a; }
.auto.on { background: #7a2d12; border-color: #fb923c; animation: ping2 1.4s infinite; }
.ghost { background: transparent; }
@keyframes ping2 { 0% { box-shadow: 0 0 0 0 #fb923c66; } 100% { box-shadow: 0 0 0 10px transparent; } }
</style>
