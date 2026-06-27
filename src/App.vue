<template>
  <div class="app-root">
    <Transition name="screen">
      <RangeMenu
        v-if="screen === 'ranges'"
        ref="rangeMenuRef"
        :p1-color="p1Color"
        :p1-light="p1Light"
        :p2-color="p2Color"
        :p2-light="p2Light"
        @select="selectRange"
      />
      <MainMenu
        v-else-if="screen === 'menu'"
        ref="menuRef"
        :range="selectedRange"
        :operation="selectedOperation"
        @start-versus="startVersus"
        @start-ai="startAi"
        @back="backToRanges"
      />
      <GameScreen
        v-else-if="screen === 'game'"
        :mode="gameMode"
        :ai-level="aiLevel ?? undefined"
        :range="selectedRange"
        :max-number="selectedRange"
        :operation="selectedOperation"
        :p1-color="p1Color"
        :p1-dark="p1Dark"
        :p1-light="p1Light"
        :p2-color="p2Color"
        :p2-dark="p2Dark"
        :p2-light="p2Light"
        @back="goBack"
        @ai-beaten="onAiBeaten"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import RangeMenu from './components/RangeMenu.vue'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'
import { type NumberRange } from './utils/cookies'
import { type OperationType } from './utils/equations'

type Screen = 'ranges' | 'menu' | 'game'
type GameMode = 'versus' | 'ai'

const screen = ref<Screen>('ranges')
const gameMode = ref<GameMode>('versus')
const aiLevel = ref<number | null>(null)
const selectedRange = ref<NumberRange>(10)
const selectedOperation = ref<OperationType>('addsub')
const menuRef = ref<InstanceType<typeof MainMenu> | null>(null)
const rangeMenuRef = ref<InstanceType<typeof RangeMenu> | null>(null)

// Generate colors once on app start
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const h1 = Math.floor(Math.random() * 360)
const h2 = (h1 + 120 + Math.floor(Math.random() * 120)) % 360

const p1Color = hslToHex(h1, 45, 50)
const p1Dark  = hslToHex(h1, 50, 35)
const p1Light = hslToHex(h1, 40, 65)

const p2Color = hslToHex(h2, 45, 50)
const p2Dark  = hslToHex(h2, 50, 35)
const p2Light = hslToHex(h2, 40, 65)

function selectRange(op: OperationType, r: NumberRange) {
  selectedOperation.value = op
  selectedRange.value = r
  screen.value = 'menu'
}

function startVersus() {
  gameMode.value = 'versus'
  aiLevel.value = null
  screen.value = 'game'
}

function startAi(level: number) {
  gameMode.value = 'ai'
  aiLevel.value = level
  screen.value = 'game'
}

async function goBack() {
  screen.value = 'menu'
  await nextTick()
  menuRef.value?.refresh()
}

async function backToRanges() {
  screen.value = 'ranges'
  await nextTick()
  rangeMenuRef.value?.refresh()
}

function onAiBeaten(_level: number) {
  // cookies updated inside GameScreen; menu refresh happens on goBack
}
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-root {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow: hidden;
}

button {
  font-family: inherit;
}

.screen-enter-active,
.screen-leave-active {
  transition: opacity 0.2s ease;
}
.screen-enter-from,
.screen-leave-to {
  opacity: 0;
}
</style>
