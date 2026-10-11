import { reactive } from 'vue';
import { iComputed, iWatch, iEffect, reg } from '../composables/useEventLog';
import { N, inc, flip } from './helpers';
export const title = 'Dependency graph';
export function build() {
    const state = reg('state', reactive({ count: 0, name: 'Ali' }));
    const double = iComputed('doubleCount', () => state.count * 2);
    const greeting = iComputed('greeting', () => 'Hello ' + state.name);
    iWatch('countWatcher', () => state.count);
    iEffect('logEffect', () => { void (state.count + state.name); });
    return {
        title: 'Dependency graph',
        explain: "Edges are discovered live from onTrack events, not hard-coded. After each change the affected nodes pulse; click a node to see its dependencies and dependents.",
        nodes: [N('state.count', 'reactive'), N('state.name', 'reactive'), N('doubleCount', 'computed'), N('greeting', 'computed'),
            N('countWatcher', 'watcher'), N('logEffect', 'watcher'), N('CounterView', 'component'), N('Greeter', 'component')],
        actions: [
            { label: 'count++', run: () => inc('state.count', state, 'count') },
            { label: 'Change name', run: () => flip('state.name', state, 'name', 'Ali', 'Sara') }
        ],
        inspect: () => ({ 'state.count': state.count, 'state.name': state.name, doubleCount: double.value, greeting: greeting.value }),
        probes: [{ name: 'CounterView', get: () => double.value }, { name: 'Greeter', get: () => greeting.value }]
    };
}
