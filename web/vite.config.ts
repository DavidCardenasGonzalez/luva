import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const learningItemsPath = fileURLToPath(new URL('../app/src/data/learning_items.json', import.meta.url))
const totalLearningItems = JSON.parse(readFileSync(learningItemsPath, 'utf8')).length as number

// https://vite.dev/config/
export default defineConfig({
  define: {
    __LUVA_TOTAL_CARD_COUNT__: JSON.stringify(totalLearningItems),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
