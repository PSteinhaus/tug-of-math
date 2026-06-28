<template>
  <div
    class="keyboard"
    :style="{
      '--key-bg': keyBg,
      '--key-active': keyActive,
      '--action-bg': actionBg,
    }"
  >
    <div
      class="key-row"
      v-for="row in digitRows"
      :key="row.join('')"
    >
      <button
        v-for="digit in row"
        :key="digit"
        class="key digit"
        :class="{ pressed: pressed.has(digit) }"
        @pointerdown.prevent="press($event, digit)"
        @pointerup="release($event)"
        @pointercancel="release($event)"
        @pointerleave="release($event)"
      >
        {{ digit }}
      </button>
    </div>

    <div class="key-row">
      <button
        class="key action backspace"
        :class="{ pressed: pressed.has('backspace') }"
        @pointerdown.prevent="press($event, 'backspace')"
        @pointerup="release($event)"
        @pointercancel="release($event)"
        @pointerleave="release($event)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
          <line x1="18" y1="9" x2="14" y2="13"/>
          <line x1="14" y1="9" x2="18" y2="13"/>
        </svg>
      </button>

      <button
        class="key digit"
        :class="{ pressed: pressed.has('0') }"
        @pointerdown.prevent="press($event, '0')"
        @pointerup="release($event)"
        @pointercancel="release($event)"
        @pointerleave="release($event)"
      >
        0
      </button>

      <button
        class="key action submit"
        :class="{ pressed: pressed.has('submit') }"
        @pointerdown.prevent="press($event, 'submit')"
        @pointerup="release($event)"
        @pointercancel="release($event)"
        @pointerleave="release($event)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

defineProps<{
  keyBg: string
  keyActive: string
  actionBg: string
}>()

const emit = defineEmits<{
  digit: [value: string]
  backspace: []
  submit: []
}>()

const digitRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
]

const pressed = ref(new Set<string>())

/**
 * Maps pointerId -> key.
 * Allows multiple simultaneous touches without interfering.
 */
const activePointers = new Map<number, string>()

function press(e: PointerEvent, key: string) {
  activePointers.set(e.pointerId, key)
  pressed.value.add(key)

  switch (key) {
    case "submit":
      emit("submit")
      break

    case "backspace":
      emit("backspace")
      break

    default:
      emit("digit", key)
      break
  }

  ;(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId)
}

function release(e: PointerEvent) {
  const key = activePointers.get(e.pointerId)
  if (!key) return

  pressed.value.delete(key)
  activePointers.delete(e.pointerId)

  ;(e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId)
}
</script>

<style scoped>
.keyboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  width: 100%;
  box-sizing: border-box;
}

.key-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.key {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: clamp(14px, 5vh, 22px);
  font-weight: 500;
  padding: 0;
  height: clamp(32px, 7vh, 58px);

  display: flex;
  align-items: center;
  justify-content: center;

  transition:
    transform 0.08s ease,
    opacity 0.08s ease,
    background-color 0.08s ease;

  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;

  touch-action: none;
}

.key.pressed {
  transform: scale(0.94);
  opacity: 0.75;
}

.digit {
  background: var(--key-bg);
  color: white;
}

.digit.pressed {
  background: var(--key-active);
}

.action {
  background: var(--action-bg);
  color: white;
}

.action svg {
  width: clamp(18px, 4.5vh, 24px);
  height: clamp(18px, 4.5vh, 24px);
}

.action.pressed {
  opacity: 0.65;
}
</style>