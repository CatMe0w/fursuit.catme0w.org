/** @type {import('vite').UserConfig} */

import { resolve } from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        browse: resolve(__dirname, 'browse.html'),
        download: resolve(__dirname, 'download.html'),
      },
    },
  },
})
