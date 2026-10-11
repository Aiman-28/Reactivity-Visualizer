import { ref } from 'vue';
import { iWatch, iEffect, reg, depsOf } from '../composables/useEventLog';
import { N, inc } from './helpers';
export const title = 'watchEffect() vs watch()';
export function build() {
    const a = reg('a', ref(1)), b = reg('b', ref(1)), c = reg('c', ref(1));
    iEffect('effectSum', () => { void (a.value + b.value); });
    iWatch('watchSum', [a, b]);
    return {
        title: 'watchEffect() vs watch()',
        explain: "watchEffect runs immediately and auto-tracks whatever it reads (a and b). watch([a, b]) is lazy and uses explicit sources. Changing c triggers neither, because neither reads it.",
        nodes: [N('a', 'reactive'), N('b', 'reactive'), N('c', 'reactive'), N('effectSum', 'watcher'), N('watchSum', 'watcher')],
        actions: [
            { label: 'a++', run: () => inc('a', a, 'value') },
            { label: 'b++', run: () => inc('b', b, 'value') },
            { label: 'c++', hint: 'unrelated', run: () => inc('c', c, 'value') }
        ],
        inspect: () => ({ a: a.value, b: b.value, c: c.value, 'effectSum auto-tracked deps': depsOf('effectSum').join(', '),
            'watchSum explicit sources': 'a, b' }),
        probes: []
    };
}
