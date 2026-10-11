import { reactive } from 'vue';
import { iWatch, iEffect, reg, counts } from '../composables/useEventLog';
import { N, inc } from './helpers';
export const title = 'Performance';
export function build() {
    const state = reg('state', reactive({ a: 0, b: 0, c: 0, d: 0 }));
    iEffect('broadEffect', () => { void JSON.stringify(state); }); // reads every property
    iWatch('targetedWatch', () => state.a); // reads only state.a
    return {
        title: 'Performance',
        explain: "broadEffect reads the whole state through JSON.stringify, so it re-runs on every change. targetedWatch reads only state.a. Compare the run counters to see the unnecessary work.",
        nodes: [N('state.a', 'reactive'), N('state.b', 'reactive'), N('state.c', 'reactive'), N('state.d', 'reactive'),
            N('broadEffect', 'watcher'), N('targetedWatch', 'watcher')],
        actions: ['a', 'b', 'c', 'd'].map(k => ({ label: `${k}++`, run: () => inc('state.' + k, state, k) })),
        inspect: () => ({ 'state.a': state.a, 'state.b': state.b, 'state.c': state.c, 'state.d': state.d, 'broadEffect runs': counts.value.broadEffect ?? 0, 'targetedWatch runs': counts.value.targetedWatch ?? 0 }),
        probes: []
    };
}
