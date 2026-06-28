<template>
  <div class="game-screen">
    <div class="balance-bg" :style="bgStyle" />

    <div class="player-slot top">
      <div class="player-wrapper">
        <PlayerArea
          ref="p2Area"
          :rotated="true"
          :color="props.p2Color"
          :color-dark="props.p2Dark"
          :color-light="props.p2Light"
          :disabled="!!winner || props.mode === 'ai'"
          :max-number="props.maxNumber"
          :operation="props.operation"
          :player="'2'"
          @correct="onP2Correct"
          @wrong="onP2Wrong"
        />
      </div>
    </div>

    <div class="divider-line" />

    <div class="player-slot bottom">
      <div class="player-wrapper">
        <PlayerArea
          ref="p1Area"
          :rotated="false"
          :color="props.p1Color"
          :color-dark="props.p1Dark"
          :color-light="props.p1Light"
          :disabled="!!winner"
          :max-number="props.maxNumber"
          :operation="props.operation"
          :player="'1'"
          @correct="onP1Correct"
          @wrong="onP1Wrong"
        />
      </div>
    </div>

    <button class="back-btn" @click="confirmVisible = true" title="Beenden">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <Transition name="fade">
      <div v-if="confirmVisible" class="modal-overlay" @click.self="confirmVisible = false">
        <div class="modal-card">
          <div class="modal-title">Spiel beenden?</div>
          <div class="modal-sub">Dein aktueller Fortschritt geht verloren.</div>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="confirmVisible = false">Weiterspielen</button>
            <button class="modal-btn quit" @click="emit('back')">Beenden</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="winner" class="winner-overlay" @click="winnerClickable && emit('back')">
        <div class="winner-card">
          <div class="winner-label">{{ winnerName }}</div>
          <div class="winner-sub">gewinnt!</div>
          <div class="winner-hint">Tippe zum Fortfahren</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PlayerArea from './PlayerArea.vue'
import { aiLevel, getAiDelay, getAiAnswer } from '../utils/ai'
import { unlockNextAiLevel, type NumberRange } from '../utils/cookies'
import type { OperationType } from '../utils/equations'
import { playWin } from "../utils/sound"

const SHIFT_CORRECT = 12
const SHIFT_WRONG   = 6

const props = defineProps<{
  mode: 'versus' | 'ai'
  aiLevel?: number
  range: NumberRange
  maxNumber: number
  operation: OperationType
  p1Color: string
  p1Dark: string
  p1Light: string
  p2Color: string
  p2Dark: string
  p2Light: string
}>()

const emit = defineEmits<{
  back: []
  aiBeaten: [level: number]
}>()

const player1Name = 'Spieler 1'
const player2Name = computed(() => {
  if (props.mode === 'ai' && props.aiLevel) {
    return aiLevel(props.aiLevel, props.range, props.operation)?.name ?? 'KI'
  }
  return 'Spieler 2'
})

const balance = ref(50)
const animatedBalance = ref(50)
const winner = ref<null | 'p1' | 'p2'>(null)
const confirmVisible = ref(false)
const winnerClickable = ref(false)

const winnerName = computed(() => winner.value === 'p1' ? player1Name : player2Name.value)

const p1Area = ref<InstanceType<typeof PlayerArea> | null>(null)
const p2Area = ref<InstanceType<typeof PlayerArea> | null>(null)

const bgStyle = computed(() => {
  const split = (100 - animatedBalance.value).toFixed(3)
  return {
    background: `linear-gradient(to bottom, ${props.p2Color} ${split}%, ${props.p1Color} ${split}%)`
  }
})

// Animation
let animFrame: number | null = null
let animStart: number | null = null
let animFrom = 50
let animTo   = 50
const ANIM_DURATION = 3000

function easeOutElastic(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function animateBalance(target: number) {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  animFrom = animatedBalance.value
  animTo   = Math.max(0, Math.min(100, target))
  animStart = null
  function step(ts: number) {
    if (animStart === null) animStart = ts
    const t = Math.min((ts - animStart) / ANIM_DURATION, 1)
    animatedBalance.value = animFrom + (animTo - animFrom) * easeOutElastic(t)
    if (t < 1) {
      animFrame = requestAnimationFrame(step)
    } else {
      animatedBalance.value = animTo
      animFrame = null
    }
  }
  animFrame = requestAnimationFrame(step)
}

function shiftBalance(delta: number) {
  if (winner.value) return
  const next = Math.max(0, Math.min(100, balance.value + delta))
  balance.value = next
  animateBalance(next)
  if (balance.value >= 100) {
    playWin()
    setWinner('p1')
    clearAiTimer()
    if (props.mode === 'ai' && props.aiLevel) {
      unlockNextAiLevel(props.operation, props.range, props.aiLevel)
      emit('aiBeaten', props.aiLevel)
    }
  } else if (balance.value <= 0) {
    if (props.mode === "versus") { playWin() }
    setWinner('p2')
    clearAiTimer()
  }
}

function setWinner(player: null | 'p1' | 'p2') {
  winner.value = player
  // build in a little delay so that the modal doesn't get removed by accident
  winnerClickable.value = false

  setTimeout(() => {
    winnerClickable.value = true
  }, 100)
}

function onP1Correct() { shiftBalance(+SHIFT_CORRECT) }
function onP1Wrong()   { shiftBalance(-SHIFT_WRONG) }
function onP2Correct() { shiftBalance(-SHIFT_CORRECT) }
function onP2Wrong()   { shiftBalance(+SHIFT_WRONG) }

// AI
let aiTimer: ReturnType<typeof setTimeout> | null = null

function clearAiTimer() {
  if (aiTimer !== null) { clearTimeout(aiTimer); aiTimer = null }
}

function scheduleAiMove() {
  if (!props.aiLevel || props.mode !== 'ai' || winner.value) return
  const level = aiLevel(props.aiLevel, props.range, props.operation)
  if (!level) return
  aiTimer = setTimeout(() => {
    if (winner.value || !p2Area.value) return
    const eq = p2Area.value.getEquation()
    p2Area.value.submitAnswer(getAiAnswer(eq.answer, level.accuracy, props.maxNumber))
    if (!winner.value) scheduleAiMove()
  }, getAiDelay(level))
}

onMounted(() => {
  if (props.mode === 'ai') scheduleAiMove()
})

onUnmounted(() => {
  clearAiTimer()
  if (animFrame !== null) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
.game-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.balance-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.player-slot {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: stretch;
  flex-direction: row;
}

.player-wrapper {
  height: 100%;
  width: min(100%, 700px);
  aspect-ratio: 1 / 1;
  max-width: 100%;
  display: flex;
}

.player-wrapper > * {
  flex: 1;
}

.divider-line {
  position: relative;
  z-index: 2;
  height: 3px;
  background: rgba(0, 0, 0, 0.28);
  flex-shrink: 0;
}

.back-btn {
  position: absolute;
  z-index: 5;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 48px;
  border: none;
  border-radius: 10px 0 0 10px;
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  backdrop-filter: blur(4px);
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:active { background: rgba(0, 0, 0, 0.50); }
.back-btn svg { width: 18px; height: 18px; }

.modal-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.52);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: white;
  border-radius: 18px;
  padding: 28px 28px 22px;
  width: min(320px, 85vw);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
}
.modal-title {
  font-size: clamp(18px, 5vw, 22px);
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.modal-sub {
  font-size: clamp(13px, 3.5vw, 15px);
  color: #888;
  margin-bottom: 22px;
}
.modal-actions { display: flex; gap: 10px; }
.modal-btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 10px;
  font-size: clamp(14px, 4vw, 16px);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.12s;
}
.modal-btn:active { opacity: 0.75; }
.cancel { background: #f0eeec; color: #333; }
.quit   { background: #1a1a1a; color: white; }

.winner-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  cursor: pointer;
}
.winner-card {
  background: white;
  border-radius: 20px;
  padding: 32px 48px;
  text-align: center;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
}
.winner-label {
  font-size: clamp(22px, 6vw, 36px);
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}
.winner-sub {
  font-size: clamp(18px, 5vw, 28px);
  color: #555;
  font-weight: 500;
}
.winner-hint {
  margin-top: 16px;
  font-size: clamp(13px, 3.5vw, 16px);
  color: #aaa;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
