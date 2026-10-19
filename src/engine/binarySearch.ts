import type { ExecutionState, Failure, SearchVariant, Status, Trace } from './types'

/**
 * Hard safety net. Repeated-state detection normally catches an infinite loop
 * within a handful of steps; this cap guarantees the simulator can never hang.
 */
export const MAX_STEPS = 200

/** Source line numbers (1-based) for the statements the simulator executes. */
export const LINE = {
  initLow: 2,
  initHigh: 3,
  loop: 5,
  mid: 6,
  equals: 8,
  returnMid: 9,
  lessThan: 12,
  lowUpdate: 13,
  highUpdate: 15,
  returnNotFound: 19,
} as const

/** The code shown in the source panel. It is generated from the variant, so it always matches what runs. */
export function buildSource(variant: SearchVariant): string[] {
  const highRhs = variant.highUpdate === 'mid' ? 'mid' : 'mid - 1'
  return [
    'function binarySearch(arr, target) {', // 1
    '  let low = 0;', // 2
    '  let high = arr.length - 1;', // 3
    '', // 4
    `  while (low ${variant.loop} high) {`, // 5
    '    const mid = Math.floor((low + high) / 2);', // 6
    '', // 7
    '    if (arr[mid] === target) {', // 8
    '      return mid;', // 9
    '    }', // 10
    '', // 11
    '    if (arr[mid] < target) {', // 12
    '      low = mid + 1;', // 13
    '    } else {', // 14
    `      high = ${highRhs};`, // 15
    '    }', // 16
    '  }', // 17
    '', // 18
    '  return -1;', // 19
    '}', // 20
  ]
}

/** Did the function return the right answer for this input? */
export function isCorrectResult(arr: readonly number[], target: number, result: number): boolean {
  if (arr.includes(target)) return result >= 0 && result < arr.length && arr[result] === target
  return result === -1
}

/**
 * Runs binary search one source line at a time and records a snapshot after each line.
 * Nothing here evaluates user code: every supported variant is simulated explicitly,
 * so traces are deterministic and can never freeze the browser.
 */
export function runTrace(input: readonly number[], target: number, variant: SearchVariant): Trace {
  const arr: readonly number[] = Object.freeze([...input])
  const states: ExecutionState[] = []
  const view: { low: number | null; mid: number | null; high: number | null } = {
    low: null,
    mid: null,
    high: null,
  }

  const push = (
    line: number,
    message: string,
    comparison: string | null = null,
    status: Status = 'running',
  ): void => {
    states.push(
      Object.freeze({
        step: states.length,
        line,
        low: view.low,
        mid: view.mid,
        high: view.high,
        array: arr,
        target,
        message,
        comparison,
        status,
      }),
    )
  }

  let result: number | null = null
  let failure: Failure | null = null

  let low = 0
  let high = arr.length - 1

  view.low = low
  push(LINE.initLow, 'low = 0. The search window starts at the first index.')
  view.high = high
  push(
    LINE.initHigh,
    high >= 0
      ? `high = ${high}. The window now covers the whole array, indexes 0 to ${high}.`
      : 'high = -1. The array is empty, so the window contains nothing.',
  )

  /** Search windows (low,high) seen at the loop check, mapped to the step that first saw them. */
  const seenWindows = new Map<string, number>()
  let lastUpdateLine: number | null = null

  for (;;) {
    if (states.length >= MAX_STEPS) {
      const at = states.length - 1
      const last = states[at]
      states[at] = Object.freeze({
        ...last,
        status: 'bug-detected' as const,
        message: `Stopped after ${MAX_STEPS} steps. The program has not finished, so it is almost certainly stuck in a loop.`,
      })
      failure = {
        kind: 'step-limit',
        atStep: at,
        explanation: `The program ran for ${MAX_STEPS} steps without returning.`,
      }
      break
    }

    // ---- line 5: while (low <op> high) -------------------------------------------------
    const key = `${low},${high}`
    const earlier = seenWindows.get(key)
    const keepGoing = variant.loop === '<=' ? low <= high : low < high
    const condText = `low ${variant.loop} high  →  ${low} ${variant.loop} ${high}  →  ${keepGoing}`

    if (earlier !== undefined) {
      push(
        LINE.loop,
        `The window low = ${low}, high = ${high} is exactly the same as at step ${earlier}. Nothing has changed since then, so the loop will repeat forever. Bug Lab stopped tracing here.`,
        condText,
        'bug-detected',
      )
      failure = {
        kind: 'infinite-loop',
        atStep: states.length - 1,
        repeatedFromStep: earlier,
        blameLine: lastUpdateLine ?? undefined,
        explanation: `The search window (low = ${low}, high = ${high}) came back unchanged, so the loop makes no progress. Look at the boundary update on line ${lastUpdateLine ?? '?'}.`,
      }
      break
    }
    seenWindows.set(key, states.length)

    push(
      LINE.loop,
      keepGoing
        ? `The window is low = ${low}, high = ${high}, so the loop body runs again.`
        : `The loop condition is false, so the loop ends.`,
      condText,
    )

    if (!keepGoing) {
      result = -1
      view.mid = null
      const exists = arr.includes(target)
      if (exists) {
        const where = arr.indexOf(target)
        push(
          LINE.returnNotFound,
          `Returned -1 ("not found"), but ${target} is in the array at index ${where}.`,
          null,
          'bug-detected',
        )
        failure = {
          kind: 'wrong-result',
          atStep: states.length - 1,
          blameLine: LINE.loop,
          explanation: `The function returned -1 although ${target} exists at index ${where}. The loop ended before every candidate was checked.`,
        }
      } else {
        push(LINE.returnNotFound, `Returned -1. ${target} is not in the array, so this is correct.`, null, 'not-found')
      }
      break
    }

    // ---- line 6: const mid = floor((low + high) / 2) ------------------------------------
    const mid = Math.floor((low + high) / 2)
    view.mid = mid
    push(
      LINE.mid,
      `mid = floor((${low} + ${high}) / 2) = ${mid}. We will look at arr[${mid}] = ${arr[mid]}.`,
    )

    // ---- line 8: if (arr[mid] === target) ------------------------------------------------
    const isEqual = arr[mid] === target
    push(
      LINE.equals,
      isEqual
        ? `arr[${mid}] = ${arr[mid]} equals the target ${target}.`
        : `arr[${mid}] = ${arr[mid]} is not equal to the target ${target}.`,
      `arr[mid] === target  →  ${arr[mid]} === ${target}  →  ${isEqual}`,
    )

    if (isEqual) {
      result = mid
      push(LINE.returnMid, `Returned ${mid}. Found ${target} at index ${mid}.`, null, 'found')
      break
    }

    // ---- line 12: if (arr[mid] < target) -------------------------------------------------
    const isLess = arr[mid] < target
    push(
      LINE.lessThan,
      isLess
        ? `${arr[mid]} is smaller than ${target}. In a sorted array, ${target} can only be to the right of index ${mid}.`
        : `${arr[mid]} is larger than ${target}. In a sorted array, ${target} can only be to the left of index ${mid}.`,
      `arr[mid] < target  →  ${arr[mid]} < ${target}  →  ${isLess}`,
    )

    if (isLess) {
      // ---- line 13: low = mid + 1 ------------------------------------------------------
      low = mid + 1
      view.low = low
      lastUpdateLine = LINE.lowUpdate
      push(LINE.lowUpdate, `low = mid + 1 = ${low}. Everything up to index ${mid} is now outside the window.`)
    } else {
      // ---- line 15: high = mid (or mid - 1) ---------------------------------------------
      high = variant.highUpdate === 'mid' ? mid : mid - 1
      view.high = high
      lastUpdateLine = LINE.highUpdate
      push(
        LINE.highUpdate,
        variant.highUpdate === 'mid'
          ? `high = mid = ${high}.`
          : `high = mid - 1 = ${high}. Everything from index ${mid} on is now outside the window.`,
      )
    }
  }

  return { states, result, failure }
}
