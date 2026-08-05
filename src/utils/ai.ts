import { NumberRange } from "./cookies"
import { OperationType } from "./equations"

export interface AiLevel {
  id: number
  name: string
  solveTime: number // ms
  timingJitter: number // ms
  accuracy: number // 0-1
}

interface DifficultyConfig {
  slowSolveTime: number
  fastSolveTime: number

  easyAccuracy: number
  hardAccuracy: number
}

const AI_LEVEL_NAMES: string[] = [
  'Anfänger',
  'Fortgeschritten',
  'Erfahren',
  'Meister',
  'Großmeister'
]

// For custom ranges, we only have 3 levels
const CUSTOM_AI_LEVEL_NAMES: string[] = [
  'Anfänger',
  'Erfahren',
  'Meister'
]

export function difficultyColor(id: number): string {
  const colors = ['#6aaa78', '#c5a34a', '#e08040', '#d05050', '#8040c0']
  return colors[id - 1] ?? '#aaa'
}

export function getAiDelay(level: AiLevel): number {
  return Math.floor(level.solveTime + (Math.random() * 2 - 1) * level.timingJitter)
}

export function getAiAnswer(correctAnswer: number, accuracy: number, maxNumber: number = 20): number {
  if (Math.random() < accuracy) return correctAnswer
  // Return a wrong answer in range [0, maxNumber] that is not the correct one
  const wrong = []
  for (let i = 0; i <= maxNumber; i++) {
    if (i !== correctAnswer) wrong.push(i)
  }
  return wrong[Math.floor(Math.random() * wrong.length)]
}

function powerCurve(
  level: number,
  maxLevel: number,
  exponent = 0.6
): number {
  const x = (level - 1) / (maxLevel - 1)
  return Math.pow(x, exponent)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function aiLevel(level: number, numberRange: NumberRange, operation: OperationType, customRangeValue?: number) {
  let config
  if (numberRange === 'custom' && customRangeValue !== undefined) {
    config = getInterpolatedConfig(customRangeValue, operation)
  } else {
    config = getConfig(numberRange, operation)
  }
  const maxLevel = numberRange === 'custom' ? 3 : 5
  return createAiLevel(level, maxLevel, config, numberRange)
}

function getConfig(
  numberRange: NumberRange,
  operation: OperationType
): DifficultyConfig {
  const config = AI_CONFIG[operation][numberRange]

  if (!config) {
    throw new Error(
      `No AI config defined for operation "${operation}" and number range ${numberRange}.`
    )
  }

  return config
}

function getInterpolatedConfig(
  customRangeValue: number,
  operation: OperationType
): DifficultyConfig {
  const config10 = AI_CONFIG[operation][10]
  const config20 = AI_CONFIG[operation][20]
  const config100 = AI_CONFIG[operation][100]

  // For custom ranges smaller than 10, use values for 10
  if (customRangeValue <= 10) {
    return config10
  }

  // For custom ranges between 10 and 20, interpolate between 10 and 20
  if (customRangeValue < 20) {
    const t = (customRangeValue - 10) / (20 - 10)
    return {
      slowSolveTime: lerp(config10.slowSolveTime, config20.slowSolveTime, t),
      fastSolveTime: lerp(config10.fastSolveTime, config20.fastSolveTime, t),
      easyAccuracy: lerp(config10.easyAccuracy, config20.easyAccuracy, t),
      hardAccuracy: lerp(config10.hardAccuracy, config20.hardAccuracy, t),
    }
  }

  // For custom ranges between 20 and 100, interpolate between 20 and 100
  if (customRangeValue <= 100) {
    const t = (customRangeValue - 20) / (100 - 20)
    return {
      slowSolveTime: lerp(config20.slowSolveTime, config100.slowSolveTime, t),
      fastSolveTime: lerp(config20.fastSolveTime, config100.fastSolveTime, t),
      easyAccuracy: lerp(config20.easyAccuracy, config100.easyAccuracy, t),
      hardAccuracy: lerp(config20.hardAccuracy, config100.hardAccuracy, t),
    }
  }

  // For custom ranges above 100, use values for 100
  return config100
}

function createAiLevel(
  level: number,
  maxLevel: number,
  config: DifficultyConfig,
  numberRange: NumberRange | null = null
): AiLevel {
  let t = powerCurve(level, maxLevel)
  
  // For custom ranges with 3 levels, remap t to only cover up to Meister
  // (which is level 4 in the 5-level system, at t = powerCurve(4, 5))
  if (maxLevel === 3) {
    const meisterT = powerCurve(4, 5)
    t = t * meisterT
  }
  
  let solveTime = lerp(
    config.slowSolveTime,
    config.fastSolveTime,
    t
  )

  // Use custom level names for custom range
  const levelNames = numberRange === 'custom' ? CUSTOM_AI_LEVEL_NAMES : AI_LEVEL_NAMES

  return {
      id: level,
      name: levelNames[level - 1],
      solveTime,
      timingJitter: solveTime / 2,
      accuracy: lerp(
          config.easyAccuracy,
          config.hardAccuracy,
          t
      ),
  }
}

const AI_CONFIG: Record<
    OperationType,
    Record<number | string, DifficultyConfig>
> = {
    addsub: {
        10: {
            slowSolveTime: 22300,
            fastSolveTime: 2600,
            easyAccuracy: 0.75,
            hardAccuracy: 1.00,
        },

        20: {
            slowSolveTime: 22500,
            fastSolveTime: 2800,
            easyAccuracy: 0.75,
            hardAccuracy: 1.00,
        },

        100: {
            slowSolveTime: 38500,
            fastSolveTime: 6400,
            easyAccuracy: 0.70,
            hardAccuracy: 0.97,
        },
    },

    muldiv: {
        10: {
            slowSolveTime: 19000,
            fastSolveTime: 2600,
            easyAccuracy: 0.80,
            hardAccuracy: 1.00,
        },

        20: {
            slowSolveTime: 20500,
            fastSolveTime: 2900,
            easyAccuracy: 0.76,
            hardAccuracy: 0.99,
        },

        100: {
            slowSolveTime: 22000,
            fastSolveTime: 2900,
            easyAccuracy: 0.77,
            hardAccuracy: 0.99,
        },
    },
}

export function generateAiLevels(
  numberRange: NumberRange,
  operation: OperationType,
  customRangeValue?: number
): AiLevel[] {
  const levelNames = numberRange === 'custom' ? CUSTOM_AI_LEVEL_NAMES : AI_LEVEL_NAMES
  return levelNames.map((_, index) =>
    aiLevel(index + 1, numberRange, operation, customRangeValue)
  )
}