import { isCorrectResult, runTrace } from './binarySearch'
import type { SearchVariant } from './types'
import {
  BINARY_SEARCH_SUITE,
  isSortedAscending,
  type TestCase,
  type TestResult,
  type TestStatus,
} from './testCases'
import { analyzeFailure } from './testAnalyzer'

function actualFromTrace(trace: ReturnType<typeof runTrace>): number | null {
  if (trace.failure?.kind === 'infinite-loop' || trace.failure?.kind === 'step-limit') {
    return null
  }
  return trace.result
}

function scoreCase(test: TestCase, actual: number | null, steps: number, failureKind: string | null): TestResult {
  if (test.category === 'invalid-input' || !isSortedAscending(test.array)) {
    return {
      testCaseId: test.id,
      status: 'invalid-input',
      expected: null,
      actual,
      message:
        'Invalid input: binary search requires a sorted array. This case checks the precondition, not a numeric answer.',
      steps,
      hints: analyzeFailure(test, 'invalid-input', null, actual),
    }
  }

  if (failureKind === 'infinite-loop' || failureKind === 'step-limit') {
    return {
      testCaseId: test.id,
      status: 'failed',
      expected: test.expected,
      actual: null,
      message: `Did not finish (detected ${failureKind}). The search window likely stopped shrinking.`,
      steps,
      hints: analyzeFailure(test, 'failed', test.expected, null, failureKind),
    }
  }

  if (actual === null) {
    return {
      testCaseId: test.id,
      status: 'error',
      expected: test.expected,
      actual: null,
      message: 'Execution produced no result.',
      steps,
      hints: analyzeFailure(test, 'error', test.expected, null),
    }
  }

  // Duplicates: any index whose value equals target is fine.
  const ok =
    test.category === 'duplicates'
      ? isCorrectResult(test.array, test.target, actual)
      : actual === test.expected

  const status: TestStatus = ok ? 'passed' : 'failed'
  return {
    testCaseId: test.id,
    status,
    expected: test.expected,
    actual,
    message: ok
      ? `Passed: returned ${actual}.`
      : `Failed: expected ${test.expected}, got ${actual}.`,
    steps,
    hints: ok ? [] : analyzeFailure(test, 'failed', test.expected, actual),
  }
}

/** Run one test independently using the shared deterministic engine. */
export function runOneTest(test: TestCase, variant: SearchVariant): TestResult {
  try {
    if (test.category === 'invalid-input' || !isSortedAscending(test.array)) {
      // Still execute so the student can see what the algorithm does, but score as invalid-input.
      const trace = runTrace(test.array, test.target, variant)
      return scoreCase(test, actualFromTrace(trace), trace.states.length, trace.failure?.kind ?? null)
    }
    const trace = runTrace(test.array, test.target, variant)
    return scoreCase(test, actualFromTrace(trace), trace.states.length, trace.failure?.kind ?? null)
  } catch (err) {
    return {
      testCaseId: test.id,
      status: 'error',
      expected: test.expected,
      actual: null,
      message: err instanceof Error ? err.message : 'Unexpected execution error',
      steps: 0,
      hints: ['An unexpected error stopped this case. Try a smaller input.'],
    }
  }
}

/** Run the full suite; one failure never aborts the rest. */
export function runTestSuite(
  variant: SearchVariant,
  suite: readonly TestCase[] = BINARY_SEARCH_SUITE,
): TestResult[] {
  return suite.map((test) => runOneTest(test, variant))
}

export function summarizeResults(results: readonly TestResult[]) {
  return {
    total: results.length,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    invalid: results.filter((r) => r.status === 'invalid-input').length,
    error: results.filter((r) => r.status === 'error').length,
  }
}

/** Validate custom array/target input for the form. */
export function parseCustomTest(
  arrayRaw: string,
  targetRaw: string,
): { ok: true; array: number[]; target: number } | { ok: false; error: string } {
  const parts = arrayRaw
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length > 64) {
    return { ok: false, error: 'Array is limited to 64 numbers for this exercise.' }
  }

  const array: number[] = []
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isFinite(n)) {
      return { ok: false, error: `“${p}” is not a valid number.` }
    }
    array.push(n)
  }

  const target = Number(targetRaw.trim())
  if (!Number.isFinite(target)) {
    return { ok: false, error: 'Target must be a number.' }
  }

  return { ok: true, array, target }
}

export function makeCustomTestCase(array: number[], target: number): TestCase {
  const sorted = isSortedAscending(array)
  return {
    id: `custom-${Date.now()}`,
    name: 'Custom test',
    description: sorted ? 'User-defined input.' : 'User-defined unsorted input.',
    array,
    target,
    expected: sorted ? (array.length === 0 ? -1 : array.indexOf(target) === -1 ? -1 : array.indexOf(target)) : null,
    category: sorted ? 'normal' : 'invalid-input',
  }
}
