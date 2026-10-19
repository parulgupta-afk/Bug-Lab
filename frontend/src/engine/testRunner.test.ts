import { describe, expect, it } from 'vitest'
import { BINARY_SEARCH_SUITE } from './testCases'
import { makeCustomTestCase, parseCustomTest, runOneTest, runTestSuite, summarizeResults } from './testRunner'

const FIXED = { loop: '<=' as const, highUpdate: 'mid-1' as const }
const BUGGY_LOOP = { loop: '<' as const, highUpdate: 'mid-1' as const }
const BUGGY_HIGH = { loop: '<=' as const, highUpdate: 'mid' as const }

describe('smart test suite', () => {
  it('correct implementation passes all valid cases', () => {
    const results = runTestSuite(FIXED)
    const valid = results.filter((r) => r.status !== 'invalid-input')
    expect(valid.every((r) => r.status === 'passed')).toBe(true)
    expect(results.some((r) => r.status === 'invalid-input')).toBe(true)
  })

  it('buggy loop condition fails at least one boundary/edge case', () => {
    const results = runTestSuite(BUGGY_LOOP)
    expect(results.some((r) => r.status === 'failed')).toBe(true)
  })

  it('infinite-loop variant fails or does not pass all valid cases', () => {
    const results = runTestSuite(BUGGY_HIGH)
    const valid = results.filter((r) => r.status !== 'invalid-input')
    expect(valid.some((r) => r.status !== 'passed')).toBe(true)
  })

  it('runs remaining tests after a failure', () => {
    const results = runTestSuite(BUGGY_LOOP)
    expect(results).toHaveLength(BINARY_SEARCH_SUITE.length)
  })

  it('summary counts match', () => {
    const results = runTestSuite(FIXED)
    const s = summarizeResults(results)
    expect(s.total).toBe(results.length)
    expect(s.passed + s.failed + s.invalid + s.error).toBe(s.total)
  })

  it('empty array expected -1', () => {
    const empty = BINARY_SEARCH_SUITE.find((t) => t.id === 'empty')!
    const r = runOneTest(empty, FIXED)
    expect(r.status).toBe('passed')
    expect(r.actual).toBe(-1)
  })

  it('unsorted classified as invalid-input', () => {
    const u = BINARY_SEARCH_SUITE.find((t) => t.id === 'unsorted')!
    const r = runOneTest(u, FIXED)
    expect(r.status).toBe('invalid-input')
  })

  it('duplicates accept any matching index', () => {
    const d = BINARY_SEARCH_SUITE.find((t) => t.id === 'duplicates')!
    const r = runOneTest(d, FIXED)
    expect(r.status).toBe('passed')
    expect(r.actual).not.toBeNull()
    expect(d.array[r.actual!]).toBe(2)
  })

  it('parseCustomTest validates input', () => {
    expect(parseCustomTest('1, 2, 3', '2').ok).toBe(true)
    expect(parseCustomTest('1, x, 3', '2').ok).toBe(false)
    expect(parseCustomTest('', '2').ok).toBe(true) // empty array allowed
  })

  it('custom unsorted becomes invalid-input category', () => {
    const t = makeCustomTestCase([3, 1, 2], 1)
    expect(t.category).toBe('invalid-input')
  })
})
