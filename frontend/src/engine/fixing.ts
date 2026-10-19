import { isCorrectResult, runTrace } from './binarySearch'
import type { Challenge } from './challenges'
import type { SearchVariant, Trace } from './types'

/** One selectable correction the student can try. */
export type FixOption = {
  id: string
  /** Short label shown in the UI. */
  label: string
  /** What changes in the source (shown under the option). */
  description: string
  /** The variant that would result if this fix is applied. */
  variant: SearchVariant
  /** True only for the real correction. */
  isCorrect: boolean
}

export type FixVerdict = 'correct' | 'still-broken' | 'different-bug'

export type FixResult = {
  optionId: string
  verdict: FixVerdict
  /** Trace produced by re-running with the chosen variant. */
  fixedTrace: Trace
  message: string
}

/**
 * Fix options are challenge-specific. Each option produces a concrete SearchVariant
 * so verification is always a real re-execution, never a label match.
 */
export function getFixOptions(challenge: Challenge): FixOption[] {
  const { buggy } = challenge

  if (challenge.id === 'infinite-loop') {
    // Bug: high = mid. Correct: high = mid - 1 (and keep loop <=).
    // Distractors deliberately keep high = mid so re-run still fails.
    return [
      {
        id: 'high-mid-1',
        label: 'high = mid - 1',
        description: 'After rejecting arr[mid], drop mid from the window.',
        variant: { loop: buggy.loop, highUpdate: 'mid-1' },
        isCorrect: true,
      },
      {
        id: 'keep-high-mid',
        label: 'Leave high = mid',
        description: 'The current boundary update is already correct.',
        variant: { ...buggy },
        isCorrect: false,
      },
      {
        id: 'loop-lt-keep-high',
        label: 'while (low < high), keep high = mid',
        description: 'Tighten the loop condition only.',
        variant: { loop: '<', highUpdate: 'mid' },
        isCorrect: false,
      },
      {
        id: 'loop-lt-and-mid1',
        label: 'while (low < high) and high = mid - 1',
        description: 'Change the loop and the high update together.',
        // Still wrong for the challenge teaching goal: loop should stay <=.
        // For this input (absent target) it may terminate, so we also require
        // the variant to match the known-good fixed form in evaluateFix.
        variant: { loop: '<', highUpdate: 'mid-1' },
        isCorrect: false,
      },
    ]
  }

  if (challenge.id === 'missing-element') {
    // Bug: while (low < high). Correct: while (low <= high).
    return [
      {
        id: 'loop-lte',
        label: 'while (low <= high)',
        description: 'Keep looping while there is still one element left to check.',
        variant: { loop: '<=', highUpdate: buggy.highUpdate },
        isCorrect: true,
      },
      {
        id: 'high-mid',
        label: 'high = mid (instead of mid - 1)',
        description: 'Keep mid in the window after a greater-than comparison.',
        variant: { loop: buggy.loop, highUpdate: 'mid' },
        isCorrect: false,
      },
      {
        id: 'loop-lt-keep',
        label: 'Keep while (low < high)',
        description: 'The current loop condition is already correct.',
        variant: { ...buggy },
        isCorrect: false,
      },
      {
        id: 'both-wrong',
        label: 'while (low < high) and high = mid',
        description: 'Change both the loop and the high update.',
        variant: { loop: '<', highUpdate: 'mid' },
        isCorrect: false,
      },
    ]
  }

  // Generic fallback: offer the challenge's known fixed variant plus the buggy one.
  return [
    {
      id: 'apply-fixed',
      label: 'Apply the standard fix',
      description: 'Use the known-correct binary search variant.',
      variant: challenge.fixed,
      isCorrect: true,
    },
    {
      id: 'keep-buggy',
      label: 'Keep the current code',
      description: 'No change.',
      variant: challenge.buggy,
      isCorrect: false,
    },
  ]
}

/**
 * Re-runs the algorithm with the chosen fix and judges the outcome against the
 * expected correct behaviour for this challenge's input. Never trusts the option label.
 */
export function evaluateFix(challenge: Challenge, option: FixOption): FixResult {
  const fixedTrace = runTrace(challenge.array, challenge.target, option.variant)
  const { result, failure } = fixedTrace

  if (failure !== null) {
    return {
      optionId: option.id,
      verdict: 'still-broken',
      fixedTrace,
      message:
        failure.kind === 'infinite-loop'
          ? 'Still stuck. The search window stopped shrinking — this fix did not solve the bug.'
          : failure.kind === 'wrong-result'
            ? `Still wrong. The function returned ${result ?? 'nothing'} instead of the correct answer.`
            : 'Still broken. The program hit the step limit without finishing.',
    }
  }

  if (result === null) {
    return {
      optionId: option.id,
      verdict: 'still-broken',
      fixedTrace,
      message: 'The function never returned. This fix is not correct.',
    }
  }

  if (!isCorrectResult(challenge.array, challenge.target, result)) {
    return {
      optionId: option.id,
      verdict: 'different-bug',
      fixedTrace,
      message: `The program finished but returned ${result}, which is not the right answer for target ${challenge.target}.`,
    }
  }

  // Must match the challenge's known-good variant so a different-but-lucky
  // combination (e.g. loop < on an absent target) is not accepted as the fix.
  const matchesFixed =
    option.variant.loop === challenge.fixed.loop &&
    option.variant.highUpdate === challenge.fixed.highUpdate

  if (!matchesFixed) {
    return {
      optionId: option.id,
      verdict: 'different-bug',
      fixedTrace,
      message:
        'The run finished with the right answer, but this is not the fix for the bug you found. Compare the line you flagged with this option.',
    }
  }

  return {
    optionId: option.id,
    verdict: 'correct',
    fixedTrace,
    message: `Verified. The corrected search finishes cleanly and returns ${result} — the correct answer for target ${challenge.target}.`,
  }
}

/** Compact stats used for the before/after comparison panel. */
export type TraceSummary = {
  steps: number
  result: number | null
  failed: boolean
  failureKind: string | null
  finalLow: number | null
  finalHigh: number | null
}

export function summarizeTrace(trace: Trace): TraceSummary {
  const last = trace.states[trace.states.length - 1]
  return {
    steps: trace.states.length,
    result: trace.result,
    failed: trace.failure !== null,
    failureKind: trace.failure?.kind ?? null,
    finalLow: last?.low ?? null,
    finalHigh: last?.high ?? null,
  }
}
