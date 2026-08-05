import type { OperationType } from './equations'
import { clearPerformance } from './performance'

export type NumberRange = 10 | 20 | 100 | 'custom'

const maxLevel = 6
const STORAGE_KEY = 'mathTugUnlocks'
const CUSTOM_RANGE_KEY = 'mathTugCustomRange'

interface RangeState {
  10: number
  20: number
  100: number
  custom?: number
}

interface UnlockState {
  addsub: RangeState
  muldiv: RangeState
}

interface CustomRangeState {
  addsub: number
  muldiv: number
}

const DEFAULT_STATE: UnlockState = {
  addsub: { 10: 1, 20: 0, 100: 0, custom: 1 },
  muldiv: { 10: 1, 20: 0, 100: 0, custom: 1 },
}

// Default custom range starts at 1 (numbers 0 and 1)
const DEFAULT_CUSTOM_RANGE = 1

const DEFAULT_CUSTOM_RANGE_STATE: CustomRangeState = {
  addsub: DEFAULT_CUSTOM_RANGE,
  muldiv: DEFAULT_CUSTOM_RANGE,
}

function clampRange(state: RangeState): RangeState {
  return {
    10:  Math.max(0, Math.min(state[10]  ?? 0, maxLevel)),
    20:  Math.max(0, Math.min(state[20]  ?? 0, maxLevel)),
    100: Math.max(0, Math.min(state[100] ?? 0, maxLevel)),
    custom: state.custom !== undefined ? Math.max(0, Math.min(state.custom, maxLevel)) : undefined,
  } as RangeState
}

// Custom range state management
function getCustomRangeState(): CustomRangeState {
  const val = localStorage.getItem(CUSTOM_RANGE_KEY)
  if (!val) return { ...DEFAULT_CUSTOM_RANGE_STATE }
  try {
    const parsed = JSON.parse(val)
    if (parsed.addsub !== undefined && parsed.muldiv !== undefined) {
      return {
        addsub: Math.max(1, parsed.addsub),
        muldiv: Math.max(1, parsed.muldiv),
      }
    }
    // Legacy: single number stored
    const legacyValue = parseInt(val, 10)
    if (!isNaN(legacyValue) && legacyValue >= 1) {
      return {
        addsub: legacyValue,
        muldiv: legacyValue,
      }
    }
    return { ...DEFAULT_CUSTOM_RANGE_STATE }
  } catch {
    return { ...DEFAULT_CUSTOM_RANGE_STATE }
  }
}

function saveCustomRangeState(state: CustomRangeState) {
  localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(state))
}

function getState(): UnlockState {
  const val = localStorage.getItem(STORAGE_KEY)
  if (!val) return { ...DEFAULT_STATE }
  try {
    const parsed = JSON.parse(val)
    const addsub = parsed.addsub ?? parsed
    const muldiv = parsed.muldiv
    
    // Ensure both operations have all range keys including custom
    const ensureCustomRange = (state: RangeState): RangeState => {
      if (state.custom === undefined) {
        // For old saves, add custom range with Anfänger unlocked (level 1)
        return { ...state, custom: 1 }
      }
      return state
    }
    
    return {
      addsub: ensureCustomRange(clampRange(addsub)),
      muldiv: ensureCustomRange(clampRange(muldiv ?? DEFAULT_STATE.muldiv)),
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveState(state: UnlockState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Custom range management
export function getCustomRange(operation: OperationType): number {
  return getCustomRangeState()[operation]
}

export function setCustomRange(operation: OperationType, range: number) {
  const state = getCustomRangeState()
  state[operation] = Math.max(1, range)
  saveCustomRangeState(state)
}

export function incrementCustomRange(operation: OperationType): number {
  const state = getCustomRangeState()
  const newRange = state[operation] + 1
  state[operation] = newRange
  saveCustomRangeState(state)
  return newRange
}

export function resetCustomRange(operation: OperationType) {
  const state = getCustomRangeState()
  state[operation] = DEFAULT_CUSTOM_RANGE
  saveCustomRangeState(state)
}

// Helper function to get the actual max number for a range
export function getMaxNumberForRange(operation: OperationType, range: NumberRange): number {
  if (range === 'custom') {
    return getCustomRange(operation)
  }
  return range
}

export function getUnlockedAiLevels(operation: OperationType, range: NumberRange): number {
  return getState()[operation][range] ?? 0
}

export function isRangeUnlocked(operation: OperationType, range: NumberRange): boolean {
  if (range === 'custom') {
    // Custom range is always available
    return true
  }
  return getState()[operation][range] >= 1
}

export function unlockNextAiLevel(operation: OperationType, range: NumberRange, currentLevel: number) {
  const state = getState()
  const opState = state[operation]
  const current = opState[range] ?? 0
  
  // Handle custom range progression
  if (range === 'custom') {
    // For custom range, max level is 4 (no Großmeister)
    const customMaxLevel = 4
    if (currentLevel >= current && currentLevel < customMaxLevel) {
      opState[range] = Math.min(currentLevel + 1, customMaxLevel)
    }
    
    // When beating Meister (level 4), increase the custom range and reset progress
    if (currentLevel >= 4) {
      incrementCustomRange(operation)
      // Reset the custom range progress to Anfänger (level 1)
      opState[range] = 1
      // Clear performance data for the custom range with the new max number
      clearPerformance(operation, 'custom')
    }
    saveState(state)
    return
  }
  
  // Handle standard ranges
  if (currentLevel >= current && currentLevel < maxLevel) {
    opState[range] = Math.min(currentLevel + 1, maxLevel)
  }
  // Unlock next range when beating Erfahren (level 3) or higher
  if (currentLevel >= 3) {
    const nextRange: NumberRange | null = range === 10 ? 20 : range === 20 ? 100 : null
    if (nextRange !== null && (opState[nextRange] ?? 0) < 1) {
      opState[nextRange] = 1
    }
  }
  saveState(state)
}
