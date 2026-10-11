import { computed } from 'vue';
import { edgeList } from './useEventLog';
export const NODE_COLORS = { reactive: '#3b82f6', computed: '#22c55e', watcher: '#f97316', component: '#a855f7' };
export const NODE_W = 150, NODE_H = 36;
const GAP = 52, COL_X = 185;
/** Builds layout (column per node type) and edges (from live onTrack data) for the current experiment's nodes. */
export function useDependencyGraph(nodes) {
    const cols = Object.keys(NODE_COLORS);
    const pos = computed(() => {
        const m = {};
        cols.forEach((c, ci) => nodes.value.filter(n => n.type === c).forEach((n, i) => (m[n.id] = { x: 10 + ci * COL_X, y: 24 + i * GAP })));
        return m;
    });
    const height = computed(() => Math.max(...cols.map(c => nodes.value.filter(n => n.type === c).length)) * GAP + 30);
    const edges = computed(() => edgeList.value.map(e => e.split('>')).filter(([a, b]) => pos.value[a] && pos.value[b]));
    const path = (a, b) => {
        const p = pos.value[a], q = pos.value[b];
        return `M${p.x + NODE_W} ${p.y + NODE_H / 2} C${p.x + NODE_W + 40} ${p.y + NODE_H / 2}, ${q.x - 40} ${q.y + NODE_H / 2}, ${q.x} ${q.y + NODE_H / 2}`;
    };
    return { pos, height, edges, path };
}
