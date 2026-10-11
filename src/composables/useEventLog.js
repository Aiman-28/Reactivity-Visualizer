import { computed, watch, watchEffect, shallowRef, toRaw, isRef } from 'vue';
/*
 * Global event bus + instrumentation. IMPORTANT: log() and friends only WRITE to shallowRefs
 * (never read reactive state), otherwise an effect that logs would subscribe to the log itself
 * and loop forever. Plain module variables hold the real data; the shallowRefs publish snapshots to the UI.
 */
export const events = shallowRef([]);
export const counts = shallowRef({});
export const edgeList = shallowRef([]); // "from>to" dependency edges discovered by onTrack
export const hotIds = shallowRef(new Set()); // nodes that recently did something (graph pulse)
export const pausedState = shallowRef(false);
export const selected = shallowRef(null);
let buf = [];
let raw = {};
let seq = 0;
let isPaused = false;
const edgeSet = new Set();
const hot = new Map();
const names = new WeakMap();
export const fmt = (v) => { try {
    return JSON.stringify(v);
}
catch {
    return String(v);
} };
export function log(type, source, msg, payload = {}) {
    // Execution counters are always kept, even while capture is paused.
    if (type === 'WATCH' || type === 'WATCH_EFFECT' || type === 'RENDER' || (type === 'COMPUTED' && msg === 'executed')) {
        raw = { ...raw, [source]: (raw[source] ?? 0) + 1 };
        counts.value = raw;
    }
    if (type !== 'TRACK') {
        const stamp = ++seq;
        hot.set(source, stamp);
        hotIds.value = new Set(hot.keys());
        setTimeout(() => { if (hot.get(source) === stamp) {
            hot.delete(source);
            hotIds.value = new Set(hot.keys());
        } }, 900);
    }
    if (isPaused)
        return;
    buf = [...buf, { id: ++seq, t: Date.now(), type, source, msg, payload }].slice(-600);
    events.value = buf;
}
/** Register a reactive object/ref/computed under a graph id so tracked deps can be named. */
export function reg(name, obj) { names.set(toRaw(obj), name); return obj; }
/** Map a Vue debugger (target, key) pair to a graph node id such as "user.name" or "count". */
export function idOf(target, key) {
    const n = names.get(target);
    if (typeof key === 'symbol') return null; // iterate/has keys are not graph nodes
    if (!n)
        return null;
    return isRef(target) ? n : `${n}.${String(key)}`;
}
export function linkEdge(from, to) {
    const k = `${from}>${to}`;
    if (!edgeSet.has(k)) {
        edgeSet.add(k);
        edgeList.value = [...edgeSet];
    }
}
export const depsOf = (name) => edgeList.value.filter(e => e.endsWith('>' + name)).map(e => e.split('>')[0]);
export const execCount = (id) => raw[id] ?? 0;
const dbg = (name) => ({
    onTrack: (e) => {
        const from = idOf(e.target, e.key);
        if (from)
            linkEdge(from, name);
        log('TRACK', name, `tracked ${from ?? String(e.key)}`, { key: String(e.key), op: e.type });
    },
    onTrigger: (e) => {
        const from = idOf(e.target, e.key);
        log('TRIGGER', from ?? name, `${from ?? String(e.key)} changed → ${name} eligible to re-run`, { dependent: name, key: String(e.key), op: e.type, oldValue: e.oldValue, newValue: e.newValue });
    }
});
/** Mutate a property and log STATE_CHANGE (old → new) first. */
export function mut(id, obj, key, val) {
    const old = obj[key];
    log('STATE_CHANGE', id, `${fmt(old)} → ${fmt(val)}`, { oldValue: old, newValue: val });
    obj[key] = val;
}
export function iComputed(name, fn) {
    const d = dbg(name);
    const c = computed(() => { log('COMPUTED', name, 'executed'); return fn(); }, {
        onTrack: d.onTrack,
        onTrigger: e => { d.onTrigger(e); log('COMPUTED', name, 'invalidated (marked dirty)', { key: String(e.key) }); }
    });
    return reg(name, c);
}
export function iWatch(name, src, opts = {}) {
    watch(src, (n, o, onCleanup) => {
        log('WATCH', name, `callback executed: ${fmt(o)} → ${fmt(n)}`, { oldValue: o, newValue: n });
        onCleanup(() => log('CLEANUP', name, 'cleanup ran (before next run or on stop)'));
    }, { ...opts, ...dbg(name) });
}
export function iEffect(name, fn) {
    watchEffect(onCleanup => {
        log('WATCH_EFFECT', name, 'effect executed');
        onCleanup(() => log('CLEANUP', name, 'cleanup ran (before next run or on stop)'));
        fn();
    }, dbg(name));
}
export function setPaused(v) { isPaused = v; pausedState.value = v; }
export function clearLog() { buf = []; events.value = []; }
export function resetRun() {
    buf = [];
    raw = {};
    edgeSet.clear();
    hot.clear();
    events.value = [];
    counts.value = {};
    edgeList.value = [];
    hotIds.value = new Set();
    selected.value = null;
}
