import { describe, expect, it } from 'vitest'
import { LINE, runTrace } from './binarySearch'
import { CHALLENGES } from './challenges'
import { getPrediction, scoreAnswers } from './predict'
import type { SearchVariant } from './types'

const FIXED: SearchVariant = { loop: '<=', highUpdate: 'mid-1' }

type Case = { name: string; array: number[]; target: number; variant: SearchVariant }

const CASES: Case[] = [
  ...CHALLENGES.flatMap((c) => [
    { name: `${c.title} (buggy)`, array: c.array, target: c.target, variant: c.buggy },
    { name: `${c.title} (fixed)`, array: c.array, target: c.target, variant: c.fixed },
  ]),
  { name: 'present target', array: [3, 7, 12, 18, 24, 31, 45, 52, 67], target: 45, variant: FIXED },
  { name: 'absent target', array: [3, 7, 12, 18, 24, 31, 45, 52, 67], target: 8, variant: FIXED },
  { name: 'single element', array: [5], target: 5, variant: FIXED },
  { name: 'empty array', array: [], target: 5, variant: FIXED },
]

describe('getPrediction', () => {
  for (const c of CASES) {
    describe(c.name, () => {
      const trace = runTrace(c.array, c.target, c.variant)
      const predictions = trace.states.map((_, i) => getPrediction(trace.states, c.variant, i))

      it('never asks on the last step or the two initialisation steps', () => {
        expect(predictions.at(-1)).toBeNull()
        expect(predictions[0]).toBeNull()
      })

      it('always has unique option ids and a correct answer among them', () => {
        for (const p of predictions) {
          if (!p) continue
          const ids = p.options.map((o) => o.id)
          expect(new Set(ids).size).toBe(ids.length)
          expect(ids).toContain(p.correctId)
          expect(p.options.length).toBeGreaterThanOrEqual(2)
        }
      })

      it('has a correct answer that agrees with what the trace really does next', () => {
        predictions.forEach((p, i) => {
          if (!p) return
          const next = trace.states[i + 1]
          const afterNext = trace.states[i + 2]
          if (p.kind === 'loop-condition') {
            // after a true condition the body runs (line 6); after a false one the function returns (line 19).
            // When the trace stops right at the check (loop detected), the condition was true by construction.
            const expectRun = afterNext ? afterNext.line === LINE.mid : next.status === 'bug-detected'
            expect(p.correctId).toBe(expectRun ? 'run' : 'stop')
          } else if (p.kind === 'direction') {
            expect(p.correctId).toBe(afterNext.line === LINE.lowUpdate ? 'low' : 'high')
          } else {
            const value = next.line === LINE.lowUpdate ? next.low : next.high
            expect(p.correctId).toBe(String(value))
          }
        })
      })

      it('only appears at steps where the next line is a decision or an update', () => {
        predictions.forEach((p, i) => {
          if (!p) return
          expect([LINE.loop, LINE.lessThan, LINE.lowUpdate, LINE.highUpdate]).toContain(trace.states[i + 1].line)
          expect(p.stepIndex).toBe(i)
        })
      })

      it('never gives away the code of the line being predicted in the question', () => {
        for (const p of predictions) {
          if (!p) continue
          expect(p.question).not.toMatch(/`/)
          expect(p.question).not.toMatch(/high = mid|low = mid|low <|high </)
        }
      })
    })
  }

  it('asks the crux question for "The Missing Element": a one-element window with a strict < loop', () => {
    const c = CHALLENGES[1]
    const trace = runTrace(c.array, c.target, c.buggy)
    const p = trace.states
      .map((_, i) => getPrediction(trace.states, c.buggy, i))
      .filter((x) => x?.kind === 'loop-condition')
      .at(-1)!
    // the final loop check happens with low = high = 6
    expect(trace.states[p.stepIndex].low).toBe(6)
    expect(trace.states[p.stepIndex].high).toBe(6)
    expect(p.correctId).toBe('stop')
    expect(p.explanation).toContain('low < high')
  })

  it('shows the real code of the buggy update in the explanation for "The Infinite Loop"', () => {
    const c = CHALLENGES[0]
    const trace = runTrace(c.array, c.target, c.buggy)
    const highUpdates = trace.states
      .map((_, i) => getPrediction(trace.states, c.buggy, i))
      .filter((p) => p?.kind === 'update-value' && trace.states[p.stepIndex + 1].line === LINE.highUpdate)
    expect(highUpdates.length).toBeGreaterThan(0)
    for (const p of highUpdates) {
      const mid = trace.states[p!.stepIndex].mid
      expect(p!.correctId).toBe(String(mid))
      expect(p!.options.map((o) => o.id)).toContain(String((mid as number) - 1))
      expect(p!.explanation).toContain('high = mid;')
    }
  })

  it('returns null for out-of-range steps', () => {
    const trace = runTrace([1, 2, 3], 2, FIXED)
    expect(getPrediction(trace.states, FIXED, -1)).toBeNull()
    expect(getPrediction(trace.states, FIXED, 999)).toBeNull()
  })
})

describe('scoreAnswers', () => {
  it('counts correct, wrong and skipped separately', () => {
    expect(
      scoreAnswers({
        1: { choice: 'a', correct: true },
        3: { choice: 'b', correct: false },
        5: { choice: null, correct: false },
        7: { choice: 'c', correct: true },
      }),
    ).toEqual({ answered: 3, correct: 2, skipped: 1 })
  })

  it('handles no answers', () => {
    expect(scoreAnswers({})).toEqual({ answered: 0, correct: 0, skipped: 0 })
  })
})
