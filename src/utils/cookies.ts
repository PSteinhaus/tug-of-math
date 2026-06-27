import type { OperationType } from './equations'

export type NumberRange = 10 | 20 | 100

const maxLevel = 6
const STORAGE_KEY = 'mathTugUnlocks'

interface RangeState {
  10: number
  20: number
  100: number
}

interface UnlockState {
  addsub: RangeState
  muldiv: RangeState
}

const DEFAULT_STATE: UnlockState = {
  addsub: { 10: 1, 20: 0, 100: 0 },
  muldiv: { 10: 1, 20: 0, 100: 0 },
}

function clampRange(state: RangeState): RangeState {
  return {
    10:  Math.max(0, Math.min(state[10]  ?? 0, maxLevel)),
    20:  Math.max(0, Math.min(state[20]  ?? 0, maxLevel)),
    100: Math.max(0, Math.min(state[100] ?? 0, maxLevel)),
  }
}

function getState(): UnlockState {
  const val = localStorage.getItem(STORAGE_KEY)
  if (!val) return { ...DEFAULT_STATE }
  try {
    const parsed = JSON.parse(val)
    const addsub = parsed.addsub ?? parsed
    const muldiv = parsed.muldiv
    return {
      addsub: clampRange(addsub),
      muldiv: clampRange(muldiv ?? DEFAULT_STATE.muldiv),
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveState(state: UnlockState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getUnlockedAiLevels(operation: OperationType, range: NumberRange): number {
  return getState()[operation][range]
}

export function isRangeUnlocked(operation: OperationType, range: NumberRange): boolean {
  return getState()[operation][range] >= 1
}

export function unlockNextAiLevel(operation: OperationType, range: NumberRange, currentLevel: number) {
  const state = getState()
  const opState = state[operation]
  const current = opState[range]
  if (currentLevel >= current && currentLevel < maxLevel) {
    opState[range] = Math.min(currentLevel + 1, maxLevel)
  }
  // Unlock next range when beating Erfahren (level 3) or higher
  if (currentLevel >= 3) {
    const nextRange: NumberRange | null = range === 10 ? 20 : range === 20 ? 100 : null
    if (nextRange !== null && opState[nextRange] < 1) {
      opState[nextRange] = 1
    }
  }
  saveState(state)
}
