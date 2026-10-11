import { onMounted, onUpdated, onRenderTracked } from 'vue';
import { log, idOf, linkEdge } from './useEventLog';
/**
 * Tracks renders of the calling component: onMounted/onUpdated emit RENDER events (which the bus
 * counts), and onRenderTracked records which reactive values the render read (graph edges + TRACK).
 */
export function useRenderCounter(name) {
    let renders = 0;
    onRenderTracked(e => {
        const from = idOf(e.target, e.key);
        if (from)
            linkEdge(from, name);
        log('TRACK', name, `render tracked ${from ?? String(e.key)}`, { key: String(e.key) });
    });
    onMounted(() => log('RENDER', name, `mounted (render #${++renders})`));
    onUpdated(() => log('RENDER', name, `updated (render #${++renders})`));
    return { get renders() { return renders; } };
}
