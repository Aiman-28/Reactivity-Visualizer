export const EVENT_TYPES = ['STATE_CHANGE', 'TRACK', 'TRIGGER', 'COMPUTED', 'WATCH', 'WATCH_EFFECT', 'RENDER', 'CLEANUP'];
export const TYPE_COLOR = {
    STATE_CHANGE: '#60a5fa', TRACK: '#94a3b8', TRIGGER: '#facc15', COMPUTED: '#4ade80',
    WATCH: '#fb923c', WATCH_EFFECT: '#f472b6', RENDER: '#c084fc', CLEANUP: '#f87171'
};
export const TYPE_HELP = {
    STATE_CHANGE: 'A mutation performed by an experiment action (old → new). It is the cause of everything after it.',
    TRACK: 'Vue\'s onTrack debug hook: an effect (computed/watch/watchEffect/render) read a reactive property and subscribed to it.',
    TRIGGER: 'Vue\'s onTrigger debug hook: a tracked property changed, so this dependent was marked for re-run.',
    COMPUTED: 'A computed getter executed, or was invalidated (marked dirty). Reads of a clean computed do not execute the getter.',
    WATCH: 'A watch() callback ran. Watchers only depend on their explicit sources; callbacks are batched (flush: pre).',
    WATCH_EFFECT: 'A watchEffect ran. Its dependencies are whatever it read during its last run.',
    RENDER: 'A component mounted or updated (onMounted / onUpdated). It re-renders only if a value read in its template changed.',
    CLEANUP: 'onCleanup fired: before the next run of a watcher/effect, or when its scope was stopped.'
};
