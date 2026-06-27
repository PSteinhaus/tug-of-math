export type MissingPosition = 'left' | 'right' | 'result'

export interface Equation {
  a: number
  b: number
  op: '+' | '-'
  result: number
  missing: MissingPosition
  answer: number
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateEquation(): Equation {
  const op = Math.random() < 0.5 ? '+' : '-'
  let a: number, b: number, result: number

  if (op === '+') {
    a = randInt(0, 18)
    b = randInt(0, 20 - a)
    result = a + b
  } else {
    a = randInt(1, 20)
    b = randInt(0, a)
    result = a - b
  }

  const positions: MissingPosition[] = ['left', 'right', 'result']
  const missing = positions[randInt(0, 2)]

  let answer: number
  if (missing === 'left') answer = a
  else if (missing === 'right') answer = b
  else answer = result

  return { a, b, op, result, missing, answer }
}

export function formatEquation(eq: Equation, userInput: string): { parts: string[], missingIndex: number } {
  const box = userInput === '' ? '□' : userInput
  if (eq.op === '+') {
    if (eq.missing === 'left') return { parts: [box, '+', String(eq.b), '=', String(eq.result)], missingIndex: 0 }
    if (eq.missing === 'right') return { parts: [String(eq.a), '+', box, '=', String(eq.result)], missingIndex: 2 }
    return { parts: [String(eq.a), '+', String(eq.b), '=', box], missingIndex: 4 }
  } else {
    if (eq.missing === 'left') return { parts: [box, '−', String(eq.b), '=', String(eq.result)], missingIndex: 0 }
    if (eq.missing === 'right') return { parts: [String(eq.a), '−', box, '=', String(eq.result)], missingIndex: 2 }
    return { parts: [String(eq.a), '−', String(eq.b), '=', box], missingIndex: 4 }
  }
}
