<template>
  <div class="performance-graph">
    <h2 class="graph-title">Persönliche Entwicklung</h2>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue"
import { PerformanceEntry, loadPerformance } from "../utils/performance"
import { aiLevel, difficultyColor } from "../utils/ai"
import type { NumberRange } from "../utils/cookies"
import type { OperationType } from "../utils/equations"

interface Point {
  x: number  // 0 … 1 (normalised horizontal)
  y: number  // 0 … 1 (normalised vertical, 1 = best)
}

// ── Props ──────────────────────────────────────────────
const props = defineProps<{
  range: NumberRange
  operation: OperationType
}>()

// ── Canvas & Resize ────────────────────────────────────
const canvas = ref<HTMLCanvasElement | null>(null)

const GRAPH_HEIGHT = 300
const PADDING = { left: 56, right: 80, top: 24, bottom: 46 } // right increased for labels

let resizeObserver: ResizeObserver

// ── Animation state ────────────────────────────────────
const animProgress = ref(0)
let animFrameId = 0

// ── Helper: raw points → graph points (no smoothing) ──
function toGraphPoints(values: number[]): Point[] {
  if (values.length === 0) return []
  if (values.length === 1) return [{ x: 0.5, y: values[0] }]
  return values.map((v, i) => ({
    x: i / (values.length - 1),
    y: v,
  }))
}

// ── Catmull‑Rom spline ─────────────────────────────────
function catmullRomSpline(points: Point[], segmentsPerInterval = 20): Point[] {
  if (points.length < 2) return points

  const n = points.length
  const result: Point[] = []

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]

    for (let s = 0; s < segmentsPerInterval; s++) {
      const t = s / segmentsPerInterval
      const t2 = t * t
      const t3 = t2 * t

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)

      result.push({ x, y })
    }
  }

  result.push(points[n - 1])
  return result
}

// ── Main drawing ────────────────────────────────────────
function draw(progress = 1.0) {
  const c = canvas.value
  if (!c) return

  const width = c.parentElement!.clientWidth
  const height = GRAPH_HEIGHT

  c.width = width * window.devicePixelRatio
  c.height = height * window.devicePixelRatio
  c.style.width = width + "px"
  c.style.height = height + "px"

  const ctx = c.getContext("2d")!
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const left = PADDING.left
  const right = width - PADDING.right
  const top = PADDING.top
  const bottom = height - PADDING.bottom
  const graphWidth = right - left
  const graphHeight = bottom - top

  // Compute AI level info for y‑axis
  const gmLevel = aiLevel(5, props.range, props.operation)
  const gmTime = gmLevel.solveTime

  const levelInfos = [1, 2, 3, 4, 5].map((lvl) => {
    const ai = aiLevel(lvl, props.range, props.operation)
    return {
      name: ai.name, // e.g. "Anfänger"
      rel: gmTime / ai.solveTime, // ≥ 1 for slower levels
    }
  })

  function relToLevel(rel: number): number {
    const rels = levelInfos.map(l => l.rel)

    // Faster than Grandmaster
    if (rel > rels[4]) {
      const slope = rels[4] - rels[3]
      return 5 + (rel - rels[4]) / slope
    }

    // Slower than Beginner
    if (rel < rels[0]) {
      const slope = rels[1] - rels[0]
      return 1 + (rel - rels[0]) / slope
    }

    // Between AI levels
    for (let i = 0; i < 4; i++) {
      if (rel >= rels[i] && rel <= rels[i + 1]) {
        const t =
          (rel - rels[i]) /
          (rels[i + 1] - rels[i])

        return (i + 1) + t
      }
    }

    return 3
  }

  // Load raw data
  const entries: PerformanceEntry[] = loadPerformance(props.operation, props.range)
  const accuracyRaw = entries.map((e) => e.accuracy)
  const solveTimeRaw = entries.map((e) => e.solveTime)
  const speedRaw = solveTimeRaw.map((t) => (1 / t) / (1 / gmTime))

  const userLevels = speedRaw.map(relToLevel)

  const minLevel = Math.min(1, ...userLevels)
  const maxLevel = Math.max(5, ...userLevels)

  const relToPixelY = (rel: number) => levelToPixel(relToLevel(rel), minLevel, maxLevel, bottom, graphHeight)

  // Convert to points
  const accPoints = toGraphPoints(accuracyRaw)
  const speedPoints = toGraphPoints(speedRaw)

  // Spline interpolation
  const accSpline = catmullRomSpline(accPoints, 20)
  const speedSpline = catmullRomSpline(speedPoints, 20)

  // Map accuracy → y (higher y = higher accuracy)
  const ACCURACY_TOP_MARGIN = 8   // pixels, adjust to taste
  const toPixelAccuracyY = (acc: number) =>
    bottom - acc * (graphHeight - ACCURACY_TOP_MARGIN)

  // Map normalised x → pixel x
  const toPixelX = (p: Point) => left + p.x * graphWidth

  // Draw grid & axes – pass the accuracy mapping
  drawGrid(ctx, left, right, toPixelAccuracyY)
  drawAxes(ctx, left, top, graphWidth, graphHeight, entries.length, toPixelAccuracyY)
  drawSpeedLabels(ctx, right, levelInfos, minLevel, maxLevel, bottom, graphHeight)  

  // Draw curves (animated)
  ctx.save()
  ctx.beginPath()
  ctx.rect(left, top, graphWidth * progress, graphHeight)
  ctx.clip()

  // Accuracy line
  drawSpline(ctx, accSpline, toPixelX, (p: Point) => toPixelAccuracyY(p.y), "#4caf84", 3.5)
  // Speed line
  drawSpeedSpline(ctx, speedSpline, levelInfos, toPixelX, relToPixelY, 3.5, minLevel, maxLevel, bottom, graphHeight) 

  // Data points
  if (progress > 0.3) {
    drawPoints(ctx, accPoints, toPixelX, (p: Point) => toPixelAccuracyY(p.y), "#2e7d32")
    drawPoints(ctx, speedPoints, toPixelX, (p: Point) => relToPixelY(p.y), "#178dff")
  }

  ctx.restore()

  // Legend
  drawLegend(ctx, width)
}

const SPEED_MARGIN = 10

function levelToPixel(level: number, minLevel: number, maxLevel: number, bottom: number, graphHeight: number) {
  const usableHeight = graphHeight - SPEED_MARGIN * 2

  return (
    bottom -
    SPEED_MARGIN -
    ((level - minLevel) / (maxLevel - minLevel)) * usableHeight
  )
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  toPixelAccuracyY: (acc: number) => number
) {
  ctx.strokeStyle = "#ececec"
  ctx.lineWidth = 1
  // draw grid lines at accuracy steps 0%, 20%, 40%, 60%, 80%, 100%
  for (let acc = 0; acc <= 1; acc += 0.2) {
    const yy = toPixelAccuracyY(acc)
    ctx.beginPath()
    ctx.moveTo(left, yy)
    ctx.lineTo(right, yy)
    ctx.stroke()
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  samples: number,
  toPixelAccuracyY: (acc: number) => number
) {
  // axis lines
  ctx.strokeStyle = "#bbbbbb"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, y)          // top-left → bottom-left
  ctx.lineTo(x, y + h)
  ctx.lineTo(x + w, y + h)  // bottom-left → bottom-right
  ctx.moveTo(x + w, y)      // top-right → bottom-right
  ctx.lineTo(x + w, y + h)
  ctx.stroke()

  // left axis labels (accuracy)
  ctx.fillStyle = "#777"
  ctx.font = "12px sans-serif"
  ctx.textAlign = "right"
  for (let acc = 0; acc <= 1; acc += 0.2) {
    const label = Math.round(acc * 100) + "%"
    const yy = toPixelAccuracyY(acc) + 4  // +4 for vertical centering
    ctx.fillText(label, x - 8, yy)
  }

  // bottom axis labels
  ctx.textAlign = "center"
  if (samples > 1) {
    ctx.fillText("erste Spiele", x, y + h + 24)
    ctx.fillText("aktuell", x + w, y + h + 24)
  }
}

function drawSpeedLabels(
  ctx: CanvasRenderingContext2D,
  right: number,
  levels: { name: string }[],
  minLevel: number,
  maxLevel: number,
  bottom: number,
  graphHeight: number,
) {
  ctx.fillStyle = "#777"
  ctx.font = "12px sans-serif"
  ctx.textAlign = "left"

  for (let i = 0; i < 5; i++) {
    // level i+1 → equal spacing
    const y = levelToPixel(i + 1, minLevel, maxLevel, bottom, graphHeight)
    ctx.fillText(levels[i].name, right + 6, y + 4)
  }
}

function drawSpline(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  toX: (p: Point) => number,
  toY: (p: Point) => number,
  color: string,
  lineWidth: number
) {
  if (points.length < 2) return
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = "round"
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(toX(points[0]), toY(points[0]))
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toX(points[i]), toY(points[i]))
  }
  ctx.stroke()
}

function drawSpeedSpline(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  levelInfos: { name: string; rel: number }[],
  toX: (p: Point) => number,
  toY: (y: number) => number,
  lineWidth: number,
  minLevel: number,
  maxLevel: number,
  bottom: number,
  graphHeight: number,
) {
  if (points.length < 2) return

  // Find pixel y-positions of AI level boundaries
  const beginnerY = levelToPixel(1, minLevel, maxLevel, bottom, graphHeight)
  const grandmasterY = levelToPixel(5, minLevel, maxLevel, bottom, graphHeight)

  // We'll draw three passes:
  // 1. Segments above Großmeister   → solid purple
  // 2. Segments between levels       → gradient
  // 3. Segments below Anfänger       → solid green

  ctx.lineWidth = lineWidth
  ctx.lineJoin = "round"
  ctx.lineCap = "round"

  // ── Pass 1: Solid colours for out-of-range segments ──

  // Draw all individual segments, checking where their midpoint falls
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const py0 = toY(p0.y)
    const py1 = toY(p1.y)
    const midPy = (py0 + py1) / 2

    // Choose colour based on vertical position
    let color: string

    if (midPy <= grandmasterY) {
      // Above Großmeister → solid purple
      color = difficultyColor(5)
    } else if (midPy >= beginnerY) {
      // Below Anfänger → solid green
      color = difficultyColor(1)
    } else {
      // Inside the gradient range – skip here, drawn in pass 2
      continue
    }

    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(toX(p0), py0)
    ctx.lineTo(toX(p1), py1)
    ctx.stroke()
  }

  // ── Pass 2: Gradient for segments inside the AI range ──

  // Build a gradient that exactly spans beginnerY → grandmasterY
  const gradient = ctx.createLinearGradient(
      0,
      levelToPixel(5, minLevel, maxLevel, bottom, graphHeight),
      0,
      levelToPixel(1, minLevel, maxLevel, bottom, graphHeight)
  )

for (let level = 5; level >= 1; level--) {
    const stop =
        (levelToPixel(level, minLevel, maxLevel, bottom, graphHeight)
        - levelToPixel(5, minLevel, maxLevel, bottom, graphHeight))
        /
        (levelToPixel(1, minLevel, maxLevel, bottom, graphHeight)
        - levelToPixel(5, minLevel, maxLevel, bottom, graphHeight))

    gradient.addColorStop(stop, difficultyColor(level))
}

  // Großmeister at the top (y = grandmasterY)
  gradient.addColorStop(0, difficultyColor(5))

  // Intermediate levels
  const rangeY = beginnerY - grandmasterY
  if (rangeY > 0) {
    for (let level = 4; level >= 2; level--) {
      const info = levelInfos[level - 1]
      const py = toY(info.rel)
      const fraction = (py - grandmasterY) / rangeY
      gradient.addColorStop(Math.max(0, Math.min(1, fraction)), difficultyColor(level))
    }
  }

  // Anfänger at the bottom (y = beginnerY)
  gradient.addColorStop(1, difficultyColor(1))

  // Draw only the in-range segments with the gradient
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const py0 = toY(p0.y)
    const py1 = toY(p1.y)
    const midPy = (py0 + py1) / 2

    if (midPy > grandmasterY && midPy < beginnerY) {
      ctx.strokeStyle = gradient
      ctx.beginPath()
      ctx.moveTo(toX(p0), py0)
      ctx.lineTo(toX(p1), py1)
      ctx.stroke()
    }
  }
}

function drawPoints(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  toX: (p: Point) => number,
  toY: (p: Point) => number,
  color: string
) {
  ctx.fillStyle = color
  for (const p of points) {
    ctx.beginPath()
    ctx.arc(toX(p), toY(p), 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLegend(ctx: CanvasRenderingContext2D, width: number) {
  const legendY = GRAPH_HEIGHT - 4
  const centerX = width / 2

  ctx.font = "12px sans-serif"
  ctx.textAlign = "start"

  // accuracy
  ctx.fillStyle = "#2e7d32"
  ctx.fillRect(centerX - 120, legendY - 8, 12, 12)
  ctx.fillStyle = "#444"
  ctx.fillText("Genauigkeit", centerX - 104, legendY + 2)

  // speed
  ctx.fillStyle = "#178dff"
  ctx.fillRect(centerX + 10, legendY - 8, 12, 12)
  ctx.fillText("Tempo", centerX + 26, legendY + 2)
}

let needsAnimation = true
// ── Animation logic ────────────────────────────────────
function startAnimation() {
  animProgress.value = 0
  cancelAnimationFrame(animFrameId)
  needsAnimation = needsAnimation
  needsAnimation = true
  animate()
}

function animate() {
  animProgress.value += 0.025
  if (animProgress.value >= 1) {
    animProgress.value = 1
    needsAnimation = false
  }
  draw(animProgress.value)
  if (animProgress.value < 1) {
    animFrameId = requestAnimationFrame(animate)
  }
}

// ── Lifecycle ──────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  draw(0)
  startAnimation()

  resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(animFrameId)
    animProgress.value = 1
    draw(1)
  })
  resizeObserver.observe(canvas.value!.parentElement!)
  window.addEventListener("resize", () => {
    animProgress.value = 1
    draw(1)
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrameId)
  resizeObserver.disconnect()
  window.removeEventListener("resize", () => {})
})

watch(
  () => [props.range, props.operation],
  () => startAnimation()
)
</script>

<style scoped>
.performance-graph {
  width: 100%;
  background: white;
  border-radius: 18px;
  padding: 18px;
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-top: 16px;
}

canvas {
  display: block;
  width: 100%;
}

.graph-title {
  margin: 4px 14px;
  text-align: left;

  font-size: clamp(16px, 4vw, 18px);
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}
</style>