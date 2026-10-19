import { buildSource, LINE } from './binarySearch'
import type { ExecutionState, SearchVariant } from './types'

export type PredictionKind = 'loop-condition' | 'direction' | 'update-value'

export type PredictionOption = { id: string; label: string }

export type Prediction = {
  /** The step the student is standing on when the question is asked (before the next line runs). */
  stepIndex: number
  kind: PredictionKind
  title: string
  question: string
  options: PredictionOption[]
  correctId: string
  /** Shown after answering. Mentions the real code line so the student can compare it with their guess. */
  explanation: string
}

const unique = (values: number[]): number[] => [...new Set(values)].sort((a, b) => a - b)

/**
 * Builds the question to ask *before* the next source line runs, or null if no question fits here.
 * Questions deliberately do not show the code of the line being predicted. The student has to read
 * the source panel, which is where most debugging mistakes happen.
 */
export function getPrediction(
  states: readonly ExecutionState[],
  variant: SearchVariant,
  stepIndex: number,
): Prediction | null {
  const state = states[stepIndex]
  const next = states[stepIndex + 1]
  if (!state || !next) return null

  const source = buildSource(variant)
  const codeOf = (line: number) => source[line - 1].trim()
  const { low, mid, high, array, target } = state

  switch (next.line) {
    case LINE.loop: {
      if (low === null || high === null) return null
      const runs = variant.loop === '<=' ? low <= high : low < high
      return {
        stepIndex,
        kind: 'loop-condition',
        title: 'Predict the loop',
        question: `Line ${LINE.loop} is about to run with low = ${low} and high = ${high}. Read the loop condition in the code. Will the loop body run?`,
        options: [
          { id: 'run', label: 'Yes, the loop body runs' },
          { id: 'stop', label: 'No, the loop ends' },
        ],
        correctId: runs ? 'run' : 'stop',
        explanation: `Line ${LINE.loop} is \`${codeOf(LINE.loop)}\`. With low = ${low} and high = ${high} the condition is ${runs}, so ${
          runs ? 'the loop body runs.' : 'the loop ends and the function returns -1.'
        }`,
      }
    }

    case LINE.lessThan: {
      if (mid === null) return null
      const value = array[mid]
      const isLess = value < target
      return {
        stepIndex,
        kind: 'direction',
        title: 'Predict the direction',
        question: `Line ${LINE.lessThan} is about to run. arr[mid] = ${value} and the target is ${target}. Which boundary will move?`,
        options: [
          { id: 'low', label: `The low boundary moves (line ${LINE.lowUpdate})` },
          { id: 'high', label: `The high boundary moves (line ${LINE.highUpdate})` },
        ],
        correctId: isLess ? 'low' : 'high',
        explanation: `Line ${LINE.lessThan} is \`${codeOf(LINE.lessThan)}\`. ${value} < ${target} is ${isLess}, so line ${
          isLess ? LINE.lowUpdate : LINE.highUpdate
        } runs next.`,
      }
    }

    case LINE.lowUpdate:
    case LINE.highUpdate: {
      if (mid === null) return null
      const isLow = next.line === LINE.lowUpdate
      const name = isLow ? 'low' : 'high'
      const current = isLow ? low : high
      const actual = isLow ? next.low : next.high
      if (actual === null) return null

      const candidates = isLow ? [mid, mid + 1, mid + 2] : [mid - 1, mid, mid + 1]
      const values = unique(candidates)
      return {
        stepIndex,
        kind: 'update-value',
        title: 'Predict the update',
        question: `Line ${next.line} is about to run. Right now mid = ${mid} and ${name} = ${current}. Read the code on that line. What will ${name} be afterwards?`,
        options: values.map((v) => ({ id: String(v), label: String(v) })),
        correctId: String(actual),
        explanation: `Line ${next.line} is \`${codeOf(next.line)}\` and mid is ${mid}, so ${name} becomes ${actual}.`,
      }
    }

    default:
      return null
  }
}

export type Answer = {
  /** The option chosen, or null if the student skipped the question. */
  choice: string | null
  correct: boolean
}

export function scoreAnswers(answers: Record<number, Answer>): { answered: number; correct: number; skipped: number } {
  let answered = 0
  let correct = 0
  let skipped = 0
  for (const a of Object.values(answers)) {
    if (a.choice === null) skipped++
    else {
      answered++
      if (a.correct) correct++
    }
  }
  return { answered, correct, skipped }
}
