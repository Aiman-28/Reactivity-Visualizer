import { reactive, ref } from 'vue';
import { iWatch, reg } from '../composables/useEventLog';
import { N, inc } from './helpers';
export const title = 'watch()';
export function build() {
    const n = reg('n', ref(1)), a = reg('a', ref(1)), b = reg('b', ref(1));
    const obj = reg('obj', reactive({ deep: reg('obj.deep', reactive({ x: 1 })) }));
    iWatch('singleWatcher', n);
    iWatch('multiWatcher', [a, b]);
    iWatch('deepWatcher', obj, { deep: true });
    return {
        title: 'watch()',
        explain: "watch tracks only its explicit sources. multiWatcher batches a and b into one callback; deepWatcher uses deep: true to track every nested property, so its old and new values are the same object.",
        nodes: [N('n', 'reactive'), N('a', 'reactive'), N('b', 'reactive'), N('obj.deep.x', 'reactive'),
            N('singleWatcher', 'watcher'), N('multiWatcher', 'watcher'), N('deepWatcher', 'watcher')],
        actions: [
            { label: 'n++', run: () => inc('n', n, 'value') },
            { label: 'a++', run: () => inc('a', a, 'value') },
            { label: 'a++ and b++', hint: 'one callback', run: () => { inc('a', a, 'value'); inc('b', b, 'value'); } },
            { label: 'Deep: obj.deep.x++', run: () => inc('obj.deep.x', obj.deep, 'x') }
        ],
        inspect: () => ({ n: n.value, a: a.value, b: b.value, 'obj.deep.x': obj.deep.x }),
        probes: []
    };
}
