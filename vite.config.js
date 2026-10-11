import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// Dev mode is required: onTrack/onTrigger/onRenderTracked debug hooks only fire in dev builds.
export default defineConfig({ plugins: [vue()] });
