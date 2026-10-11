import { reactive } from 'vue';
import { reg } from '../composables/useEventLog';
import { N, inc } from './helpers';
export const title = 'Component rendering';
export function build() {
    const state = reg('state', reactive({ a: 0, b: 0, c: 0 }));
    return {
        title: 'Component rendering',
        explain: "Each component subscribes only to the properties its template reads. Changing state.a re-renders CompA; CompB and CompC are skipped because nothing they read changed.",
        nodes: [N('state.a', 'reactive'), N('state.b', 'reactive'), N('state.c', 'reactive'),
            N('CompA', 'component'), N('CompB', 'component'), N('CompC', 'component')],
        actions: [
            { label: 'a++', run: () => inc('state.a', state, 'a') },
            { label: 'b++', run: () => inc('state.b', state, 'b') },
            { label: 'c++', run: () => inc('state.c', state, 'c') }
        ],
        inspect: () => ({ 'state.a': state.a, 'state.b': state.b, 'state.c': state.c }),
        probes: [{ name: 'CompA', get: () => state.a }, { name: 'CompB', get: () => state.b }, { name: 'CompC', get: () => state.c }]
    };
}
