export interface AiLevel {
  id: number
  name: string
  minDelay: number // ms
  maxDelay: number // ms
  accuracy: number // 0-1
}

export const AI_LEVELS: AiLevel[] = [
  { id: 1, name: 'Anfänger',        minDelay: 12000, maxDelay: 18000, accuracy: 0.60 },
  { id: 2, name: 'Fortgeschritten', minDelay: 8000,  maxDelay: 13000, accuracy: 0.78 },
  { id: 3, name: 'Erfahren',        minDelay: 4500,  maxDelay: 8000,  accuracy: 0.93 },
  { id: 4, name: 'Meister',         minDelay: 2500,  maxDelay: 6500,  accuracy: 0.96 },
  { id: 5, name: 'Großmeister',      minDelay: 2500,  maxDelay: 4500,  accuracy: 1. },
]

export function getAiDelay(level: AiLevel): number {
  return Math.floor(Math.random() * (level.maxDelay - level.minDelay + 1)) + level.minDelay
}

export function getAiAnswer(correctAnswer: number, accuracy: number): number {
  if (Math.random() < accuracy) return correctAnswer
  // Return a wrong answer in range [0, 20] that is not the correct one
  const wrong = []
  for (let i = 0; i <= 20; i++) {
    if (i !== correctAnswer) wrong.push(i)
  }
  return wrong[Math.floor(Math.random() * wrong.length)]
}
