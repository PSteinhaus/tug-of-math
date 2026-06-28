<template>
  <div class="main-menu">
    <div class="menu-content">
      <button class="back-link" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Zurück</span>
      </button>

      <h1 class="title">Zahlen bis {{ range }}</h1>
      <p class="subtitle">{{ operationLabel }}</p>

      <div class="section-label">Zwei Spieler</div>
      <button class="menu-btn versus" @click="emit('startVersus')">
        <span class="btn-icon">⚔</span>
        <span>Duell-Modus</span>
      </button>

      <div class="section-label">Gegen KI</div>
      <div
        class="ai-list"
        :class="{ mastered: unlockedLevels > aiLevels.length }"
      >
        <button
          v-for="level in aiLevels"
          :key="level.id"
          class="menu-btn ai-btn"
          :class="{
              locked: level.id > unlockedLevels,
              beaten: level.id < unlockedLevels
          }"
          :style="{ '--glow': difficultyColor(level.id) }"
          :disabled="level.id > unlockedLevels"
          @click="startAi(level.id)"
        >
          <span class="difficulty-dot" :style="{ background: difficultyColor(level.id) }" />
          <span class="ai-name">{{ level.name }}</span>
          <span class="lock-icon" v-if="level.id > unlockedLevels">🔒</span>
          <span class="check-icon" v-else-if="level.id < unlockedLevels">✓</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { generateAiLevels } from '../utils/ai'
import { getUnlockedAiLevels, type NumberRange } from '../utils/cookies'
import type { OperationType } from '../utils/equations'

const props = defineProps<{
  range: NumberRange
  operation: OperationType
}>()

const emit = defineEmits<{
  startVersus: []
  startAi: [level: number]
  back: []
}>()

const unlockedLevels = ref(1)
const aiLevels = generateAiLevels(props.range, props.operation)

onMounted(() => {
  unlockedLevels.value = getUnlockedAiLevels(props.operation, props.range)
})

const operationLabel = computed(() =>
  props.operation === 'addsub' ? 'Addition & Subtraktion Duell' : 'Multiplikation & Division Duell'
)

function startAi(level: number) {
  if (level > unlockedLevels.value) return
  emit('startAi', level)
}

function difficultyColor(id: number): string {
  const colors = ['#6aaa78', '#c5a34a', '#e08040', '#d05050', '#8040c0']
  return colors[id - 1] ?? '#aaa'
}

function refresh() {
  unlockedLevels.value = getUnlockedAiLevels(props.operation, props.range)
}

defineExpose({ refresh })
</script>

<style scoped>
.main-menu {
  position: fixed;
  inset: 0;
  background: #f5f0eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.menu-content {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #888;
  font-size: clamp(13px, 3.5vw, 15px);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  align-self: flex-start;
  transition: color 0.12s;
}
.back-link:active { color: #555; }
.back-link svg { width: 16px; height: 16px; }

.title {
  font-size: clamp(28px, 8vw, 46px);
  font-weight: 800;
  color: #1a1a1a;
  text-align: center;
  margin: 0 0 2px;
  letter-spacing: -1px;
}

.subtitle {
  font-size: clamp(13px, 3.5vw, 16px);
  color: #888;
  text-align: center;
  margin: 0 0 20px;
  font-weight: 400;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #aaa;
  margin-top: 8px;
  padding: 0 4px;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: none;
  border-radius: 14px;
  font-size: clamp(15px, 4vw, 18px);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s, opacity 0.12s;
  text-align: left;
}

.menu-btn:active {
  transform: scale(0.97);
}

.versus {
  background: #1a1a1a;
  color: white;
}

.btn-icon {
  font-size: 20px;
}

.ai-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-btn {
  background: white;
  color: #1a1a1a;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.ai-btn.beaten {
  opacity: 0.65;
}

.ai-btn.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-btn:disabled {
  cursor: not-allowed;
}

.difficulty-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ai-name {
  flex: 1;
}

.lock-icon {
  font-size: 14px;
  opacity: 0.7;
}

.check-icon {
  font-size: 16px;
  color: #5a8f62;
  font-weight: 700;
}

.ai-list.mastered {
  position: relative;
}

/* flowing light travelling over all buttons */
.ai-list.mastered::before {
  content: "";
  position: absolute;
  inset: -25px;
  pointer-events: none;

  background:
    linear-gradient(
      120deg,
      transparent 0%,
      rgba(255,255,255,.15) 20%,
      rgba(255,255,255,.89) 35%,
      rgba(255,255,255,.15) 50%,
      transparent 70%
    );

  background-size: 250% 100%;
  animation: sweep 17s linear infinite;
  filter: blur(12px);
}

.ai-list.mastered .ai-btn {
  position: relative;
  overflow: hidden;
  isolation: isolate;

  opacity: 1 !important;

  animation:
      glowPulse 12s ease-in-out infinite;
}

/* colored glow */
.ai-list.mastered .ai-btn::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;

  background: var(--glow);
  opacity: .28;

  filter: blur(16px);
  z-index: -2;

  animation:
      aura 12s ease-in-out infinite;
}

/* subtle color drifting inside the card */
.ai-list.mastered .ai-btn::after {
    content: "";
    position: absolute;

    /* Much larger than the button */
    width: 220%;
    height: 220%;
    left: -60%;
    top: -60%;

    pointer-events: none;
    border-radius: 50%;

    background:
        radial-gradient(
            circle at 72% 35%,
            color-mix(in srgb, white 65%, var(--glow)) 0%,
            color-mix(in srgb, white 10%, var(--glow)) 12%,
            color-mix(in srgb, transparent 70%, var(--glow)) 28%,
            transparent 60%
        );

    opacity: .97;
    mix-blend-mode: screen;
    filter: blur(10px);

    transform-origin: center;
    animation: orbitGlow 12s linear infinite;
}

/* stagger every difficulty */
.ai-list.mastered .ai-btn:nth-child(1) {
    animation-delay: 0s;
}
.ai-list.mastered .ai-btn:nth-child(2) {
    animation-delay: .3s;
}
.ai-list.mastered .ai-btn:nth-child(3) {
    animation-delay: .6s;
}
.ai-list.mastered .ai-btn:nth-child(4) {
    animation-delay: .9s;
}
.ai-list.mastered .ai-btn:nth-child(5) {
    animation-delay: 1.2s;
}

@keyframes glowPulse {

    0%,100%{
        transform:translateY(0);
        box-shadow:
            0 2px 5px rgba(0,0,0,.08),
            0 0 8px color-mix(in srgb, var(--glow) 30%, transparent),
            0 0 20px color-mix(in srgb, var(--glow) 45%, transparent);
    }

    50%{
        transform:translateY(-1px);
        box-shadow:
            0 4px 10px rgba(0,0,0,.12),
            0 0 14px color-mix(in srgb, var(--glow) 50%, transparent),
            0 0 36px color-mix(in srgb, var(--glow) 80%, transparent);
    }
}

@keyframes aura {

    0%,100%{
        transform:scale(.97);
        opacity:.18;
    }

    50%{
        transform:scale(1.05);
        opacity:.42;
    }
}

@keyframes orbitGlow {

    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }

    
  }
@keyframes sweep {

    from{
        background-position:-250% 0;
    }

    to{
        background-position:250% 0;
    }
}

.ai-list.mastered::after{
    content:"";
    position:absolute;
    inset:-30px;
    z-index:-1;
    pointer-events:none;

    background:
        linear-gradient(
            90deg,
            #6aaa78,
            #c5a34a,
            #e08040,
            #d05050,
            #8040c0,
            #6aaa78
        );

    background-size:400% 150%;
    filter:blur(40px);
    opacity:.35;

    animation:
        rainbowFlow 32s linear infinite;
}

@keyframes rainbowFlow{
    from{ background-position:0% 50%; }
    to{ background-position:400% 50%; }
}

</style>
