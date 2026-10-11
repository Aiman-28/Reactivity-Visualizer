<script setup>
import { toRef } from 'vue'
import { useDependencyGraph, NODE_COLORS, NODE_W, NODE_H } from '../composables/useDependencyGraph'
import { hotIds, selected, counts } from '../composables/useEventLog'

const props = defineProps({ nodes: Array })
const W = NODE_W, H = NODE_H, COLORS = NODE_COLORS
// Layout and edges come from the composable; edges are discovered live from onTrack / onRenderTracked.
const { pos, height, edges, path } = useDependencyGraph(toRef(props, 'nodes'))
</script>

<template>
  <div class="card">
    <h2>Dependency graph
      <span v-for="(c, t) in COLORS" :key="t" class="legend"><i class="dot" :style="{ background: c }" />{{ t }}</span>
    </h2>
    <svg :viewBox="`0 0 750 ${height}`" width="100%">
      <template v-for="[a, b] in edges" :key="a + '>' + b">
        <path :d="path(a, b)" pathLength="1" fill="none" class="edge" />
        <path v-if="hotIds.has(a) && hotIds.has(b)" :d="path(a, b)" fill="none" class="flow" />
      </template>
      <g v-for="(n, i) in nodes" :key="n.id" :transform="`translate(${pos[n.id].x} ${pos[n.id].y})`" class="node"
        :class="{ pulse: hotIds.has(n.id), sel: selected?.kind === 'node' && selected.id === n.id }" @click="selected = { kind: 'node', id: n.id }">
        <g class="inner" :style="{ animationDelay: i * 45 + 'ms' }">
          <rect :width="W" :height="H" :rx="n.type === 'reactive' ? 18 : n.type === 'watcher' ? 10 : 4" :fill="COLORS[n.type]" fill-opacity=".2" :stroke="COLORS[n.type]" stroke-width="2" />
          <text :x="W / 2" :y="H / 2 + 4" text-anchor="middle">{{ n.label }}</text>
          <g v-if="n.type !== 'reactive' && counts[n.id]" :transform="`translate(${W - 4} 2)`">
            <circle r="9" :fill="COLORS[n.type]" /><text class="cnt" y="3.5" text-anchor="middle">{{ counts[n.id] }}</text>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.legend { margin-left: 12px; text-transform: none; letter-spacing: 0; font-weight: 400; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
.edge { stroke: #4a5d70; stroke-width: 1.6; stroke-dasharray: 1; animation: draw .7s var(--ease) both; transition: stroke .3s; }
.flow { stroke: #facc15; stroke-width: 3; stroke-dasharray: 6 8; stroke-linecap: round; filter: drop-shadow(0 0 4px #facc15); animation: flowdash .5s linear infinite, fadein .2s both; }
.node { cursor: pointer; }
.node .inner { transform-box: fill-box; transform-origin: center; transition: transform .2s var(--ease); animation: nodein .5s var(--ease) backwards; }
.node:hover .inner { transform: scale(1.06); }
.node rect { transition: fill-opacity .3s, stroke-width .2s; }
.node:hover rect { fill-opacity: .4; }
.node text { fill: #e2eaf3; font-size: 12px; pointer-events: none; }
.node text.cnt { fill: #0b1016; font-size: 10px; font-weight: 700; }
.node.sel rect { stroke-width: 3.5; stroke-dasharray: 5 3; animation: marching 1s linear infinite; }
.pulse rect { animation: glow .9s ease-out; }
@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes flowdash { to { stroke-dashoffset: -14; } }
@keyframes fadein { from { opacity: 0; } }
@keyframes nodein { from { opacity: 0; transform: scale(.6); } }
@keyframes marching { to { stroke-dashoffset: -16; } }
@keyframes glow { 0% { filter: drop-shadow(0 0 12px #fff); fill-opacity: .85; } 100% { filter: none; fill-opacity: .2; } }
</style>
