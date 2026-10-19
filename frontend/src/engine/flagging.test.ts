import { describe, expect, it } from 'vitest'
import { LINE, runTrace } from './binarySearch'
import { CHALLENGES } from './challenges'
import { evaluateFlag, isSolved } from './flagging'

const [infinite, missing] = CHALLENGES
const infiniteTrace = runTrace(infinite.array, infinite.target, infinite.buggy)
const missingTrace = runTrace(missing.array, missing.target, missing.buggy)

describe('evaluateFlag: The Infinite Loop', () => {
  const last = infiniteTrace.states.length - 1

  it('accepts the buggy line once the failure is visible', () => {
    const r = evaluateFlag(infinite, infiniteTrace, last, LINE.highUpdate)
    expect(r.verdict).toBe('found')
    expect(isSolved(r.verdict)).toBe(true)
    expect(r.message).toContain(`Line ${LINE.highUpdate}`)
  })

  it('accepts the buggy line spotted early, and says the proof is still to come', () => {
    const r = evaluateFlag(infinite, infiniteTrace, 3, LINE.highUpdate)
    expect(r.verdict).toBe('found-early')
    expect(isSolved(r.verdict)).toBe(true)
    expect(r.message).toMatch(/proof/i)
  })

  it('does not judge a wrong line before anything has gone wrong', () => {
    const r = evaluateFlag(infinite, infiniteTrace, 3, LINE.mid)
    expect(r.verdict).toBe('too-early')
    expect(isSolved(r.verdict)).toBe(false)
  })

  it('rejects a wrong line once the failure is visible', () => {
    const r = evaluateFlag(infinite, infiniteTrace, last, LINE.lowUpdate)
    expect(r.verdict).toBe('wrong-line')
    expect(isSolved(r.verdict)).toBe(false)
    expect(r.message).toContain(`line ${LINE.lowUpdate}`)
  })

  it('adds a focusing hint only after the first wrong attempt', () => {
    const first = evaluateFlag(infinite, infiniteTrace, last, LINE.mid, 0)
    const second = evaluateFlag(infinite, infiniteTrace, last, LINE.mid, 1)
    expect(first.message).not.toMatch(/Focus on/)
    expect(second.message).toMatch(/lines that change low or high/)
  })

  it('records which step and line were flagged', () => {
    const r = evaluateFlag(infinite, infiniteTrace, 5, LINE.mid)
    expect(r.stepIndex).toBe(5)
    expect(r.line).toBe(LINE.mid)
  })
})

describe('evaluateFlag: The Missing Element', () => {
  const last = missingTrace.states.length - 1

  it('accepts the loop condition at the end of the run', () => {
    expect(evaluateFlag(missing, missingTrace, last, LINE.loop).verdict).toBe('found')
  })

  it('does not accept the loop condition as visible failure before the run ends', () => {
    expect(evaluateFlag(missing, missingTrace, 4, LINE.loop).verdict).toBe('found-early')
    expect(evaluateFlag(missing, missingTrace, 4, LINE.lessThan).verdict).toBe('too-early')
  })

  it('hints at the line that stops the loop after a wrong attempt', () => {
    const r = evaluateFlag(missing, missingTrace, last, LINE.highUpdate, 1)
    expect(r.verdict).toBe('wrong-line')
    expect(r.message).toMatch(/decides when the loop stops/)
  })
})

describe('evaluateFlag: no failure', () => {
  it('says there is no bug when the run is healthy', () => {
    const healthy = runTrace(infinite.array, 45, infinite.fixed)
    const r = evaluateFlag(infinite, healthy, healthy.states.length - 1, LINE.highUpdate)
    expect(r.verdict).toBe('no-bug')
    expect(isSolved(r.verdict)).toBe(false)
  })
})
