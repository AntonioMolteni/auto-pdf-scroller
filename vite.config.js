import { defineConfig } from 'vite'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  build: {
    outDir: 'dist-web',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-v${packageJson.version}-[hash].js`,
        chunkFileNames: `assets/[name]-v${packageJson.version}-[hash].js`,
        assetFileNames: `assets/[name]-v${packageJson.version}-[hash].[ext]`
      }
    }
  }
})
