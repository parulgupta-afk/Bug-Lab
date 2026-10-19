import type { TestCase, TestStatus } from './testCases'

/**
 * Progressive, deterministic hints. Level 0 is always the mildest.
 * Never reveals the full fix.
 */
export function analyzeFailure(
  test: TestCase,
  status: TestStatus,
  expected: number | null,
  actual: number | null,
  failureKind?: string | null,
): string[] {
  if (status === 'invalid-input') {
    return [
      'This array is not sorted. Binary search only makes valid half-eliminations on sorted data.',
      'Treat this as a precondition check, not a coding bug in the comparison logic.',
      'Sort the input before searching, or reject unsorted inputs in a real program.',
    ]
  }

  if (failureKind === 'infinite-loop' || failureKind === 'step-limit') {
    return [
      'The run did not terminate cleanly — the window likely stopped shrinking.',
      'Watch low and high on successive loop checks; both must eventually move past mid after a rejection.',
      'Focus on the branch that updates the boundary when arr[mid] is not the target.',
    ]
  }

  if (status === 'error') {
    return ['Execution did not produce a usable result. Try a simpler input first.']
  }

  const targetPresent = test.array.includes(test.target)

  if (expected === -1 && actual !== null && actual >= 0) {
    return [
      'The target is not in the array, but the algorithm returned an index.',
      'Check that a found return only happens when arr[mid] really equals the target.',
      'Confirm the loop exits with -1 when the window becomes empty.',
    ]
  }

  if (targetPresent && (actual === -1 || actual === null)) {
    return [
      'The target exists in the array, but the algorithm reported it missing.',
      'Examine the loop condition when low and high become equal — the last candidate may be skipped.',
      'Single-element and last-element cases often expose an off-by-one in the while condition or boundary update.',
    ]
  }

  if (expected !== null && actual !== null && expected !== actual) {
    return [
      `Expected index ${expected}, but got ${actual}.`,
      'Step through this exact input in the debugger and watch which half is discarded.',
      'Boundary cases (first, last, single element) are the usual place off-by-one bugs hide.',
    ]
  }

  return ['Compare expected and actual carefully, then step through this input in the debugger.']
}
