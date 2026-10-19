import { LINE } from './binarySearch'
import type { FailureKind, SearchVariant } from './types'

export type Challenge = {
  id: string
  number: string
  title: string
  difficulty: 'Beginner' | 'Intermediate'
  summary: string
  /** What the student is asked to find out. */
  objective: string
  array: number[]
  target: number
  /** The broken implementation the student investigates. */
  buggy: SearchVariant
  /** The correct implementation, used later to verify a student's fix. */
  fixed: SearchVariant
  failureKind: FailureKind
  /** Source line that contains the real bug. */
  bugLine: number
  /** Progressive hints, from gentle to specific. */
  hints: string[]
  /** Explanation shown once the student has found and fixed the bug. */
  explanation: string
}

const FIXED: SearchVariant = { loop: '<=', highUpdate: 'mid-1' }

export const CHALLENGES: Challenge[] = [
  {
    id: 'infinite-loop',
    number: '01',
    title: 'The Infinite Loop',
    difficulty: 'Beginner',
    summary: 'This binary search sometimes gets stuck. Find out why.',
    objective: 'Step through the search for 5. At some point the program stops making progress. Which line is responsible?',
    array: [3, 7, 12, 18, 24, 31, 45, 52, 67],
    target: 5,
    buggy: { loop: '<=', highUpdate: 'mid' },
    fixed: FIXED,
    failureKind: 'infinite-loop',
    bugLine: LINE.highUpdate,
    hints: [
      'Watch low and high at every loop check. In a healthy search the window gets smaller each time round.',
      'Look at the last few loop checks. What are low, mid and high when the window is down to one element?',
      'When arr[mid] is not the target, mid has already been checked. Should the window still include it?',
    ],
    explanation:
      'After arr[mid] has been compared with the target and rejected, mid must be removed from the window. Setting high = mid keeps it in, so when low and high meet, the window never shrinks. high = mid - 1 always makes progress.',
  },
  {
    id: 'missing-element',
    number: '02',
    title: 'The Missing Element',
    difficulty: 'Intermediate',
    summary: 'The search ends normally but says an element is missing when it is not.',
    objective: 'Search for 45. The program returns -1, yet 45 is in the array. Find the step where the last candidate gets skipped.',
    array: [3, 7, 12, 18, 24, 31, 45],
    target: 45,
    buggy: { loop: '<', highUpdate: 'mid-1' },
    fixed: FIXED,
    failureKind: 'wrong-result',
    bugLine: LINE.loop,
    hints: [
      'The program did not crash or hang. It simply returned the wrong answer, so look for where it gave up.',
      'Check the loop condition at the final check. How many elements are left in the window?',
      'When low equals high there is still one element left to check. Does the loop condition allow that?',
    ],
    explanation:
      'When low == high, the window holds exactly one element that has not been checked yet. The condition low < high ends the loop before looking at it. low <= high keeps the loop running until the window is truly empty.',
  },
]

export function getChallenge(id: string): Challenge {
  const found = CHALLENGES.find((c) => c.id === id)
  if (!found) throw new Error(`Unknown challenge: ${id}`)
  return found
}
