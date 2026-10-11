<template>
  <section class="card">
    <h2>What I learned about Vue reactivity</h2>
    <div class="grid">
      <div class="item"><b>Per property, per run</b><p>Each effect records the exact properties it reads, so unrelated changes never reach it.</p></div>
      <div class="item"><b>Computeds are lazy</b><p>A change only marks them dirty; the getter runs on the next read, and clean reads come from cache.</p></div>
      <div class="item"><b>watch vs watchEffect</b><p>watch has explicit sources and old/new values; watchEffect auto-tracks what it read last time.</p></div>
      <div class="item"><b>Destructuring loses reactivity</b><p>It copies a value out of the proxy; toRef and toRefs keep a live link to the property.</p></div>
      <div class="item"><b>A logger must not read state</b><p>Otherwise the effect subscribes to its own log and loops, so the bus uses plain data plus shallowRef snapshots.</p></div>
    </div>
  </section>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
.item { padding: 8px 12px; border-radius: 9px; background: #ffffff08; border: 1px solid #ffffff10; border-left: 3px solid #60a5fa; transition: transform .2s var(--ease), background .2s; }
.item:hover { transform: translateY(-2px); background: #ffffff0d; }
.item b { font-size: 12.5px; }
.item p { margin: 3px 0 0; font-size: 12px; color: var(--dim); line-height: 1.45; }
</style>
