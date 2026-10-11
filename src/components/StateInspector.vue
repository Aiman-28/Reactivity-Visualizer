<script setup>
import { fmt } from '../composables/useEventLog'
defineProps({ exp: Object })
</script>

<template>
  <div class="card">
    <h2>Reactive state inspector</h2>
    <table>
      <!-- inspect() runs inside this render, so values are live; a changed value re-keys its <pre> and flashes -->
      <tr v-for="(v, k) in exp.inspect()" :key="k"><td class="dim">{{ k }}</td><td><pre class="val" :key="fmt(v)">{{ fmt(v) }}</pre></td></tr>
    </table>
  </div>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; }
td { padding: 4px 8px 4px 0; vertical-align: top; border-bottom: 1px solid #ffffff0d; }
tr:last-child td { border-bottom: 0; }
.val { display: inline-block; border-radius: 4px; padding: 0 4px; animation: flash .8s ease-out; }
</style>
