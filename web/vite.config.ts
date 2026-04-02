import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const learningItemsPath = fileURLToPath(new URL('../app/src/data/learning_items.json', import.meta.url))
const storiesPath = fileURLToPath(new URL('../app/src/data/stories.json', import.meta.url))
const learningItems = readJsonFile(learningItemsPath) as unknown[]
const stories = readJsonFile(storiesPath) as unknown[]
const totalLearningItems = learningItems.length as number

function readJsonFile(path: string) {
  const raw = readFileSync(path, 'utf8')
  const normalized = raw.replace(/^\uFEFF/, '')
  return JSON.parse(normalized)
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __LUVA_LEARNING_ITEMS__: JSON.stringify(learningItems),
    __LUVA_STORIES__: JSON.stringify(stories),
    __LUVA_TOTAL_CARD_COUNT__: JSON.stringify(totalLearningItems),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
