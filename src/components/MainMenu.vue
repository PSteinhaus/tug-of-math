<template>
  <div class="main-menu">
    <div class="menu-content">
      <h1 class="title">Mathe-Zug</h1>
      <p class="subtitle">Addition &amp; Subtraktion Duel</p>

      <div class="section-label">Zwei Spieler</div>
      <button class="menu-btn versus" @click="emit('startVersus')">
        <span class="btn-icon">⚔</span>
        <span>Duell-Modus</span>
      </button>

      <div class="section-label">Gegen KI</div>
      <div class="ai-list">
        <button
          v-for="level in AI_LEVELS"
          :key="level.id"
          class="menu-btn ai-btn"
          :class="{ locked: level.id > unlockedLevels, beaten: level.id < unlockedLevels }"
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
import { ref, onMounted } from 'vue'
import { AI_LEVELS } from '../utils/ai'
import { getUnlockedAiLevels } from '../utils/cookies'

const emit = defineEmits<{
  startVersus: []
  startAi: [level: number]
}>()

const unlockedLevels = ref(1)

onMounted(() => {
  unlockedLevels.value = getUnlockedAiLevels()
})

function startAi(level: number) {
  if (level > unlockedLevels.value) return
  emit('startAi', level)
}

function difficultyColor(id: number): string {
  const colors = ['#6aaa78', '#c5a34a', '#e08040', '#d05050', '#8040c0']
  return colors[id - 1] ?? '#aaa'
}

function refresh() {
  unlockedLevels.value = getUnlockedAiLevels()
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
}

.menu-content {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.title {
  font-size: clamp(32px, 9vw, 52px);
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
</style>
