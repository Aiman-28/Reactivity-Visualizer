import { title as t0, build as b0 } from './RefExperiment.js'
import { title as t1, build as b1 } from './ReactiveExperiment.js'
import { title as t2, build as b2 } from './ComputedExperiment.js'
import { title as t3, build as b3 } from './WatchExperiment.js'
import { title as t4, build as b4 } from './WatchEffectExperiment.js'
import { title as t5, build as b5 } from './ComponentRenderExperiment.js'
import { title as t6, build as b6 } from './DestructuringExperiment.js'
import { title as t7, build as b7 } from './DependencyGraphExperiment.js'
import { title as t8, build as b8 } from './PerformanceExperiment.js'

/** Registry consumed by App.vue: selector title + builder (creates fresh state and instrumentation). */
export const EXPERIMENTS = [
  { title: `1. ${t0}`, build: b0 },
  { title: `2. ${t1}`, build: b1 },
  { title: `3. ${t2}`, build: b2 },
  { title: `4. ${t3}`, build: b3 },
  { title: `5. ${t4}`, build: b4 },
  { title: `6. ${t5}`, build: b5 },
  { title: `7. ${t6}`, build: b6 },
  { title: `8. ${t7}`, build: b7 },
  { title: `9. ${t8}`, build: b8 }
]
