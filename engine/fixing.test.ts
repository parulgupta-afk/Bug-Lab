import { describe, expect, it } from 'vitest'
import { getChallenge } from './challenges'
import { evaluateFix, getFixOptions, summarizeTrace } from './fixing'
import { runTrace } from './binarySearch'

describe('getFixOptions', () => {
  it('offers exactly one correct option for the infinite-loop challenge', () => {
    const options = getFixOptions(getChallenge('infinite-loop'))
    expect(options.filter((o) => o.isCorrect)).toHaveLength(1)
    expect(options.find((o) => o.isCorrect)?.id).toBe('high-mid-1')
  })

  it('offers exactly one correct option for the missing-element challenge', () => {
    const options = getFixOptions(getChallenge('missing-element'))
    expect(options.filter((o) => o.isCorrect)).toHaveLength(1)
    expect(options.find((o) => o.isCorrect)?.id).toBe('loop-lte')
  })
})

describe('evaluateFix', () => {
  it('accepts the real fix for infinite-loop and produces a clean trace', () => {
    const challenge = getChallenge('infinite-loop')
    const correct = getFixOptions(challenge).find((o) => o.isCorrect)!
    const result = evaluateFix(challenge, correct)
    expect(result.verdict).toBe('correct')
    expect(result.fixedTrace.failure).toBeNull()
    expect(result.fixedTrace.result).toBe(-1) // target 5 is absent
  })

  it('rejects keeping the buggy high = mid', () => {
    const challenge = getChallenge('infinite-loop')
    const wrong = getFixOptions(challenge).find((o) => o.id === 'keep-high-mid')!
    const result = evaluateFix(challenge, wrong)
    expect(result.verdict).toBe('still-broken')
    expect(result.fixedTrace.failure).not.toBeNull()
  })

  it('accepts the real fix for missing-element', () => {
    const challenge = getChallenge('missing-element')
    const correct = getFixOptions(challenge).find((o) => o.isCorrect)!
    const result = evaluateFix(challenge, correct)
    expect(result.verdict).toBe('correct')
    expect(result.fixedTrace.failure).toBeNull()
    expect(result.fixedTrace.result).toBe(6) // 45 is at index 6
  })

  it('rejects keeping while (low < high) on missing-element', () => {
    const challenge = getChallenge('missing-element')
    const wrong = getFixOptions(challenge).find((o) => o.id === 'loop-lt-keep')!
    const result = evaluateFix(challenge, wrong)
    expect(result.verdict).toBe('still-broken')
  })

  it('never trusts the isCorrect label — verification is from the trace', () => {
    const challenge = getChallenge('infinite-loop')
    const options = getFixOptions(challenge)
    for (const opt of options) {
      const result = evaluateFix(challenge, opt)
      if (opt.isCorrect) expect(result.verdict).toBe('correct')
      else expect(result.verdict).not.toBe('correct')
    }
  })
})

describe('summarizeTrace', () => {
  it('captures failure on the buggy infinite-loop run', () => {
    const challenge = getChallenge('infinite-loop')
    const trace = runTrace(challenge.array, challenge.target, challenge.buggy)
    const summary = summarizeTrace(trace)
    expect(summary.failed).toBe(true)
    expect(summary.failureKind).toBe('infinite-loop')
  })

  it('shows no failure after the correct fix', () => {
    const challenge = getChallenge('infinite-loop')
    const correct = getFixOptions(challenge).find((o) => o.isCorrect)!
    const result = evaluateFix(challenge, correct)
    const summary = summarizeTrace(result.fixedTrace)
    expect(summary.failed).toBe(false)
    expect(summary.failureKind).toBeNull()
  })
})
