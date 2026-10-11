# Vue Reactivity Runtime Visualizer

This project is an interactive Vue 3 application that makes Vue's reactivity system visible while it runs. Nine experiments create real `ref`, `reactive`, `computed`, `watch` and `watchEffect` instances, and the app shows what Vue does when their values change: which dependencies are tracked, which effects are triggered, which computed getters execute, and which components re-render. It exists to turn the usual abstract explanations of reactivity into observable behavior, and it is a course deliverable. Every event on screen is produced by Vue's own debug and lifecycle hooks; nothing is mocked or hardcoded.

### Highlights
- Nine experiments covering `ref`, `reactive`, `computed`, `watch`, `watchEffect`, component rendering, destructuring vs `toRef`/`toRefs`, the dependency graph and reactive performance.
- A real runtime event log with eight event types (`STATE_CHANGE`, `TRACK`, `TRIGGER`, `COMPUTED`, `WATCH`, `WATCH_EFFECT`, `RENDER`, `CLEANUP`), type filters, pause/resume, clear and click-to-inspect.
- An SVG dependency graph whose edges are discovered live from `onTrack` / `onRenderTracked`, with animated highlighting of affected paths.
- A component monitor with execution counters and per-row "updated / skipped / idle" status with a reason.
- A state inspector whose values flash when they change.
- Clean experiment lifecycle through a detached `effectScope`; no Pinia or Vuex.

## Installation and Run Commands
Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev
npm run build
npm run preview
```

| Command | Purpose |
|---|---|
| `npm install` | Installs Vue, Vite and the Vue plugin |
| `npm run dev` | Starts the development server (the debug hooks only fire in dev mode) |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Serves the production build locally |

## Keyboard Shortcuts
`1`–`9` switch experiment, `R` reset, `/` focus event search, `P` pause/resume capture, `C` clear log, `Esc` leaves a text field. The sidebar also has an **Auto-run** button that cycles through the experiment's actions.

## Project Structure
```text
index.html                         # app shell
package.json                       # scripts and dependencies
vite.config.js                     # Vite + Vue plugin
src/
├── main.js                        # creates the app, shows runtime errors on screen
├── App.vue                        # layout, experiment loading, global styles
├── types/
│   └── events.js                  # event types, colors (TYPE_COLOR), help texts (TYPE_HELP)
├── composables/
│   ├── useEventLog.js             # event bus, instrumented computed/watch/watchEffect, mut(), reg(), idOf()
│   ├── useDependencyGraph.js      # graph layout and edges from tracked data
│   └── useRenderCounter.js        # RENDER events and render-tracking edges
├── components/
│   ├── ExperimentPanel.vue        # experiment selector, action buttons, live probes
│   ├── StateInspector.vue         # flat live key/value view of reactive state
│   ├── EventLog.vue               # timeline with filters, pause, clear
│   ├── EventDetails.vue           # details of the selected event or node
│   ├── DependencyGraph.vue        # interactive SVG graph
│   ├── ExplanationPanel.vue       # experiment explanation + live result of the last action
│   ├── LearnedPanel.vue           # short "What I learned about Vue reactivity" section
│   ├── ComponentMonitor.vue       # counters, updated/skipped/idle pills, reasons
│   └── RenderProbe.vue            # small component whose renders are counted
└── experiments/
    ├── index.js                   # experiment registry
    ├── helpers.js                 # N (node), inc, flip (logged mutations)
    ├── RefExperiment.js
    ├── ReactiveExperiment.js
    ├── ComputedExperiment.js
    ├── WatchExperiment.js
    ├── WatchEffectExperiment.js
    ├── ComponentRenderExperiment.js
    ├── DestructuringExperiment.js
    ├── DependencyGraphExperiment.js
    └── PerformanceExperiment.js
```
`components/` holds the six display panels plus the render probe, `composables/` holds all instrumentation logic (so components stay presentational), and `experiments/` holds one module per experiment; each exports a `build()` returning `{ title, nodes, actions, inspect, probes }`. `types/` holds the shared event vocabulary.

## State Architecture
The app uses no Pinia or Vuex. Core state lives in `useEventLog.js` as **module-level plain data**: `buf` (event array), `raw` (execution counts), `edgeSet` (set of `"from>to"` edges) and `hot` (map of recently active node ids). It is published to the UI as **`shallowRef` snapshots**: `events`, `counts`, `edgeList`, `hotIds`, `pausedState` and `selected`. `shallowRef` suffices because each snapshot is replaced as a whole, so deep proxying would be wasted work.

**Critical rule:** `log()` only writes to shallowRefs and never reads reactive state. Logging happens inside computed getters, watch callbacks and renders; if `log()` read a reactive value, that effect would subscribe to the log, and writing the log would re-run the effect indefinitely. Keeping plain data internally and publishing snapshots avoids this.

`App.vue` holds `idx`, `runKey` and `current` (a `shallowRef` with the built experiment). `load(i)` calls `scope?.stop()` on the previous scope, then `resetRun()` (clears events, counts, edges, hot ids and selection), then creates a fresh detached `effectScope(true)` and runs `EXPERIMENTS[i].build()` inside it. Stopping the scope disposes every watcher, computed and effect of the old experiment, so no stale reactive work survives a switch or reset. `runKey` is incremented so keyed components re-mount.

## How Runtime Events Are Captured and Displayed
| Source | Event |
|---|---|
| `onTrack` on computed / watch / watchEffect | `TRACK` and `linkEdge(from, to)` |
| `onTrigger` on computed / watch / watchEffect | `TRIGGER`; computeds also log `COMPUTED` "invalidated (marked dirty)" |
| `onRenderTracked` (in `useRenderCounter`) | `TRACK` and an edge to the component |
| `onMounted` / `onUpdated` (in `useRenderCounter`) | `RENDER` |
| `onCleanup` inside `iWatch` / `iEffect` | `CLEANUP` |
| `mut(id, obj, key, val)` | `STATE_CHANGE` with `old → new`, before the mutation is applied |
| Computed getter, watch callback, effect body | `COMPUTED` "executed", `WATCH`, `WATCH_EFFECT` |

`reg(name, obj)` stores refs, reactive objects and computeds in a `WeakMap`, so `idOf(target, key)` can translate a debugger `(target, key)` pair into a node id: the registered name for a ref/computed, `name.key` for a reactive property.

**Event bus.** `log(type, source, msg, payload)` updates counters, marks the source as hot, appends to `buf` (capped at 600) and republishes `events.value`. `raw[source]` increments on `WATCH`, `WATCH_EFFECT`, `RENDER` and on `COMPUTED` with `msg === 'executed'`; counters keep running while capture is paused. Any non-`TRACK` event sets the source in `hot` for 900 ms, which `DependencyGraph.vue` uses to pulse nodes and highlight an edge when both endpoints are hot.

**EventLog.vue** shows the newest events first (120-row cap) with Clear, Pause/Resume, a search box (matches type, source and message) and one filter chip per type. Filter state is a `Set` that is replaced on each toggle so the change is always observed. Clicking a row selects it. **EventDetails.vue** shows the type color badge, source, timestamp, message, `TYPE_HELP` text and JSON payload; for a selected graph node it shows dependencies, dependents and counters derived from `edgeList`.

## Computed Caching
A computed is **lazy**: the getter does not run until `.value` is read. After running, Vue caches the result and records the properties the getter read. When one of them changes, Vue only marks the computed **dirty** (`onTrigger` fires and the log shows "invalidated"); the getter does not run yet. The next read re-runs it (tracking again via `onTrack`) and stores the new value. Reads of a clean computed return the cached value without executing the getter.

Experiment 3's **Read doubleCount ×3** action demonstrates this: it compares `execCount('doubleCount')` before and after each read and logs "served from cache" or "getter executed".

## watch vs watchEffect
| | `watch` | `watchEffect` |
|---|---|---|
| Dependencies | Explicit sources only | Auto-tracked from reads in the last run |
| First run | Lazy (not until a source changes) | Immediately |
| Callback arguments | `(newValue, oldValue, onCleanup)` | `(onCleanup)`, no old value |
| Default flush | `pre` (before component updates) | `pre` |
| Cleanup | `onCleanup` callback | `onCleanup` argument |

The key difference is dependency granularity: `watch` tracks exactly its source list, while `watchEffect` tracks whatever it happens to read, and that set is rebuilt on every run. A change to an unrelated property retriggers neither. Experiment 5 shows the two side by side; experiment 4 shows single-source, multi-source and deep `watch`.

## Destructuring vs toRef / toRefs
| Technique | Result | Reactive? |
|---|---|---|
| `const { name } = user` | Plain copy of the value | No, goes stale |
| `toRef(user, 'name')` | Ref whose `.value` reads/writes `user.name` | Yes |
| `toRefs(user)` | One live ref per property | Yes |

Destructuring a reactive object reads the value once and drops the proxy link, so later changes are never tracked. `toRef` keeps the object and key, so each `.value` access goes through the proxy; `toRefs` does this for every property, which is useful when returning reactive state from a composable. Experiment 7 shows it with three probes: `PlainDestructured` stays stale, `ToRefView` and `ToRefsView` stay live.

## The Nine Experiments
1. **ref()**: tracks a single ref through computed, watcher and component. Source: `count`. Wired: `doubleCount` (computed), `countWatcher` (watch), `Counter` probe. Actions: Increment, Decrement, Reset. Expect `STATE_CHANGE`, `TRIGGER count`, `COMPUTED doubleCount` invalidated then executed, `WATCH countWatcher` and `RENDER Counter` updated; all four nodes pulse.
2. **reactive()**: per-property tracking in a nested object. Sources: `user.name`, `user.age`, `user.address.city`. Wired: `nameLabel`, `cityLabel`, `ageWatcher`, `Profile` probe. Actions: Change name, Change age, Change nested city. Changing name or city updates only its matching computed and Profile; changing age fires only `ageWatcher`, because the labels never read it.
3. **computed() + caching**: lazy, cached computeds. Source: `state { count, firstName, lastName, a, b }`. Wired: `doubleCount`, `fullName`, `total`. Actions: Read doubleCount ×3, count++, Change first name, Change last name, a++, b++. Reads of a clean `doubleCount` log "served from cache"; `count++` invalidates it and one execution follows; `fullName` (first + last name) recalculates only when either name changes.
4. **watch()**: three watcher shapes. Sources: refs `n`, `a`, `b`, nested `obj.deep.x`. Wired: `singleWatcher`, `multiWatcher([a, b])`, `deepWatcher`. Actions: n++, a++, a++ and b++ together, Deep: obj.deep.x++. The combined action fires `multiWatcher` once (batched); the deep watcher fires only because `deep: true` tracks nested properties.
5. **watchEffect() vs watch()**: explicit vs automatic dependencies. Sources: refs `a`, `b`, `c`. Wired: `effectSum` (reads `a + b`), `watchSum` (watch on `[a, b]`). Actions: a++, b++, c++. `effectSum` already ran once at load while `watchSum` did not; a++ and b++ fire both; c++ fires neither.
6. **Component rendering**: components depend on different slices. Source: `state { a, b, c }`. Wired: probes `CompA`, `CompB`, `CompC`. Actions: a++, b++, c++. Only the component reading the changed property re-renders; the monitor shows it as "updated" and the others as "skipped" with reasons like "reads state.b (unchanged)".
7. **Destructuring / toRef / toRefs**: stale vs live values. Source: `user { name, age }`. Wired: probes `PlainDestructured`, `ToRefView`, `ToRefsView`. Actions: Change user.name, Change user.age. `ToRefView` follows the name; `PlainDestructured` never re-renders; `ToRefsView` follows age.
8. **Dependency graph**: live graph from tracked edges. Sources: `state.count`, `state.name`. Wired: `doubleCount`, `greeting`, `countWatcher`, `logEffect`, probes `CounterView`, `Greeter`. Actions: count++, Change name. count++ pulses the count branch and `logEffect`; Change name pulses `greeting`, `Greeter` and `logEffect`. Click a node to inspect it.
9. **Performance**: broad vs targeted reactive work. Source: `state { a, b, c, d }`. Wired: `broadEffect` (reads `JSON.stringify(state)`), `targetedWatch` (reads only `state.a`). Actions: a++, b++, c++, d++. b/c/d changes run only `broadEffect`; a++ runs both, so the counters expose the unnecessary work.

## What I Learned About Vue Reactivity
- Vue 3 reactivity is **proxy-based**: reads and writes go through `get`/`set` traps, which is how dependencies are recorded at all.
- Dependency tracking is **per effect and per run**; the set is rebuilt each time, which the repeated `TRACK` events made visible.
- `onTrack` and `onTrigger` show exactly when a subscription forms and when a change invalidates a dependent.
- Computeds are **lazy and cached with a dirty flag**; "invalidated" and "executed" are separate events.
- `watch` has a fixed source list, while `watchEffect` discovers its sources from its last run.
- **Destructuring a reactive object loses reactivity** because it copies a value out of the proxy; `toRef` and `toRefs` keep a live link to the property.
- A logger inside an effect must never read reactive state, or the effect subscribes to its own log and loops forever, which is why the bus uses plain variables plus `shallowRef` snapshots.
- `effectScope(true)` provides a clean lifecycle boundary, so switching experiments leaves no stale watchers behind.

## Known Limitations and Future Improvements
- The debug hooks exist only in development builds, so the production build shows no events.
- The graph uses a fixed four-column layout and would not scale to large graphs.
- The event log is capped at 600 events and the UI shows the newest 120; nothing persists across reloads.
- A deep watcher on a reactive object reports the same object as old and new value.
- Possible additions: log export, step-through playback, automated tests of the instrumentation.

## License
Course submission — for educational use.
