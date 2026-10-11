# Explanations

## Part A — Explanation of Each Experiment

## Experiment 1 — ref()
**Sources and wiring.** The experiment creates a single source, `count = ref(0)`. Three things depend on it: the computed `doubleCount`, the watcher `countWatcher`, and the `Counter` probe component, whose template reads both `count` and `doubleCount`.

**What to click and see.** Press **Increment**. The log shows `STATE_CHANGE count 0 → 1`, then `TRIGGER count` lines (one per dependent that has an `onTrigger` hook), `COMPUTED doubleCount invalidated`, and later `COMPUTED doubleCount executed`, `WATCH countWatcher callback executed: 0 → 1` and `RENDER Counter updated`. **Decrement** follows the same chain; **Reset** sets the value to 0 through the same logged mutation.

**Why.** Writing `count.value` runs the ref's setter, which triggers its subscribers synchronously. The computed is only marked dirty at that moment; its getter runs on the next read (by the render or the inspector). The watcher callback and the render are queued by the scheduler (flush `pre` for the watcher), so they appear after the synchronous events. Components have no `onTrigger` hook in this project, so their reaction is visible as `RENDER`, not as a `TRIGGER` line.

## Experiment 2 — reactive()
**Sources and wiring.** `user` is a reactive object with `name`, `age` and a nested `address.city`. `nameLabel` reads `user.name`, `cityLabel` reads `user.address.city`, `ageWatcher` watches `user.age`, and the `Profile` probe renders both labels.

**What to click and see.** **Change name** invalidates only `nameLabel` and re-renders `Profile`. **Change nested city** invalidates only `cityLabel`, showing that tracking reaches nested objects, since the nested object is its own reactive target. **Change age** fires only `ageWatcher`; neither computed is invalidated and `Profile` does not render.

**Why.** The proxy records a dependency for each `(object, property)` pair read during an effect's run. `nameLabel` never read `age`, so it has no subscription to it. This is deep-dive **§7B (unrelated state)**.

## Experiment 3 — computed() + caching
**Sources and wiring.** `state` holds `count`, `firstName`, `lastName`, `a` and `b`. `doubleCount` reads `count`, `fullName` reads `firstName` and `lastName` and joins them, `total` reads `a` and `b`. There are no probes; the State Inspector reads all three computeds.

**What to click and see.** Press **Read doubleCount ×3** (deep-dive **§7A**). Each read logs either "served from cache, getter NOT executed" or "getter executed (value was dirty)". After **count++**, the log shows `invalidated` once and then exactly one `executed`, however often the value is read. **Change first name** and **Change last name** touch only `fullName`; `doubleCount` and `total` log nothing. **a++** and **b++** affect only `total`.

**Why.** A computed caches its value and is flagged dirty when a tracked dependency changes. The getter runs lazily on the next read, and the verdict is computed by comparing `execCount('doubleCount')` before and after the read. Because the inspector re-renders on changes, a dirty computed is recalculated on its next render read, not on the write.

## Experiment 4 — watch()
**Sources and wiring.** Refs `n`, `a`, `b` and a nested reactive object `obj` (`obj.deep.x`). `singleWatcher` watches `n`, `multiWatcher` watches `[a, b]`, and `deepWatcher` watches `obj` with `{ deep: true }`.

**What to click and see.** **n++** fires only `singleWatcher`, logging old → new. **a++** fires `multiWatcher`. **a++ and b++** fires `multiWatcher` once, not twice. **Deep: obj.deep.x++** fires `deepWatcher`.

**Why.** A watch has a fixed source list, so unrelated sources never trigger it. Watcher jobs are queued with flush `pre` and de-duplicated, which is why two changes in one tick give one callback. `deep: true` traverses the object and tracks every nested property; because the source is the same reactive object, old and new values are identical, so both print the current value. Each `WATCH` line is timestamped after the `STATE_CHANGE`, showing the callback runs after the mutation, not inside it.

## Experiment 5 — watchEffect() vs watch()
**Sources and wiring.** Refs `a`, `b`, `c`. `effectSum` is a `watchEffect` that reads `a + b`; `watchSum` is a `watch([a, b])`. The inspector shows the effect's auto-tracked dependencies, built from recorded `onTrack` edges.

**What to click and see.** Right after the experiment loads, the log already contains `WATCH_EFFECT effectSum executed` while `watchSum` has not run. **a++** and **b++** run both. **c++** runs neither.

**Why.** `watchEffect` runs immediately and tracks whatever it reads (here `a` and `b`); `watch` is lazy and tracks only its declared sources. Since `c` is neither read by the effect nor listed as a source, no subscription exists. This is deep-dive **§7D**.

## Experiment 6 — Component rendering
**Sources and wiring.** `state` has `a`, `b`, `c`. Probes `CompA`, `CompB`, `CompC` each read one property in their template.

**What to click and see.** **a++** logs `RENDER CompA updated`; `CompB` and `CompC` log nothing. In the Component Monitor, `CompA` shows an "updated" pill, the others show "skipped" about 400 ms later, with reasons such as `reads state.b (unchanged)`.

**Why.** During each render Vue records which reactive properties the template read (visible through `onRenderTracked` as `TRACK` events). A component is scheduled again only if one of those properties changes.

## Experiment 7 — Destructuring / toRef / toRefs
**Sources and wiring.** `user = reactive({ name, age })`. The experiment runs `const { name } = user`, `const nameRef = toRef(user, 'name')` and `const refs = toRefs(user)`. Probes: `PlainDestructured` (reads the plain `name`), `ToRefView` (reads `nameRef.value`), `ToRefsView` (reads `refs.age.value`).

**What to click and see.** **Change user.name**: `ToRefView` updates and the inspector shows the live value, while `PlainDestructured` stays "Ali" and never re-renders. **Change user.age**: `ToRefsView` updates. This is deep-dive **§7C**.

**Why.** Destructuring copies a string out of the proxy, so no later read passes through a trap and nothing is tracked. `toRef` and `toRefs` keep the object and key and read through the proxy on every `.value` access.

## Experiment 8 — Dependency graph
**Sources and wiring.** `state` has `count` and `name`. `doubleCount` reads `count`, `greeting` reads `name`, `countWatcher` watches `state.count`, `logEffect` reads both, and probes `CounterView` and `Greeter` read `doubleCount` and `greeting`.

**What to click and see.** **count++** pulses `state.count`, `doubleCount`, `countWatcher`, `logEffect` and `CounterView` and highlights the edges between them. **Change name** pulses `state.name`, `greeting`, `Greeter` and `logEffect`. Click any node to see its dependencies, dependents and counters in Event Details.

**Why.** Edges are not hardcoded: each `TRACK` event calls `linkEdge`, and the graph draws only edges whose endpoints are nodes of the current experiment. A pulse lasts 900 ms because each non-`TRACK` event marks its source as hot.

## Experiment 9 — Performance
**Sources and wiring.** `state` has `a`, `b`, `c`, `d`. `broadEffect` runs `JSON.stringify(state)`, which reads every property; `targetedWatch` watches only `state.a`.

**What to click and see.** **b++**, **c++** and **d++** increase only the `broadEffect` counter. **a++** increases both counters. The inspector shows "broadEffect runs" and "targetedWatch runs".

**Why.** An effect subscribes to everything it reads, so the broad read makes it re-run on any change, while the targeted watcher re-runs only when its single source changes. The fix is to read only what is needed or to use `watch` with a specific source.

## Part B — What I Learned About Vue Reactivity
Before this project I thought of Vue reactivity as "Vue notices when data changes". Building the visualizer showed me how specific the mechanism is. Vue wraps objects in proxies and, while an effect runs, records a dependency between each property read and that effect. Because this happens per effect and per run, `state.name` and `state.count` are completely independent, and a computed that only read `count` never wakes up when `name` changes. Experiments 2 and 3 made that visible instead of theoretical.

The `onTrack` and `onTrigger` hooks were the most useful discovery. I could watch an effect re-subscribe on every run, and in the performance experiment I saw `JSON.stringify(state)` subscribe to every property. Computeds surprised me too. I expected the getter to run on every read, but it runs only when the value is dirty. Marking it dirty and running it again are separate events, and the "Read doubleCount ×3" action proves it by logging one execution and two cached reads.

I understood `watch` and `watchEffect` through their dependency granularity. `watch` has an explicit, fixed source list and hands me old and new values. `watchEffect` runs immediately and tracks whatever it read last time. In experiment 5 the effect had already run when the page loaded, and the watcher had not. Both are batched, which is why two changes in one tick give one callback.

Destructuring was another clear lesson. `const { name } = user` looks harmless, but it copies a string, so no read goes through the proxy and nothing is tracked. `toRef` and `toRefs` keep the object and key, so each `.value` access is tracked again. Seeing the destructured probe never re-render while its neighbors update made the rule hard to forget.

The hardest lesson was about the tool itself. My first design logged events into a reactive array, but the logging happens inside computed getters, watch callbacks and renders. An effect that reads its own log subscribes to it, and every write re-triggers the effect, which loops forever. The fix is the plain-then-publish pattern: `log()` updates module-level plain data (`buf`, `raw`, `edgeSet`, `hot`) and only writes `shallowRef` snapshots, never reading reactive state.

Finally, `effectScope(true)` gave me a clean lifecycle boundary. Each experiment is built inside a detached scope, and `scope.stop()` disposes its watchers, computeds and effects. Before I used it, old experiments kept logging after I switched; after it, `resetRun()` plus a fresh scope gave every experiment a clean start. Overall, the project taught me to think of reactivity as a set of small subscriptions that I can inspect, not as magic.

## Part C — How to Demonstrate Each Assignment Requirement
Section numbers follow the numbering used in the assignment brief provided with this project.

| Requirement | How to demonstrate | Where to look |
|---|---|---|
| §2 Technology requirements | Open the project files: Vue 3, `<script setup>`, Vite, JavaScript, SFCs, no Pinia/Vuex | `package.json`, `src/**/*.vue`, `vite.config.js` |
| §3 Application layout (6 areas) | Load the app and point out the six panels | Experiments panel (left), State Inspector, Dependency Graph, Component Monitor (center), Event Log, Event Details (right) |
| §4.1 ref() | Experiment 1: click Increment, Decrement, Reset | Event Log chain; graph pulse; Counter probe |
| §4.2 reactive() | Experiment 2: Change nested city, then Change age | Event Log; State Inspector flat rows; Component Monitor |
| §4.3 computed() | Experiment 3: Read doubleCount ×3, count++, Change first name / last name | Event Log `COMPUTED` lines; execution counters |
| §4.4 watch() | Experiment 4: n++, a++, a++ and b++ together, Deep: obj.deep.x++ | `WATCH` lines with old → new and timestamps |
| §4.5 watchEffect() | Experiment 5: a++, c++ | `WATCH_EFFECT` lines; "effectSum auto-tracked deps" row |
| §4.6 Component rendering | Experiment 6: a++, b++, c++ | `RENDER` lines; probe cards; updated/skipped pills with reasons |
| §4.7 Destructuring / toRef / toRefs | Experiment 7: Change user.name, Change user.age | Probes `PlainDestructured`, `ToRefView`, `ToRefsView`; State Inspector |
| §4.8 Dependency graph | Experiment 8: count++, Change name, then click a node | Dependency Graph; Event Details for the node |
| §4.9 Performance | Experiment 9: b++ versus a++ | "broadEffect runs" vs "targetedWatch runs" rows and Component Monitor counters |
| §5 Runtime event log | Run any action; use the search box, Clear, Pause capture, filter chips, click a row. Events come from Vue hooks, not hardcoded text | Event Log toolbar; Event Details; `useEventLog.js` |
| §6 Dependency graph | Edges appear after the first run (from `TRACK`); affected paths highlight; nodes are colored by type; click a node | Dependency Graph; Event Details |
| §7A Computed caching | Experiment 3: Read doubleCount ×3 before and after count++ | Event Log "served from cache" vs "getter executed" |
| §7B Unrelated state | Experiment 3: Change first name (unrelated); Experiment 2: Change age | `doubleCount` / label counters do not increase |
| §7C Destructuring | Experiment 7: Change user.name | Stale `destructured name` vs live `toRef nameRef.value` in State Inspector and probes |
| §7D watch vs watchEffect | Experiment 5: inspect the log at load, then a++ and c++ | `effectSum` vs `watchSum` lines and counters |
| §8 Required UI features | Use the experiment selector, Run buttons, Reset experiment, Clear, Pause/Resume and filters | Experiments panel; Event Log toolbar; Component Monitor counters |
| §9 Deliverables | Review the repository contents | Source under `src/`, `README.md`, `EXPLANATIONS.md` |
| §10 README requirements | Check the README sections: install, structure, state architecture, event capture, caching, watch vs watchEffect, destructuring, experiments, lessons | `README.md` |
