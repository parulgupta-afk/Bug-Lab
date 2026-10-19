/** Built-in smart test cases for Binary Search challenges. */

export type TestCategory =
  | 'normal'
  | 'boundary'
  | 'edge'
  | 'missing'
  | 'duplicates'
  | 'invalid-input'

export type TestCase = {
  id: string
  name: string
  description: string
  array: number[]
  target: number
  /**
   * Expected return index for a correct standard binary search.
   * null means this case is not scored by numeric equality (invalid input).
   */
  expected: number | null
  category: TestCategory
}

export type TestStatus = 'passed' | 'failed' | 'invalid-input' | 'error'

export type TestResult = {
  testCaseId: string
  status: TestStatus
  expected: number | null
  actual: number | null
  message: string
  steps: number
  hints: string[]
}

/** True if array is sorted non-decreasing. Empty is sorted. */
export function isSortedAscending(arr: readonly number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! < arr[i - 1]!) return false
  }
  return true
}

/**
 * Expected index for standard binary search that may return any matching index
 * when duplicates exist. null only for invalid-input cases.
 */
export function expectedIndex(arr: readonly number[], target: number): number {
  if (arr.length === 0) return -1
  // Prefer the first matching index as the documented expected for stable tests.
  const idx = arr.indexOf(target)
  return idx
}

/** Built-in suite covering normal, boundary, edge, missing, duplicates, invalid. */
export const BINARY_SEARCH_SUITE: TestCase[] = [
  {
    id: 'normal-mid',
    name: 'Target in the middle',
    description: 'Ordinary happy path on a sorted array.',
    array: [1, 3, 5, 7, 9],
    target: 5,
    expected: 2,
    category: 'normal',
  },
  {
    id: 'boundary-first',
    name: 'First element',
    description: 'Target sits at index 0.',
    array: [1, 3, 5, 7, 9],
    target: 1,
    expected: 0,
    category: 'boundary',
  },
  {
    id: 'boundary-last',
    name: 'Last element',
    description: 'Target sits at the final index.',
    array: [1, 3, 5, 7, 9],
    target: 9,
    expected: 4,
    category: 'boundary',
  },
  {
    id: 'missing',
    name: 'Missing target',
    description: 'Target is absent from a sorted array.',
    array: [1, 3, 5, 7, 9],
    target: 4,
    expected: -1,
    category: 'missing',
  },
  {
    id: 'single-found',
    name: 'Single element found',
    description: 'One-element array containing the target.',
    array: [5],
    target: 5,
    expected: 0,
    category: 'edge',
  },
  {
    id: 'single-missing',
    name: 'Single element missing',
    description: 'One-element array that does not contain the target.',
    array: [5],
    target: 3,
    expected: -1,
    category: 'edge',
  },
  {
    id: 'empty',
    name: 'Empty array',
    description: 'No candidates; result must be -1.',
    array: [],
    target: 5,
    expected: -1,
    category: 'edge',
  },
  {
    id: 'two-element',
    name: 'Two-element array',
    description: 'Smallest non-trivial sorted window.',
    array: [2, 4],
    target: 4,
    expected: 1,
    category: 'boundary',
  },
  {
    id: 'negatives',
    name: 'Negative numbers',
    description: 'Sorted array spanning negatives and positives.',
    array: [-10, -5, 0, 5, 10],
    target: -5,
    expected: 1,
    category: 'normal',
  },
  {
    id: 'duplicates',
    name: 'Duplicate values',
    description: 'Any index holding the target is acceptable for standard search.',
    array: [1, 2, 2, 2, 3],
    target: 2,
    expected: 1, // first occurrence; runner also accepts any matching index
    category: 'duplicates',
  },
  {
    id: 'unsorted',
    name: 'Unsorted input',
    description: 'Violates the sorted-input precondition of binary search.',
    array: [5, 1, 9, 3],
    target: 9,
    expected: null,
    category: 'invalid-input',
  },
]
