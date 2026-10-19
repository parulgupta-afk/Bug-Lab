import type { Challenge } from './challenges'
import type { FailureKind, Trace } from './types'

export type FlagVerdict =
  /** Right line, and the failure is already visible at this step. */
  | 'found'
  /** Right line, spotted before the failure showed up. */
  | 'found-early'
  /** Wrong line, but nothing has visibly gone wrong yet, so no line can be judged. */
  | 'too-early'
  /** Wrong line, and the failure is visible. */
  | 'wrong-line'
  /** The run is actually fine (used by Break It mode in a later phase). */
  | 'no-bug'

export type FlagResult = {
  verdict: FlagVerdict
  stepIndex: number
  line: number
  message: string
}

export const isSolved = (verdict: FlagVerdict): boolean => verdict === 'found' || verdict === 'found-early'

const FOCUS_HINT: Record<FailureKind, string> = {
  'infinite-loop': 'Focus on the lines that change low or high.',
  'wrong-result': 'Focus on the line that decides when the loop stops.',
  'step-limit': 'Focus on the lines that change low or high.',
}

/**
 * Judges a "Something's wrong" flag against the real execution trace.
 * The student flags a step (where they are) and a source line (the suspect).
 * Nothing here is guessed: it only compares against the engine's own failure record.
 */
export function evaluateFlag(
  challenge: Challenge,
  trace: Trace,
  stepIndex: number,
  line: number,
  priorWrongAttempts = 0,
): FlagResult {
  const { failure } = trace
  const base = { stepIndex, line }

  if (!failure) {
    return {
      ...base,
      verdict: 'no-bug',
      message: 'This run finished correctly, so there is nothing to flag here.',
    }
  }

  const visible = stepIndex >= failure.atStep

  if (line === challenge.bugLine) {
    return visible
      ? { ...base, verdict: 'found', message: `Correct. Line ${line} is where the bug is.` }
      : {
          ...base,
          verdict: 'found-early',
          message: `Sharp eye. Line ${line} is the bug, and you spotted it before the failure appeared. Step on to the end to see the proof.`,
        }
  }

  if (!visible) {
    return {
      ...base,
      verdict: 'too-early',
      message: `Nothing has visibly gone wrong at step ${stepIndex + 1}. Keep stepping until the program misbehaves, then flag the line that caused it.`,
    }
  }

  const hint = priorWrongAttempts >= 1 ? ` ${FOCUS_HINT[failure.kind]}` : ''
  return {
    ...base,
    verdict: 'wrong-line',
    message: `Not quite. The failure is visible, but line ${line} does its job correctly.${hint}`,
  }
}
