import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// Show any runtime error on screen instead of leaving a blank page.
app.config.errorHandler = (err, _instance, info) => {
  console.error(err)
  const box = document.body.appendChild(document.createElement('pre'))
  box.style.cssText = 'position:fixed;inset:auto 0 0 0;max-height:40vh;overflow:auto;margin:0;padding:12px;background:#3b1219;color:#fca5a5;z-index:99;white-space:pre-wrap'
  box.textContent = `Vue error (${info}):\n${err && err.stack ? err.stack : err}`
}
app.mount('#app')
