<template>
  <div
    class="player-area"
    :class="{ rotated: rotated, 'flash-correct': flashState === 'correct', 'flash-wrong': flashState === 'wrong' }"
    :style="{ '--player-color': color, '--player-color-dark': colorDark, '--player-color-light': colorLight }"
  >
    <div class="equation-zone">
      <div class="equation">
        <span
          v-for="(part, i) in equationParts"
          :key="i"
          :class="{ 'missing-box': i === missingIndex && inputValue === '', 'missing-filled': i === missingIndex && inputValue !== '', 'op-sym': part === '+' || part === '−' || part === '×' || part === '÷', 'eq-sym': part === '=' }"
        >{{ part }}</span>
      </div>
      <div class="input-display">
        <span v-if="inputValue">{{ inputValue }}</span>
        <span v-else class="placeholder">?</span>
      </div>
    </div>
    <VirtualKeyboard
      :key-bg="colorLight"
      :key-active="colorDark"
      :action-bg="colorDark"
      @digit="onDigit"
      @backspace="onBackspace"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import VirtualKeyboard from './VirtualKeyboard.vue'
import { type Equation, type OperationType, formatEquation, generateEquation } from '../utils/equations'

const props = defineProps<{
  rotated: boolean
  color: string
  colorDark: string
  colorLight: string
  disabled: boolean
  maxNumber: number
  operation: OperationType
}>()

const emit = defineEmits<{
  correct: []
  wrong: []
}>()

const currentEq = ref<Equation>(generateEquation(props.maxNumber, props.operation))
const inputValue = ref('')
const flashState = ref<'none' | 'correct' | 'wrong'>('none')

const equationData = computed(() => formatEquation(currentEq.value, inputValue.value))
const equationParts = computed(() => equationData.value.parts)
const missingIndex = computed(() => equationData.value.missingIndex)

function onDigit(d: string) {
  if (props.disabled) return
  const maxLen = props.maxNumber >= 100 ? 3 : 2
  if (inputValue.value.length >= maxLen) return
  inputValue.value += d
}

function onBackspace() {
  if (props.disabled) return
  inputValue.value = inputValue.value.slice(0, -1)
}

function evaluate() {
  if (inputValue.value === '') return
  const guess = parseInt(inputValue.value, 10)
  if (guess === currentEq.value.answer) {
    triggerFlash('correct')
    emit('correct')
    setTimeout(() => {
      currentEq.value = generateEquation(props.maxNumber, props.operation)
      inputValue.value = ''
    }, 400)
  } else {
    triggerFlash('wrong')
    emit('wrong')
    inputValue.value = ''
  }
}

function onSubmit() {
  if (props.disabled) return
  evaluate()
}

function triggerFlash(type: 'correct' | 'wrong') {
  flashState.value = type
  setTimeout(() => { flashState.value = 'none' }, 500)
}

function getEquation() {
  return currentEq.value
}

// Called by the AI: bypasses the disabled guard intentionally
function submitAnswer(answer: number) {
  inputValue.value = String(answer)
  evaluate()
}

defineExpose({ getEquation, submitAnswer, reset() {
  currentEq.value = generateEquation(props.maxNumber, props.operation)
  inputValue.value = ''
  flashState.value = 'none'
} })
</script>

<style scoped>
.player-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;  /* content always at logical bottom */
  width: 100%;
  flex: 1;                    /* fill the parent slot vertically */
  box-sizing: border-box;
  padding: 8px 8px 10px;
  position: relative;
}

.player-area.rotated {
  /* rotating 180° makes the logical bottom appear at the physical top */
  transform: rotate(180deg);
}

.equation-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  width: 100%;
}

.equation {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(22px, 6vw, 34px);
  font-weight: 600;
  color: rgba(255,255,255,0.95);
  flex-wrap: wrap;
  justify-content: center;
}

.missing-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4em;
  height: 1.2em;
  border: 2.5px solid rgba(255,255,255,0.85);
  border-radius: 6px;
  padding: 0 4px;
  color: transparent;
}

.missing-filled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4em;
  height: 1.2em;
  border: 2.5px solid rgba(255,255,255,0.85);
  border-radius: 6px;
  padding: 0 4px;
  color: rgba(255,255,255,0.95);
}

.op-sym, .eq-sym {
  color: rgba(255,255,255,0.75);
  font-weight: 400;
}

.input-display {
  font-size: clamp(24px, 7vw, 40px);
  font-weight: 700;
  color: white;
  min-height: 1.2em;
  min-width: 2ch;
  text-align: center;
  background: rgba(0,0,0,0.12);
  border-radius: 12px;
  padding: 4px 20px;
}

.placeholder {
  color: rgba(255,255,255,0.45);
}

/* Flash animations */
@keyframes flashCorrect {
  0% { background: rgba(255,255,255,0); }
  30% { background: rgba(255,255,255,0.25); }
  100% { background: rgba(255,255,255,0); }
}

@keyframes flashWrong {
  0% { background: rgba(0,0,0,0); }
  30% { background: rgba(0,0,0,0.2); }
  100% { background: rgba(0,0,0,0); }
}

.flash-correct {
  animation: flashCorrect 0.5s ease-out;
}

.flash-wrong {
  animation: flashWrong 0.5s ease-out;
}
</style>
