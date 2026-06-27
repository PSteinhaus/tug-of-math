const STORAGE_KEY = 'unlockedAi'

export function getUnlockedAiLevels(): number {
  const val = localStorage.getItem(STORAGE_KEY)
  if (!val) return 1
  const n = parseInt(val, 10)
  return isNaN(n) ? 1 : Math.max(1, Math.min(n, 5))
}

export function unlockNextAiLevel(currentLevel: number) {
  const current = getUnlockedAiLevels()
  if (currentLevel >= current) {
    const newValue = Math.min(currentLevel + 1, 5)
    localStorage.setItem(STORAGE_KEY, String(newValue))
  }
}
