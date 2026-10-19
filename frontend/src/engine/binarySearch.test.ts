import { describe, expect, it } from 'vitest'
import { buildSource, isCorrectResult, LINE, MAX_STEPS, runTrace } from './binarySearch'
import { CHALLENGES } from './challenges'
import type { SearchVariant } from './types'

const FIXED: SearchVariant = { loop: '<=', highUpdate: 'mid-1' }

const SORTED_ARRAYS: number[][] = [
  [],
  [5],
  [2, 9],
  [1, 4, 6],
  [3, 7, 12, 18, 24, 31, 45],
  [3, 7, 12, 18, 24, 31, 45, 52, 67],
  [-8, -3, 0, 2, 2, 5, 9, 9, 9, 14],
]

describe('correct binary search', () => {
  it('returns a correct answer for every target in and around every sorted array', () => {
    for (const arr of SORTED_ARRAYS) {
      const targets = [...arr, -100, 100, ...arr.map((n) => n + 1)]
      for (const target of targets) {
        const trace = runTrace(arr, target, FIXED)
        expect(trace.failure, `arr=${arr} target=${target}`).toBeNull()
        expect(trace.result).not.toBeNull()
        expect(isCorrectResult(arr, target, trace.result as number)).toBe(true)
      }
    }
  })

  it('finds the example target at the right index', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45, 52, 67], 45, FIXED)
    expect(trace.result).toBe(6)
    expect(trace.states.at(-1)?.status).toBe('found')
  })

  it('handles an empty array', () => {
    const trace = runTrace([], 4, FIXED)
    expect(trace.result).toBe(-1)
    expect(trace.states.at(-1)?.status).toBe('not-found')
  })
})

describe('trace shape', () => {
  const trace = runTrace([3, 7, 12, 18, 24, 31, 45], 7, FIXED)

  it('numbers steps from zero without gaps', () => {
    trace.states.forEach((s, i) => expect(s.step).toBe(i))
  })

  it('starts by initialising low and high on lines 2 and 3', () => {
    expect(trace.states[0].line).toBe(LINE.initLow)
    expect(trace.states[0].low).toBe(0)
    expect(trace.states[0].high).toBeNull()
    expect(trace.states[1].line).toBe(LINE.initHigh)
    expect(trace.states[1].high).toBe(6)
  })

  it('only ever points at real, non-blank source lines', () => {
    const source = buildSource(FIXED)
    for (const s of trace.states) {
      expect(source[s.line - 1]?.trim().length).toBeGreaterThan(0)
    }
  })

  it('freezes snapshots so stepping backwards can never see mutated history', () => {
    expect(Object.isFrozen(trace.states[0])).toBe(true)
    expect(Object.isFrozen(trace.states[0].array)).toBe(true)
  })

  it('does not mutate the caller array', () => {
    const input = [1, 2, 3]
    runTrace(input, 2, FIXED)
    expect(input).toEqual([1, 2, 3])
    expect(Object.isFrozen(input)).toBe(false)
  })
})

describe('buildSource', () => {
  it('reflects the variant in the loop condition and the high update', () => {
    const buggy = buildSource({ loop: '<=', highUpdate: 'mid' })
    expect(buggy[LINE.loop - 1]).toContain('low <= high')
    expect(buggy[LINE.highUpdate - 1]).toContain('high = mid;')

    const other = buildSource({ loop: '<', highUpdate: 'mid-1' })
    expect(other[LINE.loop - 1]).toContain('low < high')
    expect(other[LINE.highUpdate - 1]).toContain('high = mid - 1;')
  })

  it('never contains a comment that gives the bug away', () => {
    for (const variant of [FIXED, { loop: '<=', highUpdate: 'mid' } as SearchVariant]) {
      expect(buildSource(variant).join('\n')).not.toMatch(/bug/i)
    }
  })
})

describe('infinite loop detection', () => {
  const variant: SearchVariant = { loop: '<=', highUpdate: 'mid' }

  it('stops with a repeated-window failure instead of running forever', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45, 52, 67], 5, variant)
    expect(trace.failure?.kind).toBe('infinite-loop')
    expect(trace.result).toBeNull()
    expect(trace.states.length).toBeLessThan(MAX_STEPS)
    const last = trace.states.at(-1)!
    expect(last.status).toBe('bug-detected')
    expect(last.line).toBe(LINE.loop)
  })

  it('blames the boundary update that stopped making progress', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45, 52, 67], 5, variant)
    expect(trace.failure?.blameLine).toBe(LINE.highUpdate)
    expect(trace.failure?.explanation).toContain(`line ${LINE.highUpdate}`)
  })

  it('points back at the earlier step whose window was repeated', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45, 52, 67], 5, variant)
    const from = trace.failure?.repeatedFromStep
    expect(from).toBeDefined()
    const earlier = trace.states[from as number]
    const last = trace.states.at(-1)!
    expect(earlier.line).toBe(LINE.loop)
    expect([earlier.low, earlier.high]).toEqual([last.low, last.high])
    expect(from).toBeLessThan(last.step)
  })

  it('does not flag a loop when the same buggy code finds a target that is present', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45, 52, 67], 45, variant)
    expect(trace.failure).toBeNull()
    expect(trace.result).toBe(6)
  })
})

describe('wrong result detection', () => {
  it('flags a normal return of -1 when the target exists', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45], 45, { loop: '<', highUpdate: 'mid-1' })
    expect(trace.result).toBe(-1)
    expect(trace.failure?.kind).toBe('wrong-result')
    expect(trace.states.at(-1)?.status).toBe('bug-detected')
  })

  it('does not flag -1 when the target is genuinely absent', () => {
    const trace = runTrace([3, 7, 12, 18, 24, 31, 45], 8, { loop: '<', highUpdate: 'mid-1' })
    expect(trace.result).toBe(-1)
    expect(trace.failure).toBeNull()
    expect(trace.states.at(-1)?.status).toBe('not-found')
  })
})

describe('challenge configs', () => {
  for (const challenge of CHALLENGES) {
    const isInputAssumption =
      challenge.buggy.loop === challenge.fixed.loop &&
      challenge.buggy.highUpdate === challenge.fixed.highUpdate

    it(`"${challenge.title}" really breaks with its buggy code on its own input`, () => {
      const trace = runTrace(challenge.array, challenge.target, challenge.buggy)
      expect(trace.failure?.kind).toBe(challenge.failureKind)
    })

    it(`"${challenge.title}" is fixed by the correct code on the same input`, () => {
      if (isInputAssumption) {
        // Failure comes from unsorted input; the fixed variant is the same algorithm.
        const trace = runTrace(challenge.array, challenge.target, challenge.fixed)
        expect(trace.failure?.kind).toBe(challenge.failureKind)
        return
      }
      const trace = runTrace(challenge.array, challenge.target, challenge.fixed)
      expect(trace.failure).toBeNull()
      expect(isCorrectResult(challenge.array, challenge.target, trace.result as number)).toBe(true)
    })

    it(`"${challenge.title}" has its bug on a real line that differs between buggy and fixed code`, () => {
      if (isInputAssumption) {
        // No source diff — the teaching point is the sorted-input precondition.
        expect(challenge.bugLine).toBeGreaterThan(0)
        return
      }
      const buggy = buildSource(challenge.buggy)
      const fixed = buildSource(challenge.fixed)
      expect(buggy[challenge.bugLine - 1]).not.toBe(fixed[challenge.bugLine - 1])
      const differing = buggy.map((l, i) => (l !== fixed[i] ? i + 1 : null)).filter(Boolean)
      expect(differing).toEqual([challenge.bugLine])
    })

    it(`"${challenge.title}" has three hints`, () => {
      expect(challenge.hints).toHaveLength(3)
    })
  }
})

describe('assumptions challenge input', () => {
  it('correct algorithm on unsorted array misses a present target', () => {
    const arr = [18, 3, 7, 24, 12]
    const target = 3
    const trace = runTrace(arr, target, { loop: '<=', highUpdate: 'mid-1' })
    expect(arr.includes(target)).toBe(true)
    expect(trace.failure?.kind).toBe('wrong-result')
  })
})
