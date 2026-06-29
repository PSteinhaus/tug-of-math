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
  exponent = 0.9
): number {
  const x = (level - 1) / (maxLevel - 1)
  return Math.pow(x, exponent)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function aiLevel(level: number, numberRange: NumberRange, operation: OperationType) {
  let config = getConfig(numberRange, operation)
  return createAiLevel(level, 5, config)
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

function createAiLevel(
  level: number,
  maxLevel: number,
  config: DifficultyConfig
): AiLevel {
  const t = powerCurve(level, maxLevel)
  console.log("t: "+t)
  let solveTime = lerp(
    config.slowSolveTime,
    config.fastSolveTime,
    t
  )
  console.log("solveTime: "+solveTime)

  return {
      id: level,
      name: AI_LEVEL_NAMES[level -1],
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
    Record<number, DifficultyConfig>
> = {
    addsub: {
        10: {
            slowSolveTime: 14000,
            fastSolveTime: 2600,
            easyAccuracy: 0.75,
            hardAccuracy: 1.00,
        },

        20: {
            slowSolveTime: 14500,
            fastSolveTime: 2800,
            easyAccuracy: 0.75,
            hardAccuracy: 1.00,
        },

        100: {
            slowSolveTime: 24500,
            fastSolveTime: 6400,
            easyAccuracy: 0.70,
            hardAccuracy: 0.97,
        },
    },

    muldiv: {
        10: {
            slowSolveTime: 14000,
            fastSolveTime: 2600,
            easyAccuracy: 0.80,
            hardAccuracy: 1.00,
        },

        20: {
            slowSolveTime: 14500,
            fastSolveTime: 2900,
            easyAccuracy: 0.76,
            hardAccuracy: 0.99,
        },

        100: {
            slowSolveTime: 14000,
            fastSolveTime: 2900,
            easyAccuracy: 0.77,
            hardAccuracy: 0.99,
        },
    },
}

export function generateAiLevels(
  numberRange: NumberRange,
  operation: OperationType
): AiLevel[] {
  return AI_LEVEL_NAMES.map((_, index) =>
    aiLevel(index + 1, numberRange, operation)
  )
}