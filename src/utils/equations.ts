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

// For custom ranges (small maxNumber), ensure at least 20% of equations use the max number
function shouldForceMaxNumber(maxNumber: number): boolean {
  // For custom ranges (maxNumber <= 10), 20% chance to force max number usage
  if (maxNumber <= 10) {
    return Math.random() < 0.20
  }
  return false
}

export function generateEquation(maxNumber: number = 20, operation: OperationType = 'addsub'): Equation {
  const op: Operator = operation === 'addsub'
    ? (Math.random() < 0.5 ? '+' : '−')
    : (Math.random() < 0.5 ? '×' : '÷')

  const forceMaxNumber = shouldForceMaxNumber(maxNumber)

  let a: number, b: number, result: number

  if (op === '+') {
    if (forceMaxNumber) {
      // Force maxNumber to be part of the equation
      if (maxNumber === 1) {
        // For maxNumber = 1, possible equations: 0+1=1 or 1+0=1
        a = Math.random() < 0.5 ? 0 : 1
        b = 1 - a
      } else if (Math.random() < 0.5) {
        // a = maxNumber, b = 0 (result = maxNumber)
        a = maxNumber
        b = 0
      } else {
        // a + b = maxNumber
        a = randInt(0, maxNumber - 1)
        b = maxNumber - a
      }
    } else {
      a = randInt(0, maxNumber - 1)
      b = randInt(0, maxNumber - a)
    }
    result = a + b
  } else if (op === '−') {
    if (forceMaxNumber) {
      // Force maxNumber to be part of the equation
      a = maxNumber
      b = randInt(0, maxNumber)
    } else {
      a = randInt(1, maxNumber)
      b = randInt(0, a)
    }
    result = a - b
  } else if (op === '×') {
    if (maxNumber >= 100) {
      // kleines Einmaleins: factors 1..10
      a = randInt(1, 10)
      b = randInt(1, 10)
    } else if (forceMaxNumber) {
      // For small ranges, include maxNumber in multiplication
      if (maxNumber >= 2) {
        // Use maxNumber as a factor: maxNumber × 1 = maxNumber
        a = maxNumber
        b = 1
      } else {
        // maxNumber is 1, so only 1×1=1 is possible
        a = 1
        b = 1
      }
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
    } else if (forceMaxNumber) {
      // For small ranges, try to include maxNumber in division
      if (maxNumber >= 1) {
        a = maxNumber
        // Find a divisor that divides maxNumber evenly
        const divisors = []
        for (let i = 1; i <= a; i++) {
          if (a % i === 0 && i <= maxNumber) {
            divisors.push(i)
          }
        }
        if (divisors.length > 0) {
          b = divisors[randInt(0, divisors.length - 1)]
          result = a / b
        } else {
          b = randInt(1, maxNumber)
          result = randInt(1, Math.max(1, Math.floor(maxNumber / b)))
        }
      } else {
        b = randInt(1, maxNumber)
        result = randInt(1, Math.max(1, Math.floor(maxNumber / b)))
      }
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
