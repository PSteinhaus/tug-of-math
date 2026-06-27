export type MissingPosition = 'left' | 'right' | 'result'
export type OperationType = 'addsub' | 'muldiv'
export type Operator = '+' | '−' | '×' | '÷'

export interface Equation {
  a: number
  b: number
  op: Operator
  result: number
  missing: MissingPosition
  answer: number
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateEquation(maxNumber: number = 20, operation: OperationType = 'addsub'): Equation {
  const op: Operator = operation === 'addsub'
    ? (Math.random() < 0.5 ? '+' : '−')
    : (Math.random() < 0.5 ? '×' : '÷')

  let a: number, b: number, result: number

  if (op === '+') {
    a = randInt(0, maxNumber - 1)
    b = randInt(0, maxNumber - a)
    result = a + b
  } else if (op === '−') {
    a = randInt(1, maxNumber)
    b = randInt(0, a)
    result = a - b
  } else if (op === '×') {
    if (maxNumber >= 100) {
      // kleines Einmaleins: factors 1..10
      a = randInt(1, 10)
      b = randInt(1, 10)
    } else {
      a = randInt(1, maxNumber)
      b = randInt(1, Math.max(1, Math.floor(maxNumber / a)))
    }
    result = a * b
  } else {
    // ÷: build from divisor × quotient = dividend
    if (maxNumber >= 100) {
      // kleines Einmaleins: divisor and quotient 1..10
      b = randInt(1, 10)
      result = randInt(1, 10)
    } else {
      b = randInt(1, maxNumber)
      result = randInt(1, Math.max(1, Math.floor(maxNumber / b)))
    }
    a = b * result
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
  if (eq.missing === 'left') return { parts: [box, eq.op, String(eq.b), '=', String(eq.result)], missingIndex: 0 }
  if (eq.missing === 'right') return { parts: [String(eq.a), eq.op, box, '=', String(eq.result)], missingIndex: 2 }
  return { parts: [String(eq.a), eq.op, String(eq.b), '=', box], missingIndex: 4 }
}
