// utils/performance.ts

import type { NumberRange } from "./cookies"
import type { OperationType } from "./equations"

export interface MatchStats {
    correct: number
    wrong: number
    totalSolveTime: number // ms
}

export interface PerformanceEntry {
    /** 0..1 */
    accuracy: number

    /** Average solve time in milliseconds */
    solveTime: number

    /** Unix timestamp (ms) */
    timestamp: number
}   

const MAX_HISTORY = 50

export function calculatePerformance(stats: MatchStats): PerformanceEntry {
    const accuracy = stats.correct / (stats.correct + stats.wrong)
    const averageSolveTime = stats.totalSolveTime / (stats.correct + stats.wrong)

    return {
        accuracy: clamp(accuracy, 0, 1),
        solveTime: Math.max(0, averageSolveTime),
        timestamp: Date.now()
    }
}

function storageKey(
    operation: OperationType,
    range: NumberRange
): string {
    return `performance_${operation}_${range}`
}

export function loadPerformance(
    operation: OperationType,
    range: NumberRange
): PerformanceEntry[] {
    try {
        const raw = localStorage.getItem(storageKey(operation, range))

        if (!raw) {
            return []
        }

        const parsed = JSON.parse(raw)

        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed.filter(isPerformanceEntry)
    }
    catch {
        return []
    }
}

export function savePerformance(
    operation: OperationType,
    range: NumberRange,
    stats: MatchStats
) {
    const history = loadPerformance(operation, range)

    history.push(calculatePerformance(stats))

    while (history.length > MAX_HISTORY) {
        history.shift()
    }

    localStorage.setItem(
        storageKey(operation, range),
        JSON.stringify(history)
    )
}

export function clearPerformance(
    operation: OperationType,
    range: NumberRange
) {
    localStorage.removeItem(storageKey(operation, range))
}

export function averageAccuracy(
    history: PerformanceEntry[]
): number {
    if (history.length === 0) {
        return 0
    }

    return (
        history.reduce((sum, e) => sum + e.accuracy, 0)
        / history.length
    )
}

export function averageSolveTime(
    history: PerformanceEntry[]
): number {
    if (history.length === 0) {
        return 0
    }

    return (
        history.reduce((sum, e) => sum + e.solveTime, 0)
        / history.length
    )
}

export function latestPerformance(
    history: PerformanceEntry[]
): PerformanceEntry | null {
    if (history.length === 0) {
        return null
    }

    return history[history.length - 1]
}

function isPerformanceEntry(value: any): value is PerformanceEntry {
    return value
        && typeof value.accuracy === "number"
        && typeof value.solveTime === "number"
        && typeof value.timestamp === "number"
}

function clamp(
    value: number,
    min: number,
    max: number
) {
    return Math.min(max, Math.max(min, value))
}