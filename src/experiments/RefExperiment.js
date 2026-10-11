import { ref } from 'vue';
import { iComputed, iWatch, mut, reg } from '../composables/useEventLog';
import { N, inc } from './helpers';
export const title = 'ref()';
export function build() {
    const count = reg('count', ref(0));
    const double = iComputed('doubleCount', () => count.value * 2);
    iWatch('countWatcher', count);
    return {
        title: 'ref()',
        explain: "count is a single ref. doubleCount (computed), countWatcher (watch) and the Counter component all read it, so one change reaches all three: the computed is marked dirty, the watcher callback is queued and the component re-renders.",
        nodes: [N('count', 'reactive'), N('doubleCount', 'computed'), N('countWatcher', 'watcher'), N('Counter', 'component')],
        actions: [
            { label: 'Increment', run: () => inc('count', count, 'value') },
            { label: 'Decrement', run: () => inc('count', count, 'value', -1) },
            { label: 'Reset', run: () => mut('count', count, 'value', 0) }
        ],
        inspect: () => ({ count: count.value, doubleCount: double.value }),
        probes: [{ name: 'Counter', get: () => `${count.value} → ×2 = ${double.value}` }]
    };
}
