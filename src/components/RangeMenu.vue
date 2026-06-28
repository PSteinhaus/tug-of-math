<template>
    <div
        class="range-menu"
        :style="{
            '--p1-color': props.p1Color,
            '--p1-light': props.p1Light,
            '--p2-color': props.p2Color,
            '--p2-light': props.p2Light,
        }"
    >
      <div class="light-layer">
        <div
          v-for="light in lights"
          :key="light.id"
          class="ambient-light"
          :class="light.team"
          :style="light.style"
        ></div>
      </div>
      <div class="menu-content">
        <h1 class="title">Tauziehen</h1>
        <p class="subtitle">Wähle deinen Zahlenraum</p>
  
        <div class="grid">
          <div class="col-header"></div>
          <div class="col-header">+ &amp; −</div>
          <div class="col-header">× &amp; ÷</div>
  
          <template v-for="r in RANGES" :key="r.value">
            <div class="range-label">
              <span class="range-icon">{{ r.icon }}</span>
              <span class="range-name">{{ r.label }}</span>
            </div>
  
            <button
              class="cell"
              :class="{ locked: !r.addsubUnlocked, active: operation === 'addsub' && selectedRange === r.value }"
              :disabled="!r.addsubUnlocked"
              @click="select('addsub', r.value)"
            >
              <span class="lock-icon" v-if="!r.addsubUnlocked">🔒</span>
              <span v-else class="check-icon" v-show="operation === 'addsub' && selectedRange === r.value">✓</span>
            </button>
  
            <button
              class="cell"
              :class="{ locked: !r.muldivUnlocked, active: operation === 'muldiv' && selectedRange === r.value }"
              :disabled="!r.muldivUnlocked"
              @click="select('muldiv', r.value)"
            >
              <span class="lock-icon" v-if="!r.muldivUnlocked">🔒</span>
              <span v-else class="check-icon" v-show="operation === 'muldiv' && selectedRange === r.value">✓</span>
            </button>
          </template>
        </div>
  
        <button
          class="start-btn"
          :disabled="!canStart"
          @click="confirm"
        >Spielen</button>
  
        <p class="hint" v-if="hintVisible">
          Schalte den „Meister" im vorherigen Zahlenraum frei, um diesen Bereich zu öffnen.
        </p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { isRangeUnlocked, type NumberRange } from '../utils/cookies'
  import type { OperationType } from '../utils/equations'
  
  const props = defineProps<{
    p1Color: string
    p1Light: string
    p2Color: string
    p2Light: string
  }>()

  const emit = defineEmits<{
    select: [operation: OperationType, range: NumberRange]
  }>()
  
  const unlocked = ref({
    addsub: { 10: true, 20: false, 100: false },
    muldiv: { 10: false, 20: true, 100: false },
  })
  
  const operation = ref<OperationType>('addsub')
  const selectedRange = ref<NumberRange | null>(null)

  const lights = ref(createLights())

    function createLights() {

        const result = []
        const light_count = 14

        for (let i = 0; i < light_count; i++) {

            const bottom = i < light_count / 2

            result.push({
                id: i,
                team: bottom ? "p1" : "p2",

                x: -30 + Math.random() * 160,
                y: bottom
                    ? 85 + Math.random() * 40
                    : 10 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.02,

                style: {
                    "--x": "",
                    "--y": "",
                    "--size": `${8 + Math.random() * 80}px`,
                    "--duration": `${12 + Math.random() * 10}s`,
                    "--delay": `${-Math.random() * 20}s`,
                    "--drift-x": `${-40 + Math.random() * 80}px`,
                    "--drift-y": `${-20 + Math.random() * 40}px`,
                }
            })

            for (const light of result) {
                light.style["--x"] = `${light.x}%`
                light.style["--y"] = `${light.y}%`
            }

        }

        return result

    }

  let animationId = 0
  
  onMounted(() => {
    animateLights()

    unlocked.value = {
      addsub: {
        10:  isRangeUnlocked('addsub', 10),
        20:  isRangeUnlocked('addsub', 20),
        100: isRangeUnlocked('addsub', 100),
      },
      muldiv: {
        10:  isRangeUnlocked('muldiv', 10),
        20:  isRangeUnlocked('muldiv', 20),
        100: isRangeUnlocked('muldiv', 100),
      },
    }
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationId)
  })
  
  const RANGES = computed(() => [
    {
      value: 10  as NumberRange, label: 'Zahlen bis 10',  icon: '①',
      addsubUnlocked: unlocked.value.addsub[10],
      muldivUnlocked: unlocked.value.muldiv[10],
    },
    {
      value: 20  as NumberRange, label: 'Zahlen bis 20',  icon: '②',
      addsubUnlocked: unlocked.value.addsub[20],
      muldivUnlocked: unlocked.value.muldiv[20],
    },
    {
      value: 100 as NumberRange, label: 'Zahlen bis 100', icon: '③',
      addsubUnlocked: unlocked.value.addsub[100],
      muldivUnlocked: unlocked.value.muldiv[100],
    },
  ])
  
  const hintVisible = ref(false)
  
  const canStart = computed(() => selectedRange.value !== null)

function animateLights() {
  for (const light of lights.value) {

    // --- add tiny random “force” (keeps motion alive)
    if (Math.random() < 0.01) {
        light.vx += (Math.random() - 0.5) * 0.02
        light.vy += (Math.random() - 0.5) * 0.02
    }

    // --- damping (prevents explosion / keeps smooth drift)
    light.vx *= 0.995
    light.vy *= 0.995

    // --- integrate velocity
    light.x += light.vx
    light.y += light.vy

    const minY = -30
    const maxY = 125
    const minX = -30
    const maxX = 130

    // --- soft bounds (bounce-ish but gentle)
    if (light.x < minX || light.x > maxX) light.vx *= -1
    if (light.y < (light.team === "p1" ? 80 : minY) ||
        light.y > (light.team === "p1" ? maxY : 13)) {
      light.vy *= -1
    }

    // --- clamp (safety)
    light.x = Math.max(minX, Math.min(maxX, light.x))
    light.y = Math.max(minY, Math.min(maxY, light.y))

    // --- write to CSS vars
    light.style["--x"] = `${light.x}%`
    light.style["--y"] = `${light.y}%`
  }

  animationId = requestAnimationFrame(animateLights)
}
  
  function select(op: OperationType, r: NumberRange) {
    operation.value = op
    selectedRange.value = r
  }
  
  function confirm() {
    if (selectedRange.value !== null) {
      emit('select', operation.value, selectedRange.value)
    }
  }
  
  function refresh() {
    unlocked.value = {
      addsub: {
        10:  isRangeUnlocked('addsub', 10),
        20:  isRangeUnlocked('addsub', 20),
        100: isRangeUnlocked('addsub', 100),
      },
      muldiv: {
        10:  isRangeUnlocked('muldiv', 10),
        20:  isRangeUnlocked('muldiv', 20),
        100: isRangeUnlocked('muldiv', 100),
      },
    }
  }
  
  defineExpose({ refresh })
  </script>
  
  <style scoped>
  .range-menu {
    position: fixed;
    inset: 0;
    isolation: isolate;
    background: #f5f0eb;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    box-sizing: border-box;
    overflow: scroll;
  }
  
  .menu-content {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
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
    margin: 0 0 12px;
    font-weight: 400;
  }
  
  .grid {
    display: grid;
    grid-template-columns: 1fr 56px 56px;
    gap: 8px;
    align-items: center;
  }
  
  .col-header {
    font-size: 13px;
    font-weight: 700;
    color: #aaa;
    text-align: center;
    padding: 4px 0;
    letter-spacing: 0.5px;
  }
  
  .range-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  
  .range-icon {
    font-size: 18px;
    color: #555;
    width: 22px;
    text-align: center;
  }
  
  .range-name {
    font-size: clamp(14px, 3.8vw, 16px);
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .cell {
    height: 48px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s, border-color 0.12s, background 0.12s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  
  .cell:active {
    transform: scale(0.94);
  }
  
  .cell.active {
    border-color: #1a1a1a;
    background: #f0ede8;
  }
  
  .cell.locked {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  .cell:disabled {
    cursor: not-allowed;
  }
  
  .lock-icon {
    font-size: 16px;
    opacity: 0.7;
  }
  
  .check-icon {
    font-size: 18px;
    color: #1a1a1a;
    font-weight: 700;
  }
  
  .start-btn {
    margin-top: 8px;
    padding: 16px 20px;
    border: none;
    border-radius: 14px;
    background: #1a1a1a;
    color: white;
    font-size: clamp(15px, 4vw, 18px);
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.12s, opacity 0.12s;
  }
  
  .start-btn:active {
    transform: scale(0.98);
  }
  
  .start-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  
  .hint {
    margin-top: 4px;
    font-size: clamp(12px, 3.2vw, 14px);
    color: #999;
    text-align: center;
    line-height: 1.4;
    padding: 0 8px;
  }

.light-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ambient-light{
    position:absolute;
    z-index:0;
}

.menu-content{
    position:relative;
    z-index:1;
}
.ambient-light{

position:absolute;

left:var(--x);
top:var(--y);

width:var(--size);
aspect-ratio:1;

border-radius:50%;

pointer-events:none;

transform:translate(-50%,-50%);

animation:
    float var(--duration) ease-in-out infinite,
    pulse calc(var(--duration) * .9) ease-in-out infinite;

animation-delay:
    var(--delay),
    var(--delay);
}

.ambient-light.p1 {
    background: var(--p1-light);

    box-shadow:
        0 0 15vh 15vh var(--p1-light),
        0 0 15vh 5vh var(--p1-color);

    opacity: .32;
}

.ambient-light.p2 {
    background: var(--p2-light);

    box-shadow:
        0 0 15vh 15vh var(--p2-light),
        0 0 15vh 5vh var(--p2-color);

    opacity: .32;
}

@keyframes float{

0%,100%{

    transform:
        translate(-50%,-50%)
        translate(0,0);

}

50%{

    transform:
        translate(-50%,-50%)
        translate(var(--drift-x),var(--drift-y));

}

}

@keyframes pulse{

0%,100%{

    opacity:.02;
    scale:.8;

}

30%{

    opacity:.29;

}

50%{

    opacity:.94;
    scale:1;

}

75%{

    opacity:.38;

}

}
  </style>
  