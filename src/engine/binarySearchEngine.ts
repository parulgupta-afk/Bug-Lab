export type ChallengeId = 'infinite-loop' | 'missing-element' | 'assumptions'
export type FixType = 'none' | 'boundary' | 'sort-input'
export type SnapshotStatus = 'running' | 'found' | 'not-found' | 'loop-detected'
export type SnapshotPhase = 'setup' | 'condition' | 'compare' | 'move' | 'result' | 'guard'

export interface Challenge {
  id: ChallengeId
  title: string
  eyebrow: string
  difficulty: 'Beginner' | 'Intermediate'
  description: string
  symptom: string
  bugLabel: string
  defaultArray: number[]
  defaultTarget: number
  codeLines: string[]
  correctFix: FixType
  focusLine: number
  expectedCopy: string
}

export interface ExecutionSnapshot {
  step: number
  line: number
  phase: SnapshotPhase
  status: SnapshotStatus
  array: number[]
  low: number
  mid: number
  high: number
  currentIndex: number
  comparison: string
  narrative: string
  changedVariable?: string
  output: number | null
}

export interface PredictionPrompt {
  question: string
  options: string[]
  correct: string
  explanation: string
}

export interface VerificationResult {
  passed: boolean
  actual: number | null
  expected: number
  message: string
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'infinite-loop',
    title: 'The Infinite Loop',
    eyebrow: 'BOUNDARY UPDATE',
    difficulty: 'Beginner',
    description: 'The search finds the right half, but the left boundary refuses to move past mid.',
    symptom: 'The trace repeats low = 6 and mid = 6 until the safety guard steps in.',
    bugLabel: 'stuck boundary',
    defaultArray: [3, 8, 14, 21, 29, 34, 42, 57],
    defaultTarget: 57,
    correctFix: 'boundary',
    focusLine: 12,
    expectedCopy: 'target index 7',
    codeLines: [
      'const low = 0',
      'let high = arr.length - 1',
      '',
      'while (low <= high) {',
      '  if (low > high) return -1',
      '  const mid = Math.floor((low + high) / 2)',
      '  const value = arr[mid]',
      '',
      '  if (value === target) return mid',
      '',
      '  if (value < target) {',
      '    low = mid        // try this line',
      '  } else {',
      '    high = mid',
      '  }',
      '}',
      'return -1',
    ],
  },
  {
    id: 'missing-element',
    title: 'The Missing Element',
    eyebrow: 'LOOP CONDITION',
    difficulty: 'Beginner',
    description: 'A boundary condition skips a valid first element before the search can inspect it.',
    symptom: 'Target 3 is at index 0, but the loop exits when low equals high.',
    bugLabel: 'edge case skipped',
    defaultArray: [3, 8, 14, 21, 29, 34, 42, 57],
    defaultTarget: 3,
    correctFix: 'boundary',
    focusLine: 4,
    expectedCopy: 'target index 0',
    codeLines: [
      'const low = 0',
      'let high = arr.length - 1',
      '',
      'while (low < high) {       // boundary is too strict',
      '  if (low > high) return -1',
      '  const mid = Math.floor((low + high) / 2)',
      '  const value = arr[mid]',
      '',
      '  if (value === target) return mid',
      '',
      '  if (value < target) {',
      '    low = mid + 1',
      '  } else {',
      '    high = mid - 1',
      '  }',
      '}',
      'return -1',
    ],
  },
  {
    id: 'assumptions',
    title: 'Break the Assumptions',
    eyebrow: 'INPUT INVARIANT',
    difficulty: 'Intermediate',
    description: 'The code is fine. The input is not sorted, so the direction decision is no longer trustworthy.',
    symptom: 'Binary search can discard the half that contains the target when the array is unsorted.',
    bugLabel: 'assumption broken',
    defaultArray: [3, 34, 8, 57, 14, 42, 21, 29],
    defaultTarget: 14,
    correctFix: 'sort-input',
    focusLine: 6,
    expectedCopy: 'target index 2 after sorting (original index 4)',
    codeLines: [
      'const low = 0',
      'let high = arr.length - 1',
      '',
      'while (low <= high) {',
      '  if (low > high) return -1',
      '  const mid = Math.floor((low + high) / 2)',
      '  const value = arr[mid]',
      '',
      '  if (value === target) return mid',
      '',
      '  if (value < target) {',
      '    low = mid + 1',
      '  } else {',
      '    high = mid - 1',
      '  }',
      '}',
      'return -1',
    ],
  },
]

const pushSnapshot = (
  snapshots: ExecutionSnapshot[],
  state: Omit<ExecutionSnapshot, 'step'>,
) => {
  snapshots.push({ ...state, step: snapshots.length })
}

export function getChallenge(id: ChallengeId): Challenge {
  return CHALLENGES.find((challenge) => challenge.id === id) ?? CHALLENGES[0]
}

export function isSorted(array: number[]): boolean {
  return array.every((value, index) => index === 0 || array[index - 1] <= value)
}

export function getExpectedIndex(array: number[], target: number): number {
  return array.indexOf(target)
}

export function runBinarySearch(
  challengeId: ChallengeId,
  inputArray: number[],
  target: number,
  fix: FixType = 'none',
): ExecutionSnapshot[] {
  const sourceArray = fix === 'sort-input' ? [...inputArray].sort((a, b) => a - b) : [...inputArray]
  const challenge = getChallenge(challengeId)
  const snapshots: ExecutionSnapshot[] = []
  let low = 0
  let high = sourceArray.length - 1
  let mid = -1
  let output: number | null = null
  let status: SnapshotStatus = 'running'
  const seenRanges = new Map<string, number>()
  let iterations = 0

  pushSnapshot(snapshots, {
    line: 2,
    phase: 'setup',
    status,
    array: sourceArray,
    low,
    mid,
    high,
    currentIndex: -1,
    comparison: 'Ready to inspect the search interval',
    narrative: `Start with the full array: low = ${low}, high = ${high}.`,
    changedVariable: 'low, high',
    output,
  })

  while (status === 'running') {
    iterations += 1
    if (iterations > 18) {
      status = 'loop-detected'
      pushSnapshot(snapshots, {
        line: challenge.id === 'infinite-loop' ? 12 : 4,
        phase: 'guard',
        status,
        array: sourceArray,
        low,
        mid,
        high,
        currentIndex: mid,
        comparison: 'Same range observed repeatedly',
        narrative: 'Safety guard: the range stopped shrinking. This is the infinite-loop signal.',
        changedVariable: 'execution guard',
        output,
      })
      break
    }

    pushSnapshot(snapshots, {
      line: 4,
      phase: 'condition',
      status,
      array: sourceArray,
      low,
      mid,
      high,
      currentIndex: mid,
      comparison: `low ${low} <= high ${high}`,
      narrative: `The loop is alive while the interval ${low}…${high} still has candidates.`,
      output,
    })

    const strictConditionStops = challengeId === 'missing-element' && fix !== 'boundary' && low >= high
    if (low > high || sourceArray.length === 0 || strictConditionStops) {
      status = 'not-found'
      output = -1
      pushSnapshot(snapshots, {
        line: 17,
        phase: 'result',
        status,
        array: sourceArray,
        low,
        mid,
        high,
        currentIndex: -1,
        comparison: 'No candidates remain',
        narrative: 'The interval is empty, so the target is not in this input.',
        changedVariable: 'output',
        output,
      })
      break
    }

    mid = Math.floor((low + high) / 2)
    pushSnapshot(snapshots, {
      line: 6,
      phase: 'compare',
      status,
      array: sourceArray,
      low,
      mid,
      high,
      currentIndex: mid,
      comparison: `mid = floor((${low} + ${high}) / 2) = ${mid}`,
      narrative: `Probe index ${mid}. The value there is ${sourceArray[mid]}.`,
      changedVariable: 'mid',
      output,
    })

    const value = sourceArray[mid]
    pushSnapshot(snapshots, {
      line: 7,
      phase: 'compare',
      status,
      array: sourceArray,
      low,
      mid,
      high,
      currentIndex: mid,
      comparison: `${value} ${value === target ? '===' : value < target ? '<' : '>'} ${target}`,
      narrative: value === target
        ? `Match. ${value} is the target.`
        : value < target
          ? `${value} is smaller than ${target}; the target must be to the right.`
          : `${value} is larger than ${target}; the target must be to the left.`,
      changedVariable: 'comparison',
      output,
    })

    if (value === target) {
      status = 'found'
      output = mid
      pushSnapshot(snapshots, {
        line: 9,
        phase: 'result',
        status,
        array: sourceArray,
        low,
        mid,
        high,
        currentIndex: mid,
        comparison: `${value} === ${target}`,
        narrative: `Found target at index ${mid}.`,
        changedVariable: 'output',
        output,
      })
      break
    }

    if (value < target) {
      const nextLow = fix === 'boundary' ? mid + 1 : mid
      pushSnapshot(snapshots, {
        line: 12,
        phase: 'move',
        status,
        array: sourceArray,
        low,
        mid,
        high,
        currentIndex: mid,
        comparison: `${value} < ${target}`,
        narrative: fix === 'boundary'
          ? `Move low past mid: low = ${mid + 1}. The rejected value cannot be the answer.`
          : `Move low to mid: low = ${mid}. Notice that the interval may not shrink.`,
        changedVariable: 'low',
        output,
      })
      low = nextLow
    } else {
      const nextHigh = fix === 'boundary' ? mid - 1 : mid
      pushSnapshot(snapshots, {
        line: 14,
        phase: 'move',
        status,
        array: sourceArray,
        low,
        mid,
        high,
        currentIndex: mid,
        comparison: `${value} > ${target}`,
        narrative: fix === 'boundary'
          ? `Move high before mid: high = ${mid - 1}. The rejected value cannot be the answer.`
          : `Move high to mid: high = ${mid}. The interval can get stuck here too.`,
        changedVariable: 'high',
        output,
      })
      high = nextHigh
    }

    const rangeKey = `${low}:${high}`
    const rangeCount = (seenRanges.get(rangeKey) ?? 0) + 1
    seenRanges.set(rangeKey, rangeCount)
    if (rangeCount >= 2 && fix !== 'boundary' && challengeId !== 'assumptions') {
      status = 'loop-detected'
      pushSnapshot(snapshots, {
        line: value < target ? 12 : 14,
        phase: 'guard',
        status,
        array: sourceArray,
        low,
        mid,
        high,
        currentIndex: mid,
        comparison: `Repeated range ${low}…${high}`,
        narrative: 'Same interval again. A boundary must move beyond mid to guarantee progress.',
        changedVariable: 'execution guard',
        output,
      })
    }
  }

  return snapshots
}

export function getPredictionPrompt(challenge: Challenge, snapshot: ExecutionSnapshot): PredictionPrompt {
  if (challenge.id === 'infinite-loop') {
    return {
      question: snapshot.phase === 'move'
        ? 'The probe is smaller than the target. Which update guarantees progress?'
        : 'The trace is repeating. What invariant should a binary-search update preserve?',
      options: ['low = mid', 'low = mid + 1', 'high = mid + 1'],
      correct: 'low = mid + 1',
      explanation: 'The current mid value was already rejected. Advancing beyond it is what shrinks the interval.',
    }
  }

  if (challenge.id === 'missing-element') {
    return {
      question: 'The target may live at the last remaining index. Which loop condition keeps that case alive?',
      options: ['while (low < high)', 'while (low <= high)', 'while (low === high)'],
      correct: 'while (low <= high)',
      explanation: 'When low equals high there is still one candidate to inspect, so the condition must include equality.',
    }
  }

  return {
    question: 'Binary search chose a direction from a comparison. What input property makes that direction trustworthy?',
    options: ['The array is sorted', 'The target is even', 'The array has eight values'],
    correct: 'The array is sorted',
    explanation: 'The direction decision only works when every value to the left is smaller and every value to the right is larger.',
  }
}

export function verifyRun(
  snapshots: ExecutionSnapshot[],
  expectedIndex: number,
): VerificationResult {
  const finalSnapshot = snapshots[snapshots.length - 1]
  const actual = finalSnapshot?.output ?? null
  const passed = actual === expectedIndex
  return {
    passed,
    actual,
    expected: expectedIndex,
    message: passed
      ? 'Good fix — the interval shrinks and the trace reaches the expected result.'
      : 'The run still disagrees with the expected result. Watch which candidate gets discarded.',
  }
}
