<template>
  <div class="keyboard" :style="{ '--key-bg': keyBg, '--key-active': keyActive, '--action-bg': actionBg }">
    <div class="key-row">
      <button class="key digit" @click="emit('digit', '1')">1</button>
      <button class="key digit" @click="emit('digit', '2')">2</button>
      <button class="key digit" @click="emit('digit', '3')">3</button>
    </div>
    <div class="key-row">
      <button class="key digit" @click="emit('digit', '4')">4</button>
      <button class="key digit" @click="emit('digit', '5')">5</button>
      <button class="key digit" @click="emit('digit', '6')">6</button>
    </div>
    <div class="key-row">
      <button class="key digit" @click="emit('digit', '7')">7</button>
      <button class="key digit" @click="emit('digit', '8')">8</button>
      <button class="key digit" @click="emit('digit', '9')">9</button>
    </div>
    <div class="key-row">
      <button class="key action backspace" @click="emit('backspace')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
          <line x1="18" y1="9" x2="14" y2="13"/>
          <line x1="14" y1="9" x2="18" y2="13"/>
        </svg>
      </button>
      <button class="key digit" @click="emit('digit', '0')">0</button>
      <button class="key action submit" @click="emit('submit')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  font-size: clamp(16px, 4vw, 22px);
  font-weight: 500;
  padding: 0;
  height: clamp(44px, 10vw, 58px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.1s, transform 0.1s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.key:active {
  opacity: 0.7;
  transform: scale(0.94);
}

.digit {
  background: var(--key-bg);
  color: white;
}

.action {
  background: var(--action-bg);
}

.action svg {
  width: clamp(18px, 4.5vw, 24px);
  height: clamp(18px, 4.5vw, 24px);
  color: white;
}

.submit {
  background: var(--action-bg);
  opacity: 0.85;
}

.submit:active, .backspace:active {
  opacity: 0.6;
}
</style>
